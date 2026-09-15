// scripts/setup-telegram-webhook.mjs
// Ejecutar UNA SOLA VEZ despues de desplegar en Vercel:
// node scripts/setup-telegram-webhook.mjs https://tu-app.vercel.app

import { readFileSync } from "fs";
import { resolve } from "path";

// Leer .env.local manualmente (evitar dependencia de dotenv)
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const lines = readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const [key, ...rest] = line.split("=");
      if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
    }
  } catch {}
}
loadEnv();

const token = process.env.TELEGRAM_BOT_TOKEN;
const appUrl = process.argv[2];

if (!token) {
  console.error("Falta TELEGRAM_BOT_TOKEN en .env.local");
  process.exit(1);
}
if (!appUrl) {
  console.error("Pasa la URL: node scripts/setup-telegram-webhook.mjs https://tu-app.vercel.app");
  process.exit(1);
}

const webhookUrl = ${appUrl}/api/telegram;

async function run() {
  console.log(\nRegistrando webhook en: \n);
  const setRes = await fetch(https://api.telegram.org/bot/setWebhook?url=);
  const setData = await setRes.json();
  if (setData.ok) {
    console.log("Webhook registrado correctamente!");
  } else {
    console.error("Error:", setData.description);
    process.exit(1);
  }
  const infoRes = await fetch(https://api.telegram.org/bot/getWebhookInfo);
  const info = await infoRes.json();
  console.log("URL activa:", info.result.url);
  if (info.result.last_error_message) console.warn("Ultimo error:", info.result.last_error_message);
  console.log("\nListo! Manda /start al bot y mira los logs de Vercel para ver tu chat_id.");
}

run().catch(console.error);
