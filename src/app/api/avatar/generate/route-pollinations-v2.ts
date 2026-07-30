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

// Pollinations movió "kontext" (edición imagen-a-imagen) a su endpoint nuevo
// OpenAI-compatible: POST gen.pollinations.ai/v1/images/edits, con las
// imágenes de entrada como multipart/form-data. El viejo endpoint por GET
// (image.pollinations.ai/prompt/...?model=kontext) ya no sirve este modelo.
const EDITS_URL = "https://gen.pollinations.ai/v1/images/edits";
const POLLINATIONS_TOKEN = process.env.POLLINATIONS_API_KEY || "";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 45000; // kontext puede tardar 10-20s

function buildPrompt(profile: BodyProfile, items: ClothingItem[], extraPrompt?: string) {
  const measurements = [
    `altura ${profile.height_cm} cm`,
    `ancho de hombros ${profile.shoulder_width_cm} cm`,
    `contorno de pecho ${profile.chest_circumference_cm} cm`,
    `contorno de cintura ${profile.waist_circumference_cm} cm`,
    `contorno de cadera ${profile.hip_circumference_cm} cm`,
    `forma corporal ${profile.body_shape}`,
  ].join(", ");

  const itemDescriptions = items.map((item, index) => {
    const details = [
      item.title ? `título: '${item.title}'` : null,
      item.category ? `categoría: ${item.category}` : null,
      item.color ? `color: ${item.color}` : null,
    ].filter(Boolean).join(", ");
    return `Prenda ${index + 1} (imagen adjunta): ${details || "sin descripción"}`;
  }).join("; ");

  return [
    "Viste al maniquí o persona de la primera imagen adjunta con las prendas reales que se muestran en las siguientes imágenes de referencia.",
    "Respeta exactamente el color, la textura, el estampado y el diseño de cada prenda tal como aparece en su foto. No inventes ni sustituyas ninguna prenda por otra distinta.",
    `Medidas corporales de referencia: ${measurements}.`,
    itemDescriptions ? `Prendas a colocar: ${itemDescriptions}.` : "",
    "No deformes el cuerpo ni cambies la silueta original al agregar la ropa. Fondo de estudio neutro, vista frontal, cuerpo completo, iluminación uniforme.",
    extraPrompt || "",
  ].filter(Boolean).join(" ");
}

async function fetchImageAsBlob(url: string): Promise<{ blob: Blob; filename: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`No se pudo descargar imagen (${response.status}):`, url);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
      console.warn("Imagen demasiado pesada, se omite:", url);
      return null;
    }

    const contentType = response.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    const ext = contentType.split("/")[1] || "jpg";
    const blob = new Blob([arrayBuffer], { type: contentType });
    return { blob, filename: `image.${ext}` };
  } catch (error) {
    console.warn("Error descargando imagen para Nano Banana:", url, error);
    return null;
  }
}

function extractImageFromResponse(data: any): string | null {
  const entry = data?.data?.[0];
  if (!entry) return null;

  if (typeof entry.b64_json === "string") {
    const mime = entry.mime_type || "image/png";
    return `data:${mime};base64,${entry.b64_json}`;
  }
  if (typeof entry.url === "string") {
    return entry.url;
  }
  return null;
}

export async function POST(req: Request) {
  if (!POLLINATIONS_TOKEN) {
    return NextResponse.json(
      { error: "Falta configurar POLLINATIONS_API_KEY (token gratis en https://auth.pollinations.ai)." },
      { status: 500 }
    );
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

  // Reunimos las imágenes de referencia: primero la foto del usuario/avatar
  // (para mantener cuerpo/rostro consistentes), luego cada prenda real.
  const imageUrls: string[] = [];
  if (body.reference_image_url) imageUrls.push(body.reference_image_url);
  for (const item of body.items) {
    if (item.image) imageUrls.push(item.image);
  }

  if (imageUrls.length === 0) {
    return NextResponse.json(
      { error: "Se requiere al menos una imagen (foto de referencia o de una prenda) para generar la vista." },
      { status: 400 }
    );
  }

  try {
    const downloaded = (await Promise.all(imageUrls.map(fetchImageAsBlob))).filter(
      (item): item is { blob: Blob; filename: string } => item !== null
    );

    if (downloaded.length === 0) {
      return NextResponse.json(
        { error: "No se pudo descargar ninguna de las imágenes de referencia." },
        { status: 502 }
      );
    }

    const prompt = buildPrompt(body.profile, body.items, body.extra_prompt);

    const formData = new FormData();
    formData.append("model", "kontext");
    formData.append("prompt", prompt);
    formData.append("response_format", "b64_json");
    for (const { blob, filename } of downloaded) {
      formData.append("image", blob, filename);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(EDITS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${POLLINATIONS_TOKEN}`,
      },
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const rawText = await response.text().catch(() => "");

    if (!response.ok) {
      console.error("Pollinations /v1/images/edits error:", response.status, rawText);
      return NextResponse.json<NanoBananaResponse>(
        { error: "Pollinations no pudo generar la imagen.", message: rawText || `Status ${response.status}` },
        { status: 502 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return NextResponse.json<NanoBananaResponse>(
        { error: "Respuesta no válida de Pollinations.", message: rawText },
        { status: 502 }
      );
    }

    const generatedImage = extractImageFromResponse(parsed);

    if (!generatedImage) {
      console.error("Pollinations no devolvió imagen:", parsed);
      return NextResponse.json<NanoBananaResponse>(
        { error: "Pollinations no devolvió una imagen válida.", message: JSON.stringify(parsed) },
        { status: 502 }
      );
    }

    return NextResponse.json<NanoBananaResponse>({ generated_image: generatedImage });
  } catch (error) {
    console.error("Nano Banana (Pollinations) route error:", error);
    const message = error instanceof Error ? error.message : "Error al generar la imagen con Pollinations.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
