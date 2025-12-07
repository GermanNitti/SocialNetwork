// backend/src/services/aiClient.js

// Si tu entorno no tiene fetch global, instalá node-fetch y descomentá:
// const fetch = require("node-fetch");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const GROQ_ENABLED = process.env.GROQ_ENABLED === "true";

if (!GROQ_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn("[aiClient] GROQ_API_KEY no está definido en .env");
}

/**
 * Llama a la API de Groq estilo Chat Completions.
 */
async function callGroqChat(messages) {
  if (!GROQ_ENABLED) {
    throw new Error("Groq deshabilitado (GROQ_ENABLED=false)");
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0,
      top_p: 0,
      max_tokens: 512,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    // eslint-disable-next-line no-console
    console.error("[aiClient] Error", res.status, text);
    throw new Error(`Groq API error: ${res.status}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  return content || "";
}

module.exports = {
  callGroqChat,
  GROQ_ENABLED,
};
