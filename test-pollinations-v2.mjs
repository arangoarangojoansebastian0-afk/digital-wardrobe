#!/usr/bin/env node
/**
 * test-pollinations.mjs (v2)
 * ---------------------------------------------------------------
 * Prueba independiente del modelo "kontext" de Pollinations.ai usando
 * el endpoint correcto: POST https://gen.pollinations.ai/v1/images/edits
 * (multipart/form-data), sin depender de tu proyecto Next.js.
 *
 * Uso:
 *   1) Anda a https://auth.pollinations.ai, creá una cuenta gratis
 *      (sin tarjeta) y generá un token/API key (empieza con "sk_").
 *   2) Poné ese token en la variable de entorno POLLINATIONS_API_KEY,
 *      o dejalo en un .env.local en esta misma carpeta como:
 *        POLLINATIONS_API_KEY=sk_tu_token
 *   3) Ejecutá (necesita una imagen de entrada; kontext es SOLO edición,
 *      no genera desde texto puro):
 *        node test-pollinations.mjs "https://.../mi-prenda.jpg"
 * ---------------------------------------------------------------
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadToken() {
  if (process.env.POLLINATIONS_API_KEY) return process.env.POLLINATIONS_API_KEY;

  const envPath = join(__dirname, ".env.local");
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf8");
    const match = content
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.startsWith("POLLINATIONS_API_KEY="));
    if (match) {
      return match.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
    }
  }
  return null;
}

const TOKEN = loadToken();
const IMAGE_URL_ARG = process.argv[2];

function log(...args) {
  console.log(...args);
}

async function main() {
  log("=== Test independiente de Pollinations.ai (kontext vía /v1/images/edits) ===");

  if (!TOKEN) {
    log("❌ No encontré POLLINATIONS_API_KEY. Sacá un token gratis en https://auth.pollinations.ai y ponelo en .env.local o como variable de entorno.");
    process.exit(1);
  }

  if (!IMAGE_URL_ARG) {
    log("❌ Kontext es un modelo de EDICIÓN de imágenes: necesita una imagen de entrada.");
    log("   Pasá la URL de una imagen como argumento, por ejemplo:");
    log('   node test-pollinations.mjs "https://tu-bucket.supabase.co/storage/v1/object/public/clothes/algo.jpg"');
    process.exit(1);
  }

  log(`Token detectado (primeros 6 caracteres): ${TOKEN.slice(0, 6)}...`);
  log(`Descargando imagen de entrada: ${IMAGE_URL_ARG}`);

  let imageBuffer, contentType;
  try {
    const imgRes = await fetch(IMAGE_URL_ARG);
    if (!imgRes.ok) throw new Error(`No se pudo descargar la imagen (status ${imgRes.status})`);
    imageBuffer = Buffer.from(await imgRes.arrayBuffer());
    contentType = imgRes.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  } catch (err) {
    log(`❌ ${err.message}`);
    process.exit(1);
  }

  log(`Imagen descargada (${imageBuffer.byteLength} bytes, ${contentType}).`);

  const prompt = "Coloca esta prenda sobre un maniquí neutro de cuerpo completo, fondo de estudio, vista frontal. Respeta el color y diseño real de la prenda.";

  const formData = new FormData();
  formData.append("model", "kontext");
  formData.append("prompt", prompt);
  formData.append("response_format", "b64_json");
  const ext = contentType.split("/")[1] || "jpg";
  formData.append("image", new Blob([imageBuffer], { type: contentType }), `input.${ext}`);

  log("\nLlamando a: https://gen.pollinations.ai/v1/images/edits");

  const start = Date.now();
  let response;
  try {
    response = await fetch("https://gen.pollinations.ai/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}` },
      body: formData,
    });
  } catch (err) {
    log(`❌ Error de red al llamar la API: ${err.message}`);
    process.exit(1);
  }
  const elapsed = Date.now() - start;

  const rawText = await response.text();
  log(`Status HTTP: ${response.status} (${elapsed} ms)`);

  if (!response.ok) {
    log("❌ La API respondió con error. Cuerpo crudo:");
    log(rawText);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    log("❌ La respuesta no es JSON válido:");
    log(rawText);
    process.exit(1);
  }

  const entry = data?.data?.[0];

  if (!entry) {
    log("❌ La respuesta no trae ninguna imagen. Cuerpo completo:");
    log(JSON.stringify(data, null, 2));
    process.exit(1);
  }

  if (entry.b64_json) {
    const outBuffer = Buffer.from(entry.b64_json, "base64");
    const filename = join(__dirname, "pollinations-test-output.png");
    writeFileSync(filename, outBuffer);
    log(`✅ ¡Imagen generada correctamente! Guardada en: ${filename}`);
  } else if (entry.url) {
    log(`✅ ¡Imagen generada correctamente! URL: ${entry.url}`);
  } else {
    log("❌ La respuesta no trae ni b64_json ni url. Cuerpo completo:");
    log(JSON.stringify(data, null, 2));
    process.exit(1);
  }

  log("\n✅ RESULTADO: Pollinations/kontext funciona con tu token. Ya podés usar el endpoint corregido en tu app.");
}

main();
