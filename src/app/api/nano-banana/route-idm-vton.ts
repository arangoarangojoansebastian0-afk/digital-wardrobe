import { NextResponse } from "next/server";
import { Client, handle_file } from "@gradio/client";
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

// IDM-VTON es un modelo open-source de "virtual try-on" (hecho específicamente
// para poner una prenda real sobre la foto de una persona), alojado gratis en
// Hugging Face con GPU gratuita (ZeroGPU). No requiere tarjeta ni créditos.
// https://huggingface.co/spaces/yisol/IDM-VTON
const SPACE = process.env.IDM_VTON_SPACE || "yisol/IDM-VTON";
const HF_TOKEN = process.env.HF_TOKEN as `hf_${string}` | undefined;

// Permitimos como máximo esta cantidad de prendas por outfit: el modelo se
// llama una vez POR PRENDA (encadenando la salida de una como entrada de la
// siguiente), y cada llamada puede tardar 20-40s en la GPU gratuita.
const MAX_ITEMS = 3;

function buildGarmentDescription(item: ClothingItem) {
  return [item.title, item.category, item.color, item.style]
    .filter(Boolean)
    .join(", ") || "prenda de ropa";
}

async function urlToDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo descargar la imagen final (status ${response.status})`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type")?.split(";")[0] || "image/png";
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

export async function POST(req: Request) {
  let body: NanoBananaRequest;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  if (!body?.profile || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Se requiere perfil corporal y al menos una prenda." }, { status: 400 });
  }

  // IDM-VTON necesita una foto REAL de una persona (no un maniquí abstracto):
  // es el "cuerpo" sobre el que se prueba la ropa.
  if (!body.reference_image_url) {
    return NextResponse.json<NanoBananaResponse>(
      { error: "Este modelo necesita una foto de referencia del usuario (de cuerpo, de frente) para poder probarle la ropa. Subí una foto de referencia primero." },
      { status: 400 }
    );
  }

  const itemsWithImage = body.items.filter((item) => item.image).slice(0, MAX_ITEMS);

  if (itemsWithImage.length === 0) {
    return NextResponse.json<NanoBananaResponse>(
      { error: "Ninguna de las prendas seleccionadas tiene una imagen real para usar." },
      { status: 400 }
    );
  }

  try {
    const client = await Client.connect(SPACE, HF_TOKEN ? { token: HF_TOKEN } : undefined);

    // Vamos encadenando: la salida de una prenda es la entrada (el "cuerpo")
    // para la siguiente, así se pueden ir sumando varias prendas al outfit.
    let currentImageRef: string = body.reference_image_url;

    for (const item of itemsWithImage) {
      const result = await client.predict("/tryon", {
        dict: {
          background: handle_file(currentImageRef),
          layers: [],
          composite: null,
        },
        garm_img: handle_file(item.image as string),
        garment_des: buildGarmentDescription(item),
        is_checked: true,
        is_checked_crop: false,
        denoise_steps: 30,
        seed: 42,
      });

      const output = result.data as Array<{ url?: string; path?: string } | null>;
      const outputFile = output?.[0];

      if (!outputFile?.url) {
        throw new Error(`El modelo no devolvió imagen al probar la prenda "${item.title || item.id}".`);
      }

      currentImageRef = outputFile.url;
    }

    const generatedImage = await urlToDataUrl(currentImageRef);
    return NextResponse.json<NanoBananaResponse>({ generated_image: generatedImage });
  } catch (error) {
    console.error("Nano Banana (IDM-VTON) route error:", error);
    const message = error instanceof Error ? error.message : "Error al generar la imagen con IDM-VTON.";
    return NextResponse.json<NanoBananaResponse>(
      { error: "No se pudo generar la vista con IDM-VTON.", message },
      { status: 502 }
    );
  }
}
