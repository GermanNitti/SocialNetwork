// backend/src/services/aiPostAnalyzer.js

const { callGroqChat, GROQ_ENABLED } = require("./aiClient");
const TOPICS = require("../config/topics");

function buildTopicsCatalog() {
  return Object.keys(TOPICS).map((key) => {
    const t = TOPICS[key];
    return {
      id: t.canonicalTag || key,
      description: t.description || "",
      keywords: t.keywords || [],
    };
  });
}

/**
 * Analiza un post con IA y devuelve:
 * {
 *   topics: [...],
 *   extra_tags: [...],
 *   implicit_reference: { present, kind, target_is_person }
 * }
 */
async function analyzePostWithAI(content) {
  if (!GROQ_ENABLED || !content || !content.trim()) {
    return {
      topics: [],
      extra_tags: [],
      implicit_reference: { present: false, kind: "none", target_is_person: false },
    };
  }

  const topicsCatalog = buildTopicsCatalog();

  const systemPrompt = `
Sos un modelo que analiza posts cortos en español de una red social argentina llamada "Macanudo".
Tu tarea:
1) Marcar a qué TEMAS del catálogo pertenece el post.
2) Sugerir etiquetas extra (extra_tags) si tiene sentido.
3) Detectar si el post hace referencia implícita a alguien o algo sin nombrarlo directo
   (ej: "el más hermoso del mundo", "mi amorcito", etc.).

Respondé SIEMPRE SOLO un JSON válido, sin texto extra.
`;

  const userPayload = {
    post_text: content,
    language: "es",
    topics_catalog: topicsCatalog,
  };

  const userPrompt = `
Analizá este post y devolveme un JSON con esta forma EXACTA:

{
  "topics": ["id1", "id2"],
  "extra_tags": ["string1", "string2"],
  "implicit_reference": {
    "present": true | false,
    "kind": "none" | "romantic" | "friend" | "family" | "pet" | "group" | "brand" | "place" | "other",
    "target_is_person": true | false
  }
}

Reglas:
- "topics" sólo puede contener "id" que estén en "topics_catalog".
- "extra_tags" son strings cortas en minúsculas (ej: "netflix", "sanlorenzo").
- "implicit_reference.present" es true si el post habla de alguien/entidad sin nombrarlo directamente.
- Si no hay referencia implícita relevante, dejá:
  { "present": false, "kind": "none", "target_is_person": false }

Post:
"""${content}"""

Catálogo de temas:
${JSON.stringify(topicsCatalog, null, 2)}
`;

  let raw;
  try {
    raw = await callGroqChat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[aiPostAnalyzer] Error llamando a Groq:", err);
    return {
      topics: [],
      extra_tags: [],
      implicit_reference: { present: false, kind: "none", target_is_person: false },
    };
  }

  try {
    const parsed = JSON.parse(raw);
    const topics = Array.isArray(parsed.topics) ? parsed.topics : [];
    const extra_tags = Array.isArray(parsed.extra_tags) ? parsed.extra_tags : [];
    const implicit_reference =
      parsed.implicit_reference || { present: false, kind: "none", target_is_person: false };

    return { topics, extra_tags, implicit_reference };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[aiPostAnalyzer] Error parseando JSON de Groq:", err, raw);
    return {
      topics: [],
      extra_tags: [],
      implicit_reference: { present: false, kind: "none", target_is_person: false },
    };
  }
}

module.exports = {
  analyzePostWithAI,
};
