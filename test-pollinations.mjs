#!/usr/bin/env node
/**
 * test-pollinations.mjs
 * ---------------------------------------------------------------
 * Prueba independiente del modelo "kontext" de Pollinations.ai
 * (edición imagen-a-imagen), sin depender de tu proyecto Next.js.
 *
 * Uso:
 *   1) Anda a https://auth.pollinations.ai, creá una cuenta gratis
 *      (sin tarjeta) y generá un token/API key.
 *   2) Poné ese token en la variable de entorno POLLINATIONS_API_KEY,
 *      o dejalo en un .env.local en esta misma carpeta como:
 *        POLLINATIONS_API_KEY=tu_token
 *   3) Ejecutá:
 *        node test-pollinations.mjs
 *      Esto genera una imagen simple de texto->imagen para confirmar
 *      que el token funciona.
 *   4) Para probar edición real de imagen (el caso de uso de tu app),
 *      pasale la URL de una imagen (por ejemplo una prenda tuya):
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
  log("=== Test independiente de Pollinations.ai (modelo kontext) ===");

  if (!TOKEN) {
    log("❌ No encontré POLLINATIONS_API_KEY. Sacá un token gratis en https://auth.pollinations.ai y ponelo en .env.local o como variable de entorno.");
    process.exit(1);
  }

  log(`Token detectado (primeros 6 caracteres): ${TOKEN.slice(0, 6)}...`);

  const prompt = IMAGE_URL_ARG
    ? "Coloca esta prenda sobre un maniquí neutro de cuerpo completo, fondo de estudio, vista frontal. Respeta el color y diseño real de la prenda."
    : "Un maniquí de moda simple, de cuerpo completo, fondo blanco de estudio, vista frontal.";

  const params = new URLSearchParams({
    model: "kontext",
    token: TOKEN,
    nologo: "true",
  });

  if (IMAGE_URL_ARG) {
    params.set("image", IMAGE_URL_ARG);
    log(`Modo: edición de imagen real. Imagen de entrada: ${IMAGE_URL_ARG}`);
  } else {
    log("Modo: texto → imagen simple (no pasaste ninguna URL de imagen como argumento).");
  }

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params.toString()}`;

  log(`\nLlamando a: ${url.replace(TOKEN, "***TOKEN***")}`);

  const start = Date.now();
  let response;
  try {
    response = await fetch(url);
  } catch (err) {
    log(`❌ Error de red al llamar la API: ${err.message}`);
    process.exit(1);
  }
  const elapsed = Date.now() - start;

  log(`Status HTTP: ${response.status} (${elapsed} ms)`);

  const contentType = response.headers.get("content-type") || "";

  if (!response.ok || !contentType.startsWith("image/")) {
    const text = await response.text().catch(() => "");
    log(`❌ La API no devolvió una imagen. Content-Type: ${contentType}`);
    log("Cuerpo de la respuesta:");
    log(text);
    process.exit(1);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const ext = contentType.split("/")[1] || "jpg";
  const filename = join(__dirname, `pollinations-test.${ext}`);
  writeFileSync(filename, buffer);

  log(`✅ ¡Imagen generada correctamente! (${buffer.byteLength} bytes)`);
  log(`   Guardada en: ${filename}`);
  log("\n✅ RESULTADO: Pollinations/kontext funciona con tu token. Ya podés usar el endpoint corregido en tu app.");
}

main();
