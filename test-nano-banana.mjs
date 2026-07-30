#!/usr/bin/env node
/**
 * test-nano-banana.mjs
 * ---------------------------------------------------------------
 * Script independiente para probar si la API de Gemini ("Nano Banana")
 * funciona con tu API key, SIN depender de tu proyecto Next.js.
 *
 * Uso:
 *   1) Poné tu API key en la variable de entorno GEMINI_API_KEY,
 *      o simplemente dejá tu archivo .env.local en la misma carpeta
 *      que este script (lo lee automáticamente).
 *   2) Ejecutá:
 *        node test-nano-banana.mjs
 *   3) Opcional: probar con una imagen real (por ejemplo la foto de
 *      una prenda), pasando su URL como argumento:
 *        node test-nano-banana.mjs "https://.../mi-prenda.jpg"
 *
 * Requisitos: Node.js 18 o superior (usa fetch nativo). Vos tenés v22, sobra.
 *
 * Qué hace:
 *   - Prueba, uno por uno, los 3 modelos de imagen de Gemini.
 *   - Si le pasás una URL de imagen, la descarga y se la manda al modelo
 *     junto con una instrucción de edición (igual que hace tu app real).
 *   - Si no le pasás nada, solo pide una imagen simple de texto→imagen.
 *   - Guarda cada imagen generada como archivo .png en esta misma carpeta
 *     para que la abras y confirmes visualmente que sí funciona.
 *   - Imprime el status HTTP y el cuerpo crudo de la respuesta si algo falla,
 *     para que sepas EXACTAMENTE por qué (API key inválida, modelo sin
 *     acceso, cuota agotada, etc.)
 * ---------------------------------------------------------------
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Cargar GEMINI_API_KEY desde el entorno o desde .env.local ──
function loadApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;

  const envPath = join(__dirname, ".env.local");
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf8");
    const match = content
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.startsWith("GEMINI_API_KEY="));
    if (match) {
      return match.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
    }
  }
  return null;
}

const API_KEY = loadApiKey();
const IMAGE_URL_ARG = process.argv[2]; // opcional: URL de una prenda real

const MODELS = [
  "gemini-3.1-flash-image",
  "gemini-2.5-flash-image",
  "gemini-3-pro-image",
];

function log(...args) {
  console.log(...args);
}

function extractImage(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    const inlineData = part.inline_data || part.inlineData;
    if (inlineData?.data) {
      const mimeType = inlineData.mime_type || inlineData.mimeType || "image/png";
      return { mimeType, base64: inlineData.data };
    }
  }
  return null;
}

function extractText(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text).filter(Boolean).join(" ");
}

async function urlToInlineData(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar la imagen de prueba (status ${res.status})`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const mimeType = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  return { mime_type: mimeType, data: buffer.toString("base64") };
}

async function testModel(model, parts) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  log(`\n──────────────────────────────────────────`);
  log(`Probando modelo: ${model}`);
  log(`Endpoint: ${url}`);

  const start = Date.now();

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          temperature: 0.4,
        },
      }),
    });
  } catch (err) {
    log(`❌ Error de red al llamar la API: ${err.message}`);
    return false;
  }

  const elapsed = Date.now() - start;
  const rawText = await response.text();

  log(`Status HTTP: ${response.status} (${elapsed} ms)`);

  if (!response.ok) {
    log(`❌ La API respondió con error. Cuerpo crudo:`);
    log(rawText);
    return false;
  }

  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    log("❌ La respuesta no es JSON válido:");
    log(rawText);
    return false;
  }

  const image = extractImage(data);
  const text = extractText(data);

  if (text) log(`Texto devuelto por el modelo: "${text}"`);

  if (!image) {
    log("❌ La respuesta llegó OK pero no trae ninguna imagen (inline_data). Cuerpo completo:");
    log(JSON.stringify(data, null, 2));
    return false;
  }

  const ext = image.mimeType.split("/")[1] || "png";
  const filename = join(__dirname, `nano-banana-test-${model}.${ext}`);
  writeFileSync(filename, Buffer.from(image.base64, "base64"));

  log(`✅ ¡Imagen generada correctamente! Guardada en: ${filename}`);
  return true;
}

async function main() {
  log("=== Test independiente de la API de Gemini / Nano Banana ===");

  if (!API_KEY) {
    log("❌ No encontré GEMINI_API_KEY. Poné la variable de entorno o un archivo .env.local junto a este script.");
    process.exit(1);
  }

  log(`API key detectada (primeros 6 caracteres): ${API_KEY.slice(0, 6)}...`);

  let parts;

  if (IMAGE_URL_ARG) {
    log(`Modo: edición de imagen real. Descargando: ${IMAGE_URL_ARG}`);
    try {
      const inline = await urlToInlineData(IMAGE_URL_ARG);
      parts = [
        { text: "Toma esta prenda de ropa y colócala sobre un maniquí neutro de cuerpo completo, fondo de estudio, vista frontal. Respeta el color y diseño real de la prenda de la imagen." },
        { inline_data: inline },
      ];
    } catch (err) {
      log(`❌ ${err.message}`);
      process.exit(1);
    }
  } else {
    log("Modo: texto → imagen simple (no pasaste ninguna URL de imagen como argumento).");
    parts = [
      { text: "Genera una imagen simple de un maniquí de moda neutro, de cuerpo completo, fondo blanco de estudio, vista frontal." },
    ];
  }

  let anySuccess = false;
  for (const model of MODELS) {
    const ok = await testModel(model, parts);
    if (ok) anySuccess = true;
  }

  log(`\n──────────────────────────────────────────`);
  if (anySuccess) {
    log("✅ RESULTADO: tu API key SÍ funciona y al menos un modelo generó imagen correctamente.");
    log("   Si tu app en Next.js sigue fallando, el problema está en el código de tu app (formato del request, env var no cargada en el server, etc.), no en tu cuenta ni en tu API key.");
  } else {
    log("❌ RESULTADO: ningún modelo generó imagen. Revisá los errores de arriba:");
    log("   - Status 400/403 => API key inválida, sin acceso a modelos de imagen, o facturación no habilitada.");
    log("   - Status 404 => nombre de modelo no disponible para tu cuenta/región todavía.");
    log("   - Status 429 => cuota/rate limit agotado.");
  }
}

main();
