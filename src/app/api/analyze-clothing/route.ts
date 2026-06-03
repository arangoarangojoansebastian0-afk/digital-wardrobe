import { NextResponse } from "next/server";
import type { ClothingAnalysis } from "@/types/clothing";

const DEFAULT_OUTFIT_SLOT = "accessory";

function isValidClothingAnalysis(value: unknown): value is ClothingAnalysis {
  return typeof value === "object" && value !== null;
}

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function emptyAnalysis(): ClothingAnalysis {
  return {
    title: "",
    category: "",
    type: "",
    color: "",
    style: "",
    season: "",
    tags: [],
    description: "",
    details: "",
    fabric: "",
    fit: "",
    occasion: "",
    formality: "",
    outfit_slot: "accessory",
    outfit_anchor_x: 50,
    outfit_anchor_y: 50,
    outfit_width: 30,
    outfit_layer: 5,
  };
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanSlot(value: unknown) {
  const slot = cleanText(value).toLowerCase();
  const allowedSlots = ["upper", "lower", "outer", "dress", "shoes", "accessory"] as const;
  return allowedSlots.includes(slot as any) ? slot as typeof allowedSlots[number] : DEFAULT_OUTFIT_SLOT;
}

function cleanTags(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(cleanText).filter(Boolean).slice(0, 8);
}

function cleanNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function normalizeAnalysis(value: unknown): ClothingAnalysis {
  if (!value || typeof value !== "object") return emptyAnalysis();
  const record = value as Record<string, unknown>;

  return {
    title: cleanText(record.title),
    category: cleanText(record.category),
    type: cleanText(record.type),
    color: cleanText(record.color),
    style: cleanText(record.style),
    season: cleanText(record.season),
    tags: cleanTags(record.tags),
    description: cleanText(record.description),
    details: cleanText(record.details),
    fabric: cleanText(record.fabric),
    fit: cleanText(record.fit),
    occasion: cleanText(record.occasion),
    formality: cleanText(record.formality),
    outfit_slot: cleanSlot(record.outfit_slot),
    outfit_anchor_x: cleanNumber(record.outfit_anchor_x, 50, 0, 100),
    outfit_anchor_y: cleanNumber(record.outfit_anchor_y, 50, 0, 100),
    outfit_width: cleanNumber(record.outfit_width, 30, 5, 95),
    outfit_layer: Math.round(cleanNumber(record.outfit_layer, 5, 1, 20)),
  };
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function resolveUrl(sourceUrl: string, candidateUrl: string) {
  try {
    return new URL(candidateUrl, sourceUrl).toString();
  } catch {
    return "";
  }
}

function extractImageUrlFromHtml(html: string, sourceUrl: string) {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["'][^>]*>/i,
    /<img[^>]+src=["']([^"']+)["'][^>]*>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    const candidate = match?.[1];
    if (candidate) {
      const resolved = resolveUrl(sourceUrl, candidate.replace(/&amp;/g, "&"));
      if (resolved && isHttpUrl(resolved)) return resolved;
    }
  }

  return "";
}

async function fileToInlineData(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("La imagen es demasiado pesada para analizarla.");
  }

  return {
    mime_type: file.type || "image/png",
    data: buffer.toString("base64"),
  };
}

async function urlToInlineData(imageUrl: string) {
  if (!isHttpUrl(imageUrl)) {
    throw new Error("La URL debe empezar por http:// o https://.");
  }

  const response = await fetch(imageUrl, {
    headers: {
      Accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8,text/html;q=0.7,*/*;q=0.5",
    },
  });
  if (!response.ok) {
    throw new Error("No se pudo descargar la imagen.");
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.toLowerCase().includes("text/html")) {
    const html = await response.text();
    const extractedImageUrl = extractImageUrlFromHtml(html, imageUrl);
    if (!extractedImageUrl || extractedImageUrl === imageUrl) {
      throw new Error("La pagina no contiene una imagen detectable.");
    }

    return urlToInlineData(extractedImageUrl);
  }

  const mimeType = contentType.split(";")[0] || "image/png";
  if (!mimeType.startsWith("image/")) {
    throw new Error("La URL no devuelve una imagen valida.");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("La imagen es demasiado pesada para analizarla.");
  }

  return {
    mime_type: mimeType,
    data: buffer.toString("base64"),
  };
}

function parseJson(text: string) {
  const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("Gemini no devolvio JSON.");
  }

  return JSON.parse(trimmed.slice(start, end + 1));
}

async function callGemini(model: string, inlineData: { mime_type: string; data: string }) {
  const prompt = `Analiza esta prenda de ropa para un armario digital.

Devuelve SOLO JSON valido, sin markdown, con estas claves:
{
  "title": "nombre corto y natural de la prenda",
  "category": "categoria principal en plural, por ejemplo Pantalones, Tops, Chaquetas, Vestidos, Zapatos, Accesorios",
  "type": "tipo especifico, por ejemplo pantalon recto, camisa, blazer, zapatillas",
  "color": "color o colores dominantes",
  "style": "estilo visual: casual, elegante, urbano, minimalista, deportivo, bohemio, formal, etc.",
  "season": "temporada sugerida: calor, frio, entretiempo o todo el año",
  "tags": ["3 a 8 etiquetas utiles"],
  "description": "descripcion breve para mostrar en la ficha",
  "details": "detalles visibles: corte, textura, estampado, tiro, mangas, cuello, acabado, silueta",
  "fabric": "material probable si se puede inferir; si no, deja vacio",
  "fit": "ajuste o silueta probable",
  "occasion": "ocasiones donde funciona",
  "formality": "nivel de formalidad: bajo, medio o alto"
}

No inventes marca. Si algo no se ve con claridad, usa una inferencia prudente. Responde en español.`;

  const promptWithOutfitMetadata = `${prompt}

Incluye tambien estos campos tecnicos ocultos para ajustar la prenda a un maniqui 2D:
- outfit_slot: upper, lower, outer, dress, shoes o accessory.
- outfit_anchor_x: porcentaje horizontal del punto central recomendado en el lienzo.
- outfit_anchor_y: porcentaje vertical del punto central recomendado en el lienzo.
- outfit_width: porcentaje de ancho recomendado de la prenda en el lienzo.
- outfit_layer: orden visual del 1 al 20.
Valores base: upper 50/34/38/8, lower 50/58/35/6, dress 50/48/44/9, outer 50/36/46/12, shoes 50/86/34/10, accessory 50/28/24/14.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY || "",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: promptWithOutfitMetadata },
              { inline_data: inlineData },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          maxOutputTokens: 900,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text)
      .filter(Boolean)
      .join("\n") || "";

  return normalizeAnalysis(parseJson(text));
}

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Falta configurar GEMINI_API_KEY." }, { status: 500 });
    }

    const formData = await req.formData();
    const image = formData.get("image");
    const imageUrl = getString(formData, "imageUrl");

    if (!(image instanceof File && image.size > 0) && !imageUrl) {
      return NextResponse.json({ error: "No se recibio ninguna imagen." }, { status: 400 });
    }

    const inlineData =
      image instanceof File && image.size > 0
        ? await fileToInlineData(image)
        : await urlToInlineData(imageUrl);

    let lastError = "";

    for (const model of GEMINI_MODELS) {
      try {
        const analysis = await callGemini(model, inlineData);
        return NextResponse.json({ analysis, model });
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        console.error(`Analyze clothing error (${model}):`, lastError);
      }
    }

    return NextResponse.json(
      {
        error: "No se pudo analizar la prenda con Gemini.",
        details: process.env.NODE_ENV === "development" ? lastError : undefined,
      },
      { status: 503 }
    );
  } catch (error) {
    console.error("Analyze clothing route error:", error);
    const message = error instanceof Error ? error.message : "Error del servidor al analizar la prenda.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
