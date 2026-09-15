// api/telegram.js — Bot de gastos via Webhook (Vercel Serverless)
// Nota: los archivos en /api usan CommonJS aunque el proyecto sea ESM

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require("@supabase/supabase-js");

// ── Usuarios autorizados (chat IDs de Telegram) ─────────────────────────────
// Cómo obtenerlos: mandá /start al bot y mirá los logs de Vercel (Functions tab)
// Una vez que los tengas, ponelos aquí:
const CHAT_IDS_AUTORIZADOS = process.env.TELEGRAM_CHAT_IDS_AUTORIZADOS
  ? process.env.TELEGRAM_CHAT_IDS_AUTORIZADOS.split(",").map(Number)
  : []; // Si está vacío, cualquiera puede usar el bot

// ── Categorías válidas ──────────────────────────────────────────────────────
const CATEGORIAS = [
  "comida", "transporte", "salud", "entretenimiento",
  "ropa", "educacion", "servicios", "supermercado", "otros",
];

// ── Helper: responder a Telegram ────────────────────────────────────────────
async function telegramRequest(method, body) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function sendMessage(chatId, text, extra = {}) {
  return telegramRequest("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
    ...extra,
  });
}

async function editMessage(chatId, messageId, text) {
  return telegramRequest("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "Markdown",
  });
}

// ── Helper: descargar imagen de Telegram como base64 ────────────────────────
async function getImageBase64(fileId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
  const fileData = await fileRes.json();
  const fileUrl = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;
  const imgRes = await fetch(fileUrl);
  const arrayBuffer = await imgRes.arrayBuffer();
  return Buffer.from(arrayBuffer).toString("base64");
}

// ── Prompt para Gemini ──────────────────────────────────────────────────────
const PROMPT = `
Analizá esta imagen de un comprobante/ticket de compra.
Extraé la información y respondé ÚNICAMENTE con JSON válido, sin markdown ni explicaciones:

{
  "monto": <número con decimales, sin símbolo de moneda. Si hay varios, usá el TOTAL>,
  "descripcion": "<nombre del comercio o tipo de compra, máx 60 caracteres>",
  "categoria": "<una de exactamente: comida, transporte, salud, entretenimiento, ropa, educacion, servicios, supermercado, otros>",
  "fecha": "<YYYY-MM-DD si la fecha es visible en el comprobante, sino null>"
}

Si no podés leer el monto total con certeza, poné "monto": null.
`;

// Soporta tanto SUPABASE_URL como VITE_SUPABASE_URL (que ya existe en Vercel)
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

// ── Insertar gasto en Supabase ──────────────────────────────────────────────
async function insertarGasto(userId, datos) {
  const supabase = createClient(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const gasto = {
    user_id: userId,
    monto: datos.monto,
    descripcion: datos.descripcion || "Comprobante escaneado",
    categoria: CATEGORIAS.includes(datos.categoria) ? datos.categoria : "otros",
    fecha: datos.fecha || new Date().toISOString().split("T")[0],
  };

  return supabase.from("gastos").insert([gasto]);
}

// ── Obtener user_id de Supabase según telegram_chat_id ─────────────────────
// Por simplicidad usamos un mapa en variables de entorno:
// TELEGRAM_USER_MAP=123456789:uuid-supabase-1,987654321:uuid-supabase-2
function getSupabaseUserId(chatId) {
  const map = process.env.TELEGRAM_USER_MAP || "";
  if (!map) return process.env.SUPABASE_DEFAULT_USER_ID || null;

  const pairs = map.split(",");
  for (const pair of pairs) {
    const [tgId, supaId] = pair.split(":");
    if (Number(tgId) === chatId) return supaId;
  }
  return process.env.SUPABASE_DEFAULT_USER_ID || null;
}

// ── Handler principal del webhook ───────────────────────────────────────────
async function handleUpdate(update) {
  const message = update.message;
  if (!message) return;

  const chatId = message.chat.id;
  const text = message.text || "";

  // Control de acceso
  if (CHAT_IDS_AUTORIZADOS.length > 0 && !CHAT_IDS_AUTORIZADOS.includes(chatId)) {
    await sendMessage(chatId, "🚫 No estás autorizado para usar este bot.");
    console.log(`Acceso denegado para chat_id: ${chatId}`);
    return;
  }

  // ── /start ──────────────────────────────────────────────────────────────
  // (siempre disponible, antes del chequeo de usuario)
  if (text.startsWith("/start")) {
    await sendMessage(
      chatId,
      `👋 ¡Hola! Soy tu asistente de gastos.\n\n` +
      `📸 Mandame una *foto de un comprobante* y lo cargo automáticamente a tu cuenta.\n\n` +
      `*Comandos disponibles:*\n` +
      `/miid — ver tu ID de Telegram\n` +
      `/manual 1500 Almuerzo — cargar gasto sin foto\n` +
      `/ultimos — ver tus últimos 5 gastos\n` +
      `/ayuda — más información`
    );
    console.log(`/start recibido: chat_id=${chatId}, username=${message.from?.username}`);
    return;
  }

  // ── /miid ────────────────────────────────────────────────────────────────
  // (siempre disponible, para que cualquiera pueda obtener su chat_id)
  if (text.startsWith("/miid")) {
    await sendMessage(
      chatId,
      `🪪 *Tu ID de Telegram es:*\n\n` +
      `\`${chatId}\`\n\n` +
      `Mandáselo al administrador para que te configure el acceso.`
    );
    return;
  }

  // Chequeo de usuario vinculado (requerido para el resto de comandos)
  const supabaseUserId = getSupabaseUserId(chatId);
  if (!supabaseUserId) {
    await sendMessage(
      chatId,
      `⚠️ Tu cuenta de Telegram no está vinculada aún.\n\n` +
      `Tu ID es: \`${chatId}\`\n` +
      `Pedile al administrador que configure tu acceso.`
    );
    return;
  }


  // ── /ayuda ──────────────────────────────────────────────────────────────
  if (text.startsWith("/ayuda")) {
    await sendMessage(
      chatId,
      `*📖 Cómo usar el bot:*\n\n` +
      `1. Sacá foto a un ticket o comprobante\n` +
      `2. Enviásela a este chat\n` +
      `3. La IA extrae el monto y la descripción\n` +
      `4. Se carga automáticamente en tu app\n\n` +
      `*Categorías disponibles:*\n` +
      CATEGORIAS.map(c => `• ${c}`).join("\n")
    );
    return;
  }

  // ── /manual <monto> <descripcion> ──────────────────────────────────────
  if (text.startsWith("/manual")) {
    const parts = text.replace("/manual", "").trim().split(" ");
    const monto = parseFloat(parts[0]);
    const descripcion = parts.slice(1).join(" ") || "Gasto manual";

    if (isNaN(monto) || monto <= 0) {
      await sendMessage(chatId, "❌ Formato incorrecto.\nEjemplo: `/manual 1500 Almuerzo`");
      return;
    }

    const { error } = await insertarGasto(supabaseUserId, {
      monto,
      descripcion,
      categoria: "otros",
      fecha: null,
    });

    if (error) {
      await sendMessage(chatId, `❌ Error al guardar: ${error.message}`);
    } else {
      await sendMessage(
        chatId,
        `✅ *Gasto registrado!*\n\n💰 $${monto}\n📝 ${descripcion}\n🏷️ otros`
      );
    }
    return;
  }

  // ── /ultimos ────────────────────────────────────────────────────────────
  if (text.startsWith("/ultimos")) {
    const supabase = createClient(
      SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data, error } = await supabase
      .from("gastos")
      .select("monto, descripcion, categoria, fecha")
      .eq("user_id", supabaseUserId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error || !data?.length) {
      await sendMessage(chatId, "No tenés gastos registrados aún.");
      return;
    }

    const lista = data
      .map((g) => `• *$${g.monto}* — ${g.descripcion} _(${g.categoria})_ [${g.fecha}]`)
      .join("\n");

    await sendMessage(chatId, `📋 *Tus últimos gastos:*\n\n${lista}`);
    return;
  }

  // ── FOTO: procesar comprobante ──────────────────────────────────────────
  if (message.photo) {
    const procesando = await sendMessage(chatId, "🔍 Analizando comprobante con IA...");
    const msgId = procesando.result?.message_id;

    try {
      // Imagen de mayor resolución
      const fileId = message.photo[message.photo.length - 1].file_id;
      const base64Image = await getImageBase64(fileId);

      // Llamar a Gemini Vision
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent([
        PROMPT,
        { inlineData: { mimeType: "image/jpeg", data: base64Image } },
      ]);

      const rawText = result.response.text().trim();
      const jsonStr = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const datos = JSON.parse(jsonStr);

      if (!datos.monto) {
        await editMessage(
          chatId,
          msgId,
          "⚠️ No pude leer el monto del comprobante.\nIntentá con una foto más clara o usá `/manual`."
        );
        return;
      }

      // Guardar en Supabase
      await editMessage(chatId, msgId, "💾 Guardando en tu cuenta...");
      const { error } = await insertarGasto(supabaseUserId, datos);

      if (error) {
        await editMessage(chatId, msgId, `❌ Error al guardar: ${error.message}`);
      } else {
        await editMessage(
          chatId,
          msgId,
          `✅ *¡Gasto registrado!*\n\n` +
          `💰 Monto: *$${datos.monto}*\n` +
          `📝 Descripción: ${datos.descripcion}\n` +
          `🏷️ Categoría: ${datos.categoria}\n` +
          `📅 Fecha: ${datos.fecha || "hoy"}`
        );
      }
    } catch (err) {
      console.error("Error procesando foto:", err);
      await editMessage(
        chatId,
        msgId,
        `❌ Ocurrió un error: ${err.message}\nIntentá de nuevo o usá \`/manual\`.`
      );
    }
    return;
  }

  // Mensaje de texto sin comando reconocido
  await sendMessage(
    chatId,
    "No entendí ese mensaje. Enviame una *foto de un comprobante* o usá /ayuda."
  );
}

// ── Vercel Serverless Function entry point ──────────────────────────────────
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, message: "Bot de gastos activo 🤖" });
  }

  try {
    await handleUpdate(req.body);
  } catch (err) {
    console.error("Error en webhook handler:", err);
  }

  // Siempre respondemos 200 a Telegram (sino reintenta)
  res.status(200).json({ ok: true });
};
