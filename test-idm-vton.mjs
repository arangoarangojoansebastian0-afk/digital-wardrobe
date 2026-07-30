#!/usr/bin/env node
/**
 * test-idm-vton.mjs
 * ---------------------------------------------------------------
 * Prueba independiente del modelo IDM-VTON (virtual try-on) en
 * Hugging Face Spaces, sin depender de tu proyecto Next.js.
 *
 * Uso:
 *   1) (Recomendado, no obligatorio) Sacá un token gratis de Hugging Face
 *      en https://huggingface.co/settings/tokens (tipo "Read") y ponelo
 *      en la variable de entorno HF_TOKEN, o en un .env.local como:
 *        HF_TOKEN=hf_tu_token
 *      Sin token igual funciona, pero con token tenés más cuota de GPU.
 *   2) Ejecutá con la URL de una foto de PERSONA (de cuerpo, de frente)
 *      y la URL de una prenda:
 *        node test-idm-vton.mjs "URL_FOTO_PERSONA" "URL_PRENDA"
 *
 * Nota: la primera llamada puede tardar 30-90 segundos si el Space
 * gratuito estaba "dormido". Es normal, no es un error.
 * ---------------------------------------------------------------
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Client, handle_file } from "@gradio/client";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadToken() {
  if (process.env.HF_TOKEN) return process.env.HF_TOKEN;
  const envPath = join(__dirname, ".env.local");
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf8");
    const match = content
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.startsWith("HF_TOKEN="));
    if (match) return match.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
  }
  return null;
}

const TOKEN = loadToken();
const [personUrl, garmentUrl] = process.argv.slice(2);

function log(...args) {
  console.log(...args);
}

async function main() {
  log("=== Test independiente de IDM-VTON (Hugging Face Space) ===");

  if (!personUrl || !garmentUrl) {
    log("❌ Necesitás pasar 2 argumentos: URL de foto de la persona y URL de la prenda.");
    log('   node test-idm-vton.mjs "https://.../foto-persona.jpg" "https://.../prenda.jpg"');
    process.exit(1);
  }

  log(TOKEN ? "Token de Hugging Face detectado." : "Sin token (funciona igual, pero con menos cuota de GPU).");
  log(`Foto de persona: ${personUrl}`);
  log(`Prenda: ${garmentUrl}`);
  log("\nConectando al Space yisol/IDM-VTON (puede tardar si está 'dormido')...");

  const start = Date.now();

  try {
    const client = await Client.connect("yisol/IDM-VTON", TOKEN ? { token: TOKEN } : undefined);

    log("Conectado. Enviando la solicitud de try-on...");

    const result = await client.predict("/tryon", {
      dict: {
        background: handle_file(personUrl),
        layers: [],
        composite: null,
      },
      garm_img: handle_file(garmentUrl),
      garment_des: "prenda de ropa",
      is_checked: true,
      is_checked_crop: false,
      denoise_steps: 30,
      seed: 42,
    });

    const elapsed = Math.round((Date.now() - start) / 1000);
    log(`Respuesta recibida en ${elapsed}s.`);

    const output = result.data;
    const outputFile = Array.isArray(output) ? output[0] : null;

    if (!outputFile?.url) {
      log("❌ La respuesta no trae una imagen con URL. Respuesta completa:");
      log(JSON.stringify(result.data, null, 2));
      process.exit(1);
    }

    log(`URL de la imagen generada: ${outputFile.url}`);
    log("Descargando para guardarla localmente...");

    const imgRes = await fetch(outputFile.url);
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const filename = join(__dirname, "idm-vton-test-output.png");
    writeFileSync(filename, buffer);

    log(`✅ ¡Imagen generada correctamente! Guardada en: ${filename}`);
    log("\n✅ RESULTADO: IDM-VTON funciona. Ya podés usar el endpoint corregido en tu app.");
  } catch (error) {
    log(`❌ Error: ${error?.message || error}`);
    if (error?.stack) log(error.stack);
    process.exit(1);
  }
}

main();
