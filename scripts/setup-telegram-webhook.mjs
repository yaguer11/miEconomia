// scripts/setup-telegram-webhook.mjs
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const lines = readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      process.env[key] = val;
    }
  } catch (e) {
    console.error("No se pudo leer .env.local:", e.message);
  }
}
loadEnv();

const token = process.env.TELEGRAM_BOT_TOKEN;
const appUrl = process.argv[2];

if (!token) {
  console.error("Falta TELEGRAM_BOT_TOKEN en .env.local");
  process.exit(1);
}
if (!appUrl) {
  console.error("Usa: node scripts/setup-telegram-webhook.mjs https://tu-app.vercel.app");
  process.exit(1);
}

const webhookUrl = appUrl.replace(/\/$/, "") + "/api/telegram";

async function run() {
  console.log("Registrando webhook en:", webhookUrl);
  const setRes = await fetch(
    "https://api.telegram.org/bot" + token + "/setWebhook?url=" + encodeURIComponent(webhookUrl)
  );
  const setData = await setRes.json();
  if (setData.ok) {
    console.log("Webhook registrado correctamente!");
  } else {
    console.error("Error:", setData.description);
    process.exit(1);
  }
  const infoRes = await fetch("https://api.telegram.org/bot" + token + "/getWebhookInfo");
  const info = await infoRes.json();
  console.log("URL activa:", info.result.url);
  if (info.result.last_error_message) {
    console.warn("Ultimo error Telegram:", info.result.last_error_message);
  }
  console.log("\nListo! Ahora manda /start al bot en Telegram.");
}

run().catch(console.error);
