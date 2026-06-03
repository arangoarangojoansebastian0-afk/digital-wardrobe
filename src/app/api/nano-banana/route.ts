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

    // If using Google's Generative API for images, prefer attaching the API key
    // as a query parameter (`?key=...`) which is accepted by that endpoint.
    let fetchUrl = API_URL;
    if (isGoogleImage && API_KEY) {
      try {
        const u = new URL(API_URL);
        if (!u.searchParams.has("key")) {
          u.searchParams.set("key", API_KEY);
        }
        fetchUrl = u.toString();
      } catch (e) {
        // if URL parsing fails, fall back to the original API_URL
        console.warn("Could not append key to API_URL", e);
      }
    }

    if (!isGoogleImage) {
      // For non-Google providers use bearer token in Authorization
      if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;
    }

    const requestBody = isGoogleImage
      ? {
          model: "image-bison-001",
          prompt,
          image_format: "PNG",
        }
      : {
          prompt,
          width: 640,
          height: 960,
          quality: "high",
          preserve_body: true,
          style: "realistic mannequin",
        };

    const response = await fetch(fetchUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      let parsed: any = null;
      try {
        parsed = JSON.parse(text);
      } catch {}
      console.error("Nano Banana API error status:", response.status, parsed ?? text);
      const message = parsed?.error || parsed?.message || text || `Status ${response.status}`;
      return NextResponse.json({ error: "Nano Banana no respondió correctamente.", message }, { status: 502 });
    }

    const data = await response.json();
    const rawImage =
      data?.generated_image ||
      data?.image_base64 ||
      data?.result?.base64 ||
      data?.output?.[0]?.base64 ||
      data?.output?.[0]?.image_url ||
      data?.image_url ||
      data?.url ||
      data?.images?.[0]?.imageUri ||
      data?.data?.[0]?.image ||
      data?.data?.[0]?.imageBytes ||
      data?.imageBytes;

    if (!rawImage) {
      console.error("Nano Banana response no contiene imagen válida:", data);
      return NextResponse.json({ error: "La API de Nano Banana no devolvió imagen generada." }, { status: 502 });
    }

    const generatedImage = typeof rawImage === "string" && rawImage.startsWith("http")
      ? rawImage
      : `data:image/png;base64,${rawImage}`;

    return NextResponse.json<NanoBananaResponse>({ generated_image: generatedImage });
  } catch (error) {
    console.error("Nano Banana route error:", error);
    return NextResponse.json({ error: "Error al generar la imagen con Nano Banana." }, { status: 500 });
  }
}
