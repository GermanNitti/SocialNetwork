const { callGroqChat, GROQ_ENABLED } = require("./aiClient");
const TOPICS = require("../config/topics");
const TAG_CATEGORIES = require("../config/tagCategories");
const EMOTIONS = require("../config/emotions");
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

function countWords(str = "") {
  return str
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function cleanTag(tag = "") {
  if (!tag) return "";
  let t = String(tag).trim();
  if (t.startsWith("#")) t = t.slice(1);
  return t;
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

function fallbackEmotionAnalysis(content = "") {
  const text = (content || "").toLowerCase();
  const foundEmotion = EMOTIONS.find((emotion) => {
    return emotion.keywords.some((keyword) => text.includes(keyword.toLowerCase()));
  });

  if (foundEmotion) {
    return {
      emotion: foundEmotion.emotion,
      emotionName: foundEmotion.name,
      emotionColor: foundEmotion.color,
      confidence: 0.4,
    };
  }

  return {
    emotion: "neutral",
    emotionName: "Neutral",
    emotionColor: "#D3D3D3",
    confidence: 0.3,
  };
}

/**
 * Analiza la emoción de un post con IA y devuelve:
 * {
 *   emotion: string,      // id de la emoción detectada
 *   emotionName: string,  // nombre de la emoción
 *   emotionColor: string, // color hexadecimal de la emoción
 *   confidence: number    // nivel de confianza 0.0-1.0
 * }
 */
async function analyzeEmotionWithAI(content) {
  if (!GROQ_ENABLED || !content || !content.trim()) {
    return fallbackEmotionAnalysis(content);
  }

  const emotionsCatalog = EMOTIONS.map((e) => ({
    id: e.emotion,
    name: e.name,
    color: e.color,
    keywords: e.keywords,
    examples: e.examples,
  }));

  const systemPrompt = `
Actuás como un detector de emociones para una red social argentina. Tu objetivo es SIEMPRE asignar una emoción significativa, casi nunca "neutral".

Tu tarea:
- Leer el texto del post.
- Identificar la emoción dominante o sensación que transmite.
- Seleccionar UNA sola emoción de la lista provista que mejor represente el estado emocional.
- Considerar tanto palabras emocionales explícitas como el tono, contexto y matices del texto.
- SER AGRESIVO en la detección: si hay CUALQUIER indicio emocional, asigna esa emoción.

REGLAS IMPORTANTES:
1) SOLO usás "neutral" si el post es completamente objetivo, informativo, sin tono emocional alguno.
2) Buscá activamente emociones: alegría, tristeza, amor, humor, sorpresa, curiosidad, determinación, nostalgia, etc.
3) Palabras como "jajaja", "jeje", "jiji" → HUMOR, no neutral.
4. Signos de exclamación (!!), preguntas (¿?), emojis → hay emoción.
5) Frases cortas como "Qué buen día", "Hoy todo salió bien" → ALEGRÍA/FELICIDAD, no neutral.
6) Expresiones como "Qué mal", "No me salió" → FRUSTRACIÓN/MOLESTIA, no neutral.
7) Frases como "¿Alguien sabe?", "¿Cómo hago X?" → CURIOSIDAD, no neutral.
8) Palabras de acción como "voy a", "quiero", "necesito" → DETERMINACIÓN/DESESPERACIÓN según el contexto.
9) Recordatorios del pasado → NOSTALGIA, no neutral.
10) Entendés lunfardo argentino (guita, bondi, mardel, joya, genial, qué bajón, etc.) y expresiones locales.
11) SIEMPRE elegí la emoción más intensa detectada, aunque la confianza no sea perfecta.

FORMATO DE RESPUESTA (solo JSON):
{
  "emotion": "id_emocion",
  "emotionName": "Nombre de Emoción",
  "emotionColor": "#RRGGBB",
  "confidence": 0.0-1.0,
  "reason": "breve explicación de por qué se eligió esta emoción"
}
`;

  const userPrompt = `
Analizá el post y devolvé SOLO este JSON:
{
  "emotion": "id_emocion",
  "emotionName": "Nombre de Emoción",
  "emotionColor": "#RRGGBB",
  "confidence": 0.0-1.0,
  "reason": "breve explicación de por qué se eligió esta emoción"
}

Reglas CRÍTICAS de detección:
- RISA ("jajaja", "jeje", "jiji", "lol", "risa", "jaja") → humor
- SIGNOS DE EMOCIÓN (!!!, ???, 😂, 😢, 😠, 😍) → emoción correspondiente
- PREGUNTAS ("¿alguien sabe?", "¿cómo hago?", "qué es") → curiosidad
- AGRADO ("qué buen día", "genial", "increíble", "joya", "macanudo") → alegría/euforia/entusiasmo
- DESAGRADO ("qué mal", "no salió", "horrible", "un desastre") → frustración/irritación/tristeza
- RECORDAR ("ayer", "antes", "recuerdo cuando", "aquella vez") → nostalgia/melancolía
- ACCIÓN ("voy a", "quiero", "necesito", "lo voy a lograr") → determinación/esperanza
- AMOR/CARIÑO ("te quiero", "te amo", "te extraño", ❤️) → amor
- DOLOR ("me duele", "qué triste", "bajón", "mal momento") → tristeza/angustia/soledad
- REFLEXIÓN ("pienso", "creo", "me pregunto", "quizás") → reflexión
- IRONÍA ("claro", "obvio", "ah sí", sarcasmo) → ironía
- SORPRESA ("¡sorpresa!", "no lo podía creer", "qué shock") → sorpresa
- GRATITUD ("gracias", "agradecido", "bendecido") → gratitud
- CALMA ("paz", "tranquilo", "relajado") → calma/serenidad
- ORGULLO ("lo logré", "conseguí", "mi logro") → orgullo

USÁ SOLO emociones de la lista "emotions" abajo.
SIEMPRE elegí la emoción más evidente, aunque no sea 100% perfecta.
EVITÁ "neutral" a menos que sea texto completamente objetivo sin tono emocional.

Post:
"""${content}"""

Emotions:
${JSON.stringify(emotionsCatalog, null, 2)}
`;

  let raw;
  try {
    raw = await callGroqChat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);
    console.log("[analyzeEmotionWithAI] Respuesta cruda de Groq:", raw);
  } catch (err) {
    console.error("[aiPostAnalyzer] Error llamando a Groq para emociones:", err);
    return fallbackEmotionAnalysis(content);
  }

  try {
    const parsed = JSON.parse(raw);
    console.log("[analyzeEmotionWithAI] JSON parseado:", parsed);

    if (!parsed.emotion || !emotionsCatalog.find((e) => e.id === parsed.emotion)) {
      console.warn("[analyzeEmotionWithAI] Emoción no válida o faltante, usando fallback");
      return fallbackEmotionAnalysis(content);
    }

    const emotionData = emotionsCatalog.find((e) => e.id === parsed.emotion);

    const result = {
      emotion: parsed.emotion,
      emotionName: emotionData.name,
      emotionColor: emotionData.color,
      confidence: parsed.confidence || 0.5,
    };
    console.log("[analyzeEmotionWithAI] Resultado final:", result);
    return result;
  } catch (err) {
    console.error("[aiPostAnalyzer] Error parseando JSON de Groq para emociones:", err, raw);
    return fallbackEmotionAnalysis(content);
  }
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
Actuás como un clasificador de hashtags para una red social argentina.
Tu tarea:
- Leer el texto del post.
- Leer una lista de categorías con reglas (idea_principal, cuando_usar, no_usar_cuando, subtags).
- Elegir SOLO los hashtags que tengan sentido según el CONTEXTO y la INTENCIÓN. Nunca etiquetes por una palabra suelta.
- Devolver un JSON con máximo 5 hashtags ordenados por relevancia.

REGLAS:
1) Usá únicamente los tags o subtags provistos en "categories". No inventes otros.
2) No uses un hashtag si cae en "no_usar_cuando", aunque aparezca la palabra.
3) Si algo no encaja bien, es mejor no etiquetar.
4) Entendés lunfardo argentino (guita, bondi, mardel, etc.) y lugares ambiguos (Mar del Plata ≠ dinero).
5) No uses roles familiares/relacionales como hashtag genérico (#primo, #novio, etc.); usa la categoría apropiada (familia, amor, amigos) si aplica.

FORMATO DE RESPUESTA (solo JSON):
{
  "hashtags": [
    { "tag": "#viajes", "reason": "breve razón", "confidence": 0.0-1.0 }
  ]
}
`;

  const userPayload = {
    post_text: content,
    categories: TAG_CATEGORIES,
  };

  const userPrompt = `
Analizá el post y devolvé SOLO este JSON:
{
  "hashtags": [
    { "tag": "#tag1", "reason": "por qué aplica", "confidence": 0.0-1.0 }
  ]
}

Reglas:
- Usa solo tags/subtags que figuran en "categories".
- Sigue idea_principal / cuando_usar / no_usar_cuando de cada categoría.
- Si aparece "Mar del Plata", "Mardel", "MDQ", "La Feliz": es viaje/lugar, preferí #viajes, #mardelplata, #argentina, NO #finanzas.
- Si aparece "plata" o "guita" como dinero y el foco es dinero, usá #finanzas (y subtags si corresponde).
- Si la ciudad es "La Plata" (ciudad), tratala como lugar argentino, no como dinero.
- No etiquetes por una palabra suelta; debe coincidir la intención/tema.
- Máximo 5 hashtags, ordenados por relevancia.

Post:
"""${content}"""

Categories:
${JSON.stringify(TAG_CATEGORIES, null, 2)}
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
      hashtags: fallbackHashtagsFromText(content),
      implicit_reference: { present: false, kind: "none", target_is_person: false },
    };
  }

  try {
    const parsed = JSON.parse(raw);

    let hashtagsRaw = [];
    if (Array.isArray(parsed.hashtags)) {
      hashtagsRaw = parsed.hashtags.map((h) => (typeof h === "string" ? { tag: h } : h));
    }
    let hashtags = hashtagsRaw
      .map((h) => (typeof h === "string" ? h : h.tag))
      .filter((h) => typeof h === "string" && h.trim())
      .map(cleanTag);
    // No usamos topics en este enfoque; quedarán vacíos para no romper compatibilidad
    let topics = [];
    const implicit_reference = { present: false, kind: "none", target_is_person: false };

    const contentNorm = normalizeText(content);

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
      .map((h) => cleanTag(h))
      .filter(Boolean)
      .filter((h, idx, arr) => arr.indexOf(h) === idx);

    // Si hay tags específicos, eliminamos el genérico "general"
    if (hashtags.length > 1) {
      hashtags = hashtags.filter((h) => normalizeText(h) !== "general");
    }

    // Limpiar y normalizar hashtags sin bloquear casos de una sola palabra
    hashtags = hashtags.filter((h) => {
      const hNorm = normalizeText(h);
      if (!hNorm) return false;
      // Si aparece en el texto, válido
      if (contentNorm && contentNorm.includes(hNorm)) return true;
      // Si es parte del catálogo (Groq lo eligió) también lo admitimos
      return true;
    });

    // Fallback: si Groq no devolvió nada, intenta heurística y si no, hashtag genérico
    if (hashtags.length === 0) {
      hashtags = fallbackHashtagsFromText(content);
    }

    // Filtro anti roles familiares/relacionales
    const bannedRel = new Set(["primo", "prima", "hermano", "hermana", "amigo", "amiga", "novio", "novia"]);
    hashtags = hashtags.filter((h) => !bannedRel.has(normalizeText(h)));

    return { topics, hashtags, implicit_reference };
  } catch (err) {
    console.error("[aiPostAnalyzer] Error parseando JSON de Groq:", err, raw);
    return {
      topics: [],
      hashtags: fallbackHashtagsFromText(content),
      implicit_reference: { present: false, kind: "none", target_is_person: false },
    };
  }
}

// Heurística mínima para que nunca devolvamos 0 hashtags
function fallbackHashtagsFromText(text = "") {
  const t = (text || "").toLowerCase();
  const add = (tag) => [cleanTag(tag)];
  if (/mar\s+del\s+plata|mardel|mdq|la\s+feliz/.test(t)) return add("mardelplata");
  if (/plata|guita|dinero|sueldo|inflaci[óo]n|precio/.test(t)) return add("finanzas");
  if (/viaje|viajar|viajando|vacaciones|turismo/.test(t)) return add("viajes");
  if (/macbook|mac\b|imac|iphone|ipad|airpods|apple/.test(t)) return add("tech");
  if (/cafe|caf[eé]|mate|birra|cerveza|vino|trago|coctel|bebida/.test(t)) return add("bebidas");
  if (/comida|cena|almuerzo|desayuno|receta|cocinar|hambre|pizza|empanada|asado/.test(t))
    return add("comida");
  if (/musica|canci[óo]n|album|banda|spotify|concierto|recital/.test(t)) return add("musica");
  if (/futbol|partido|gol|mundial|basquet|basket|tenis|gym|gimnasio|correr|entrenar/.test(t))
    return add("deporte");
  if (/jaja|jajaja|meme|chiste|gracioso/.test(t)) return add("humor");
  if (/amor|novio|novia|pareja|cita/.test(t)) return add("amor");
  // Último recurso: elegimos una etiqueta neutra para no devolver vacío
  return [cleanTag("general")];
}

module.exports = {
  analyzePostWithAI,
  analyzeEmotionWithAI,
};
