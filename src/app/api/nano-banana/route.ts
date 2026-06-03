import { NextResponse } from "next/server";
import type { BodyProfile } from "@/types/mannequin";
import type { ClothingItem } from "@/types/clothing";

type NanoBananaRequest = {
  profile: BodyProfile;
  items: ClothingItem[];
  extra_prompt?: string;
  reference_image_url?: string;
};

type NanoBananaResponse = {
  generated_image?: string;
  error?: string;
  message?: string;
};

const API_URL = process.env.NANO_BANANA_API_URL || "https://generativelanguage.googleapis.com/v1/images:generate";
const API_KEY = process.env.NANO_BANANA_API_KEY || process.env.GEMINI_API_KEY;

function buildNanoBananaPrompt(profile: BodyProfile, items: ClothingItem[], extraPrompt?: string, referenceImageUrl?: string) {
  const measurements = [
    `Altura: ${profile.height_cm} cm`,
    `Ancho de hombros: ${profile.shoulder_width_cm} cm`,
    `Pecho: ${profile.chest_circumference_cm} cm`,
    `Cintura: ${profile.waist_circumference_cm} cm`,
    `Cadera: ${profile.hip_circumference_cm} cm`,
    `Forma corporal: ${profile.body_shape}`,
  ].join("; ");

  const itemDescriptions = items.map((item, index) => {
    const details = [
      item.title ? `titulo: '${item.title}'` : null,
      item.category ? `categoria: ${item.category}` : null,
      item.color ? `color: ${item.color}` : null,
      item.style ? `estilo: ${item.style}` : null,
      item.fit ? `fit: ${item.fit}` : null,
    ].filter(Boolean).join(", ");

    return `Prenda ${index + 1}: ${details || "sin descripcion"}`;
  }).join("; ");

  return [`Genera una imagen de un maniquí frontal con un cuerpo humanoide neutro.`,
    `El cuerpo debe permanecer fijo y no debe cambiar su forma al agregar o ajustar la ropa.`,
    `Coloca las prendas sin deformar la silueta del maniquí.`,
    `Mantén un look limpio, realista, con el cuerpo del maniquí como base neutra.`,
    `Medidas del cuerpo: ${measurements}.`,
    `Prendas seleccionadas: ${itemDescriptions}.`,
    referenceImageUrl ? `Usa la foto de referencia del usuario para que el maniquí tenga rasgos faciales parecidos y la cara se vea natural: ${referenceImageUrl}.` : "",
    extraPrompt ? extraPrompt : ""
  ].filter(Boolean).join(" ");
}

export async function POST(req: Request) {
  if (!API_URL || !API_KEY) {
    return NextResponse.json({ error: "Falta configurar NANO_BANANA_API_URL o NANO_BANANA_API_KEY." }, { status: 500 });
  }

  let body: NanoBananaRequest;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  if (!body?.profile || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Se requiere perfil corporal y al menos una prenda." }, { status: 400 });
  }

  const prompt = buildNanoBananaPrompt(body.profile, body.items, body.extra_prompt, body.reference_image_url);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const isGoogleImage = API_URL.includes("generativelanguage.googleapis.com/v1/images");

    let fetchUrl = API_URL;
    if (isGoogleImage && API_KEY) {
      try {
        const u = new URL(API_URL);
        if (!u.searchParams.has("key")) u.searchParams.set("key", API_KEY);
        fetchUrl = u.toString();
      } catch (e) {
        console.warn("Could not append key to API_URL", e);
      }
    }

    if (!isGoogleImage && API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;

    const requestBody = isGoogleImage
      ? { model: "image-bison-001", prompt, image_format: "PNG" }
      : { prompt, width: 640, height: 960, quality: "high", preserve_body: true, style: "realistic mannequin" };

    const response = await fetch(fetchUrl, { method: "POST", headers, body: JSON.stringify(requestBody) });

    // TEMP LOG: volcar respuesta cruda para depuración
    const rawText = await response.text().catch(() => "");
    console.log("NANO_BANANA_RAW_RESPONSE_STATUS", response.status);
    console.log("NANO_BANANA_RAW_RESPONSE_BODY", rawText);

    let parsed: unknown;
    try { parsed = JSON.parse(rawText); } catch { parsed = rawText; }

    if (!response.ok) {
      let message = rawText || `Status ${response.status}`;
      if (parsed && typeof parsed === "object") {
        const obj = parsed as Record<string, unknown>;
        if (typeof obj["error"] === "string") message = obj["error"] as string;
        else if (typeof obj["message"] === "string") message = obj["message"] as string;
      }
      console.error("Nano Banana API error status:", response.status, parsed);
      return NextResponse.json({ error: "Nano Banana no respondió correctamente.", message }, { status: 502 });
    }

    let rawImage: string | undefined = undefined;
    if (typeof parsed === "string") {
      rawImage = parsed;
    } else if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;

      const candidates: Array<string | undefined> = [];
      if (typeof obj["generated_image"] === "string") candidates.push(obj["generated_image"] as string);
      if (typeof obj["image_base64"] === "string") candidates.push(obj["image_base64"] as string);

      const result = obj["result"];
      if (result && typeof result === "object" && typeof (result as Record<string, unknown>)["base64"] === "string") candidates.push((result as Record<string, unknown>)["base64"] as string);

      const output = obj["output"];
      if (Array.isArray(output) && output.length > 0 && typeof output[0] === "object") {
        const first = output[0] as Record<string, unknown>;
        if (typeof first["base64"] === "string") candidates.push(first["base64"] as string);
        if (typeof first["image_url"] === "string") candidates.push(first["image_url"] as string);
      }

      if (typeof obj["image_url"] === "string") candidates.push(obj["image_url"] as string);
      if (typeof obj["url"] === "string") candidates.push(obj["url"] as string);

      const images = obj["images"];
      if (Array.isArray(images) && images.length > 0 && typeof images[0] === "object") {
        const firstImg = images[0] as Record<string, unknown>;
        if (typeof firstImg["imageUri"] === "string") candidates.push(firstImg["imageUri"] as string);
      }

      const dataArr = obj["data"];
      if (Array.isArray(dataArr) && dataArr.length > 0 && typeof dataArr[0] === "object") {
        const firstData = dataArr[0] as Record<string, unknown>;
        if (typeof firstData["image"] === "string") candidates.push(firstData["image"] as string);
        if (typeof firstData["imageBytes"] === "string") candidates.push(firstData["imageBytes"] as string);
      }

      if (typeof obj["imageBytes"] === "string") candidates.push(obj["imageBytes"] as string);

      rawImage = candidates.find((c) => typeof c === "string");
    }

    if (!rawImage) {
      console.error("Nano Banana response no contiene imagen válida:", parsed ?? rawText);
      return NextResponse.json({ error: "La API de Nano Banana no devolvió imagen generada.", debug: parsed ?? rawText }, { status: 502 });
    }

    const generatedImage = typeof rawImage === "string" && (rawImage as string).startsWith("http") ? (rawImage as string) : `data:image/png;base64,${rawImage}`;
    return NextResponse.json<NanoBananaResponse>({ generated_image: generatedImage });
  } catch (error) {
    console.error("Nano Banana route error:", error);
    return NextResponse.json({ error: "Error al generar la imagen con Nano Banana." }, { status: 500 });
  }
}
