import { NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ClothingItem = {
  id?: string | number;
  title?: string | null;
  category?: string | null;
  image?: string | null;
  type?: string | null;
  color?: string | null;
  style?: string | null;
  season?: string | null;
  description?: string | null;
  details?: string | null;
  fabric?: string | null;
  fit?: string | null;
  occasion?: string | null;
  formality?: string | null;
  tags?: string[] | null;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

type GeminiPart = {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string;
  };
};

type GeminiContent = {
  role: "user" | "model";
  parts: GeminiPart[];
};

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
const MAX_WARDROBE_IMAGES = 12;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) return [];

  return messages
    .map((message) => {
      if (!message || typeof message !== "object") return null;
      const candidate = message as Partial<ChatMessage>;
      const content = cleanText(candidate.content);
      if (!content || (candidate.role !== "user" && candidate.role !== "assistant")) {
        return null;
      }

      return { role: candidate.role, content };
    })
    .filter((message): message is ChatMessage => Boolean(message))
    .slice(-12);
}

function normalizeClothes(clothes: unknown): ClothingItem[] {
  if (!Array.isArray(clothes)) return [];

  return clothes
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const clothing = item as ClothingItem;
      const title = cleanText(clothing.title);
      const category = cleanText(clothing.category);

      if (!title && !category) return null;

      const normalized: ClothingItem = {
        id: clothing.id,
        title: title || "Prenda sin nombre",
        category: category || "Sin categoria",
        image: cleanText(clothing.image),
        type: cleanText(clothing.type),
        color: cleanText(clothing.color),
        style: cleanText(clothing.style),
        season: cleanText(clothing.season),
        description: cleanText(clothing.description),
        details: cleanText(clothing.details),
        fabric: cleanText(clothing.fabric),
        fit: cleanText(clothing.fit),
        occasion: cleanText(clothing.occasion),
        formality: cleanText(clothing.formality),
        tags: Array.isArray(clothing.tags)
          ? clothing.tags.map(cleanText).filter(Boolean).slice(0, 8)
          : [],
      };

      return normalized;
    })
    .filter((item): item is ClothingItem => Boolean(item))
    .slice(0, 80);
}

function describeClothing(item: ClothingItem, index: number) {
  const details = [
    item.category && `categoria: ${item.category}`,
    item.type && `tipo: ${item.type}`,
    item.color && `color: ${item.color}`,
    item.style && `estilo: ${item.style}`,
    item.season && `temporada: ${item.season}`,
    item.fabric && `tela: ${item.fabric}`,
    item.fit && `silueta: ${item.fit}`,
    item.occasion && `ocasion: ${item.occasion}`,
    item.formality && `formalidad: ${item.formality}`,
    item.description && `descripcion: ${item.description}`,
    item.details && `detalles: ${item.details}`,
    item.tags?.length ? `tags: ${item.tags.join(", ")}` : "",
  ].filter(Boolean);

  return `${index + 1}. ${item.title}${details.length ? ` (${details.join("; ")})` : ""}`;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function imageUrlToPart(item: ClothingItem, index: number): Promise<GeminiPart[]> {
  const imageUrl = cleanText(item.image);
  if (!imageUrl || !isHttpUrl(imageUrl)) return [];

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return [];

    const mimeType = response.headers.get("content-type")?.split(";")[0] || "image/png";
    if (!mimeType.startsWith("image/")) return [];

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > MAX_IMAGE_BYTES) return [];

    return [
      { text: `Imagen ${index + 1}: ${item.title} (${item.category || "Sin categoria"})` },
      {
        inline_data: {
          mime_type: mimeType,
          data: buffer.toString("base64"),
        },
      },
    ];
  } catch (error) {
    console.warn(`No se pudo adjuntar imagen de ${item.title}:`, error);
    return [];
  }
}

function buildWardrobeContext(clothes: ClothingItem[]) {
  if (clothes.length === 0) {
    return "ARMARIO DEL USUARIO: no hay prendas registradas todavia.";
  }

  const categories = clothes.reduce<Record<string, number>>((acc, item) => {
    const category = item.category || "Sin categoria";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  return [
    `ARMARIO DEL USUARIO (${clothes.length} prendas):`,
    `Categorias disponibles: ${Object.entries(categories)
      .map(([category, count]) => `${category} (${count})`)
      .join(", ")}.`,
    "Inventario exacto:",
    clothes.map(describeClothing).join("\n"),
  ].join("\n");
}

function buildSystemPrompt(clothes: ClothingItem[]) {
  return `Eres Stylist, una estilista personal experta. Hablas siempre en espanol claro, natural y elegante.

${buildWardrobeContext(clothes)}

Reglas importantes:
- Responde de forma conversacional: pregunta lo necesario si faltan datos de ocasion, clima, hora o nivel de formalidad.
- Antes de recomendar, revisa el inventario y usa prendas concretas del armario. Menciona sus nombres exactos.
- No inventes prendas que no aparecen en el inventario. Si hace falta una pieza externa, separala bajo "Para completar".
- Si el usuario pide "con mis jeans", "algo frio", "para cena" o algo ambiguo, infiere con cuidado desde categorias, colores, estilos y temporadas.
- Usa tambien descripcion, detalles visibles, tela, silueta, ocasion y formalidad cuando existan.
- Si hay pocas prendas o datos incompletos, ofrece la mejor combinacion posible y explica que dato falta.
- Da maximo 2 outfits por respuesta salvo que el usuario pida mas.
- Formato recomendado: breve idea general, prendas exactas, por que funciona, ajuste opcional.
- Evita sonar generica; cada respuesta debe demostrar que viste el armario disponible.`;
}

function buildAnalysisPrompt(clothes: ClothingItem[]) {
  if (clothes.length === 0) {
    return "No hay prendas para analizar. Indica al usuario que agregue prendas y ofrece una lista breve de basicos para empezar.";
  }

  return `Analiza el armario antes de responder:
1. Identifica categorias disponibles y posibles huecos.
2. Detecta prendas protagonistas y prendas comodin por color, estilo, temporada y tags.
3. Elige combinaciones usando solo nombres exactos del inventario.
4. Si falta algo, dilo como sugerencia externa, no como si ya existiera.`;
}

function toGeminiContents(messages: ChatMessage[]): GeminiContent[] {
  return messages
    .filter((message, index) => {
      const isInitialAssistant =
        index === 0 &&
        message.role === "assistant" &&
        (message.content.toLowerCase().includes("soy tu estilista personal") ||
          message.content.toLowerCase().includes("soy tu stylist personal"));

      return !isInitialAssistant;
    })
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));
}

async function buildVisualWardrobeContent(clothes: ClothingItem[]): Promise<GeminiContent | null> {
  const parts: GeminiPart[] = [
    {
      text:
        "Estas son imagenes reales de prendas del armario. Usalas para inferir color, textura, formalidad, silueta y combinaciones. No inventes prendas fuera de estas imagenes y el inventario.",
    },
  ];

  for (const [index, item] of clothes.slice(0, MAX_WARDROBE_IMAGES).entries()) {
    parts.push(...(await imageUrlToPart(item, index)));
  }

  return parts.length > 1 ? { role: "user", parts } : null;
}

async function callGemini(model: string, systemPrompt: string, contents: GeminiContent[]) {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY || "",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents,
        generationConfig: {
          temperature: 0.45,
          topP: 0.9,
          maxOutputTokens: 1100,
        },
      }),
    }
  );
}

function extractGeminiText(data: GeminiResponse) {
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text)
      .filter(Boolean)
      .join("\n")
      .trim() || ""
  );
}

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Falta configurar GEMINI_API_KEY." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const messages = normalizeMessages(body?.messages);
    const clothes = normalizeClothes(body?.clothes);
    const visualWardrobeContent = await buildVisualWardrobeContent(clothes);
    const contents = [
      ...(visualWardrobeContent ? [visualWardrobeContent] : []),
      ...toGeminiContents(messages),
    ];
    const systemPrompt = `${buildSystemPrompt(clothes)}

${buildAnalysisPrompt(clothes)}`;

    if (contents.length === 0) {
      return NextResponse.json(
        { error: "Escribe un mensaje para tu stylist." },
        { status: 400 }
      );
    }

    let lastError = "";

    for (const model of GEMINI_MODELS) {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const response = await callGemini(model, systemPrompt, contents);

        if (response.ok) {
          const data = await response.json();
          const text =
            extractGeminiText(data) ||
            "No pude generar una respuesta clara. Probemos con mas detalle de ocasion, clima o estilo.";

          return NextResponse.json({ message: text, model });
        }

        const errorBody = await response.text();
        lastError = errorBody;
        console.error(`Gemini stylist error (${model}, attempt ${attempt + 1}):`, errorBody);

        if (response.status !== 429 && response.status < 500) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
      }
    }

    return NextResponse.json(
      {
        error: "Gemini no pudo responder en este momento. Intenta de nuevo en unos segundos.",
        details: process.env.NODE_ENV === "development" ? lastError : undefined,
      },
      { status: 503 }
    );
  } catch (error) {
    console.error("Stylist route error:", error);
    return NextResponse.json(
      { error: "Error del servidor al hablar con Stylist." },
      { status: 500 }
    );
  }
}
