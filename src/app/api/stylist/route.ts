import { NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ClothingItem = {
  id: string | number;
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
  is_available?: boolean; 
};

type RequestContext = {
  mood?: string;             
  city?: string;             
  temperature?: string;      
  disliked_colors?: string[]; 
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
const MAX_WARDROBE_IMAGES = 3;
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
      if (clothing.is_available === false) return null;

      // Conservamos absolutamente todos los campos enriquecidos generados por tu análisis
      const normalized: ClothingItem = {
        id: clothing.id || Math.random().toString(),
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
  // Aquí garantizamos que la IA lea cada uno de los campos que rellenó tu análisis previo
  const details = [
    `ID: ${item.id}`,
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

  return `${index + 1}. '${item.title}' (${details.join("; ")})`;
}

function buildWardrobeContext(clothes: ClothingItem[]) {
  if (clothes.length === 0) {
    return "ARMARIO DEL USUARIO: No tienes prendas limpias o registradas en este momento.";
  }

  return [
    "ARMARIO DISPONIBLE (Solo prendas limpias):",
    "Inventario exacto con especificaciones analizadas:",
    clothes.map(describeClothing).join("\n"),
  ].join("\n");
}

function buildSystemPrompt(clothes: ClothingItem[], appCtx: RequestContext) {
  const ciudad = appCtx.city || "Medellín, Colombia";
  const clima = appCtx.temperature || "Templado (24°C)";
  const animo = appCtx.mood ? `El usuario prefiere un enfoque de estilo: ${appCtx.mood}.` : "Estilo libre, urbano y vanguardista.";
  const restricciones = appCtx.disliked_colors?.length 
    ? `PROHIBIDO sugerir los siguientes colores porque al usuario le chocan: ${appCtx.disliked_colors.join(", ")}.`
    : "";

  return `Eres el motor de Inteligencia Artificial de "Armario Digital", un Stylist de moda personal, vanguardista, directo y con mucha actitud. Tu trabajo es armar outfits brutales basados en el inventario real disponible del usuario y recomendar compras estratégicas.

CONTEXTO ACTUAL DEL ENTORNO EN TIEMPO REAL:
- Ubicación del usuario: ${ciudad}
- Clima / Temperatura actual: ${clima}
- Enfoque de estilo seleccionado: ${animo}
${restricciones}

${buildWardrobeContext(clothes)}

REGLAS DE INTERACCIÓN Y SALUDOS:
1. DETECTAR SALUDOS CORTOS: Si el usuario te envía un mensaje corto (ej: "Hola", "Buenas"), NO inventes un outfit. Saluda con actitud corta y pregunta para qué evento o plan se va a vestir aprovechando el clima actual de ${ciudad}.

REGLAS DE COMPRAS Y ENLACES INTEGRADOS:
2. CUÁNDO SUGERIR COMPRAS: Solo recomienda comprar si el usuario lo pide o si falta una pieza (superior o inferior) obligatoria para cerrar el look.
3. CONTROL DE ENLACES LIMPIOS: Tienes prohibido usar sub-enlaces rotos. Usa únicamente estos dominios base en texto plano:
   - H&M Colombia: [H&M: https://co.hm.com]
   - Zara Colombia: [Zara: https://www.zara.com/co/]
   - Bershka Colombia: [Bershka: https://www.bershka.com/co/]
   - Amazon: [Amazon: https://www.amazon.com]

REGLAS CRUCIALES DE OBLIGATORIEDAD Y FORMATO (ESTRICTAS):
4. OUTFIT COMPLETO OBLIGATORIO: Cada propuesta debe incluir una pieza superior Y una inferior del armario. Prohibido dejar el look a medias.
5. FORMATO PROHIBIDO (NO ASTERISCOS ni LISTAS): Está terminantemente prohibido usar doble asterisco (**) o guiones de listas. Escribe en texto plano y corrido usando párrafos dinámicos para móvil. Resalta las prendas usando comillas simples (ej: 'Camiseta negra oversize').
6. INTEGRACIÓN DE METADATA PARA EL FRONTEND (ID TRACKING): Al final de tu propuesta de outfit, e inmediatamente después de cerrar tu párrafo, añade OBLIGATORIAMENTE un bloque JSON oculto pegado en una sola línea que contenga los IDs de las prendas que usaste para que el frontend pueda pintar sus fotos en el chat. Usa estrictamente este formato: JSON_IDS: {"upper": "ID", "lower": "ID", "outer": "ID"}`;
}

function buildAnalysisPrompt() {
  return `Guía de análisis mental antes de responder:
1. Asegúrate de respetar los colores prohibidos y el enfoque de estilo del usuario si están definidos.
2. Cruza el look de arriba y abajo basándote en la temperatura en vivo informada en el prompt del sistema y las especificaciones de las prendas.
3. No dejes texto cortado y agrega siempre la línea final de JSON_IDS para los componentes visuales del chat.`;
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

async function imageUrlToPart(item: any, index: number) {
  if (!item.image) return [];

  try {
    // 1. Obtener respuesta
    const response = await fetch(item.image);
    // 2. Obtener buffer (esto es el contenido de la imagen)
    const arrayBuffer = await response.arrayBuffer();
    // 3. Convertir a base64 de forma directa
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    return [
      { text: `Prenda ${index + 1}: ${item.title || 'Sin nombre'} (ID: ${item.id})` },
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/png",
        },
      },
    ];
  } catch (e) {
    console.error("Error procesando imagen:", e);
    return [{ text: `Prenda ${index + 1}: ${item.title || 'Sin nombre'} (ID: ${item.id})` }];
  }
}


async function buildVisualWardrobeContent(clothes: ClothingItem[], message: string): Promise<GeminiContent | null> {
  // Solo procesamos imágenes si el usuario pregunta algo relacionado con "ver", "recomendar", "outfit" o "ponerse"
  const needsVisuals = /recomendar|outfit|ponerse|vestir|combinar|ver/i.test(message);
  
  if (!needsVisuals) {
    return null; // Ahorramos tiempo y recursos si es solo una charla casual
  }

  const parts: GeminiPart[] = [];
  
  const availableClothes = clothes.filter(c => c.is_available !== false);
  
  for (const [index, item] of availableClothes.slice(0, MAX_WARDROBE_IMAGES).entries()) {
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
          temperature: 0.25,
          topP: 0.9,
          maxOutputTokens: 2200,
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
      return NextResponse.json({ error: "Falta configurar GEMINI_API_KEY." }, { status: 500 });
    }

    const body = await req.json();
    const messages = normalizeMessages(body?.messages);
    const context: RequestContext = body?.context || {};
    const clothes = normalizeClothes(body?.clothes);
    const visualWardrobeContent = await buildVisualWardrobeContent(clothes, messages[messages.length - 1].content);
    const contents = [
      ...(visualWardrobeContent ? [visualWardrobeContent] : []),
      ...toGeminiContents(messages),
    ];
    
    const systemPrompt = `${buildSystemPrompt(clothes, context)}\n\n${buildAnalysisPrompt()}`;

    if (contents.length === 0) {
      return NextResponse.json({ error: "Escribe un mensaje para tu stylist." }, { status: 400 });
    }

    let lastError = "";

    for (const model of GEMINI_MODELS) {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const response = await callGemini(model, systemPrompt, contents);

        if (response.ok) {
          const data = await response.json();
          const text = extractGeminiText(data) || "No pude generar una respuesta clara.";

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
        error: "Gemini no pudo responder. Intenta de nuevo.",
        details: process.env.NODE_ENV === "development" ? lastError : undefined,
      },
      { status: 503 }
    );
  } catch (error) {
    console.error("Stylist route error:", error);
    return NextResponse.json({ error: "Error del servidor." }, { status: 500 });
  }
}