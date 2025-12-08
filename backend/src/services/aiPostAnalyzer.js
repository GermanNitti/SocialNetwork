const { callGroqChat, GROQ_ENABLED } = require("./aiClient");
const TOPICS = require("../config/topics");
const { normalizeHashtag } = require("../utils/hashtags");

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

function normalizeText(str = "") {
  return normalizeHashtag(str);
}

function contentMatchesTopic(content, topic) {
  if (!content || !topic) return false;
  const textNorm = normalizeText(content);

  for (const rawKw of topic.keywords || []) {
    const kwNorm = normalizeText(rawKw);
    if (!kwNorm) continue;
    if (textNorm.includes(kwNorm)) {
      return true;
    }
  }
  return false;
}

/**
 * Analiza un post con IA y devuelve:
 * {
 *   topics: [...],        // ids de catálogo
 *   hashtags: [...],      // palabras SIN "#" (ej: "MaxVerstappen", "F1Crash", "amor")
 *   implicit_reference: { present, kind, target_is_person }
 * }
 */
async function analyzePostWithAI(content) {
  if (!GROQ_ENABLED || !content || !content.trim()) {
    return {
      topics: [],
      hashtags: [],
      implicit_reference: { present: false, kind: "none", target_is_person: false },
    };
  }

  const topicsCatalog = buildTopicsCatalog();

  const systemPrompt = `
Sos un modelo que analiza posts cortos en español de una red social argentina llamada "Macanudo".

TENÉS QUE HACER TRES COSAS:

1) Marcar a qué TEMAS del catálogo pertenece el post ("topics").
   - Sé MUY CONSERVADOR.
   - Si el post no trata claramente de un tema del catálogo, dejá "topics": [].

2) Generar una lista corta de "hashtags" pensados como etiquetas útiles para agrupar contenido.
   - "hashtags" es un array de palabras SIN el símbolo "#".
   - Luego el sistema les va a agregar "#" adelante.
   - Un buen hashtag es algo que una persona podría usar para buscar ese tipo de post.
   - Ejemplos de buenos hashtags:
     - "F1", "MaxVerstappen", "verstappencrash", "ImolaCrash"
     - "amor", "pasteleria", "enamorada"
     - "mate", "tardemates"
   - NO uses palabras genéricas de rol familiar/relacional como hashtags, por ejemplo:
     - "primo", "prima", "hermano", "hermana", "amigo", "amiga", "novio", "novia"
   - En esos casos, buscá conceptos más generales:
     - "familia", "amor", "amistad", etc.
   - No conviertas automáticamente cada sustantivo en hashtag.
   - Preferí temas, personas, lugares, actividades, emociones claras.

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
  "hashtags": ["tag1", "tag2"],
  "implicit_reference": {
    "present": true | false,
    "kind": "none" | "romantic" | "friend" | "family" | "pet" | "group" | "brand" | "place" | "other",
    "target_is_person": true | false
  }
}

Reglas:
- "topics" sólo puede contener "id" que estén en "topics_catalog".
- Si el post no encaja claramente en ningún tema, usá "topics": [].
- "hashtags":
  - Son palabras SIN "#".
  - Máximo 3 a 6 por post.
  - Deben ser útiles para agrupar contenido similar (temas, personas, lugares, actividades, emociones).
  - NO uses hashtags que sean solo un rol familiar/relacional:
    "primo", "prima", "hermano", "hermana", "amigo", "amiga", "novio", "novia"
    En esos casos usá algo como "amor", "familia", "amistad".
  - No inventes hashtags muy raros salvo que tengan sentido para el contexto.

- "implicit_reference.present" es true si el post habla de alguien/entidad sin nombrarlo directamente.
- Si no hay referencia implícita relevante, dejá:
  { "present": false, "kind": "none", "target_is_person": false }

Ejemplos de cómo razonar (NO los devuelvas, son solo guía):

1) Post: "aca tomando mates con mi primo"
   - El tema principal es mate, no el primo.
   - topics: ["mate"]
   - hashtags posibles: ["mate", "mates", "tardemates"]
   - NO: "primo"

2) Post: "Tremendo palo el que se pegó Verstappen hoy en la carrera de Imola"
   - Tema: fórmula 1.
   - topics: ["formula1"]
   - hashtags posibles: ["MaxVerstappen", "F1", "verstappencrash", "F1Crash", "ImolaCrash"]

3) Post: "haciendo un budin para mi novio"
   - Tema: cocina/pastelería (si existe en el catálogo) y amor.
   - topics: [] si no hay tema de cocina en el catálogo.
   - hashtags posibles: ["amor", "pasteleria", "enamorada"]
   - NO: "novio"

Ahora analizá este post real:

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
    console.error("[aiPostAnalyzer] Error llamando a Groq:", err);
    return {
      topics: [],
      hashtags: [],
      implicit_reference: { present: false, kind: "none", target_is_person: false },
    };
  }

  try {
    const parsed = JSON.parse(raw);

    let topics = Array.isArray(parsed.topics) ? parsed.topics : [];
    let hashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags : [];
    const implicit_reference =
      parsed.implicit_reference || { present: false, kind: "none", target_is_person: false };

    // Filtro extra: sólo topics con evidencia en el texto
    const topicsById = {};
    for (const t of topicsCatalog) topicsById[t.id] = t;

    topics = topics.filter((id) => {
      const topic = topicsById[id];
      if (!topic) return false;
      return contentMatchesTopic(content, topic);
    });

    // Limpiar y normalizar hashtags:
    hashtags = hashtags
      .map((h) => (typeof h === "string" ? h.trim() : ""))
      .filter(Boolean)
      .filter((h, idx, arr) => arr.indexOf(h) === idx);

    // Filtro anti roles familiares/relacionales
    const bannedRel = new Set(["primo", "prima", "hermano", "hermana", "amigo", "amiga", "novio", "novia"]);
    hashtags = hashtags.filter((h) => !bannedRel.has(normalizeText(h)));

    return { topics, hashtags, implicit_reference };
  } catch (err) {
    console.error("[aiPostAnalyzer] Error parseando JSON de Groq:", err, raw);
    return {
      topics: [],
      hashtags: [],
      implicit_reference: { present: false, kind: "none", target_is_person: false },
    };
  }
}

module.exports = {
  analyzePostWithAI,
};
