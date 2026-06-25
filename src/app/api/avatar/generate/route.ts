import { NextResponse } from "next/server";

type BodyParams = {
  height_cm: number;
  shoulder_cm: number;
  chest_cm: number;
  waist_cm: number;
  hips_cm: number;
  inseam_cm: number;
  body_shape: string;
};

const IMAGE_MODELS = [
  "gemini-3.1-flash-image",
  "gemini-2.5-flash-image",
  "gemini-3-pro-image",
];

const MAX_IMAGE_BYTES = 7 * 1024 * 1024;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(formData: FormData, key: string) {
  const value = Number(getString(formData, key));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function readBodyParams(formData: FormData): BodyParams {
  return {
    height_cm: getNumber(formData, "height_cm"),
    shoulder_cm: getNumber(formData, "shoulder_cm"),
    chest_cm: getNumber(formData, "chest_cm"),
    waist_cm: getNumber(formData, "waist_cm"),
    hips_cm: getNumber(formData, "hips_cm"),
    inseam_cm: getNumber(formData, "inseam_cm"),
    body_shape: getString(formData, "body_shape") || "natural",
  };
}

function validateBodyParams(params: BodyParams) {
  return (
    params.height_cm >= 120 &&
    params.shoulder_cm >= 25 &&
    params.chest_cm >= 55 &&
    params.waist_cm >= 45 &&
    params.hips_cm >= 55 &&
    params.inseam_cm >= 45
  );
}

async function fileToInlineData(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("La foto es demasiado pesada para generar el avatar.");
  }

  return {
    mime_type: file.type || "image/jpeg",
    data: buffer.toString("base64"),
  };
}

function extractImage(data: any) {
  const parts = data.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
    const inlineData = part.inline_data || part.inlineData;
    if (inlineData?.data) {
      const mimeType = inlineData.mime_type || inlineData.mimeType || "image/png";
      return `data:${mimeType};base64,${inlineData.data}`;
    }
  }

  return "";
}

async function callImageModel(model: string, inlineData: { mime_type: string; data: string }, params: BodyParams) {
  const prompt = `Create a consistent front-facing fashion avatar/mannequin from the reference person photo.

Requirements:
- Keep the same body identity, proportions and body shape from the reference photo.
- Use these exact measurement constraints: height ${params.height_cm} cm, shoulders ${params.shoulder_cm} cm, chest ${params.chest_cm} cm, waist ${params.waist_cm} cm, hips ${params.hips_cm} cm, inseam ${params.inseam_cm} cm, body shape ${params.body_shape}.
- Output a clean full-body standing avatar, neutral pose, arms slightly away from torso, feet visible, centered.
- Plain dark studio background, no extra clothing overlays, no text, no logos, no cropped body.
- The avatar must be reusable as a stable body reference for trying on clothes in a 2D outfit editor.
- Preserve natural proportions. Do not beautify, slim, enlarge, or change the body beyond the given measurements.`;

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
              { text: prompt },
              { inline_data: inlineData },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          temperature: 0.35,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  const image = extractImage(data);
  if (!image) throw new Error("El modelo no devolvio imagen.");

  return image;
}

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Falta configurar GEMINI_API_KEY." }, { status: 500 });
    }

    const formData = await req.formData();
    const photo = formData.get("photo");
    const params = readBodyParams(formData);

    if (!(photo instanceof File) || photo.size === 0) {
      return NextResponse.json({ error: "La foto de cuerpo es obligatoria." }, { status: 400 });
    }

    if (!validateBodyParams(params)) {
      return NextResponse.json({ error: "Completa medidas corporales validas antes de generar el avatar." }, { status: 400 });
    }

    const inlineData = await fileToInlineData(photo);
    let lastError = "";

    for (const model of IMAGE_MODELS) {
      try {
        const image = await callImageModel(model, inlineData, params);
        return NextResponse.json({ image, model });
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        console.error(`Avatar model error (${model}):`, lastError);
      }
    }

    return NextResponse.json(
      {
        error: "No se pudo generar el avatar con Nano Banana.",
        details: process.env.NODE_ENV === "development" ? lastError : undefined,
      },
      { status: 503 }
    );
  } catch (error) {
    console.error("Avatar generation error:", error);
    const message = error instanceof Error ? error.message : "Error generando avatar.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
