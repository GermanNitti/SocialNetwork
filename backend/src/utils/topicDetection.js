// backend/src/utils/topicDetection.js

const { normalizeHashtag } = require("./hashtags");
const TOPICS = require("../config/topics");

function normalizeText(str = "") {
  return normalizeHashtag(str);
}

/**
 * Devuelve un array de tags canónicos a partir del texto,
 * usando solo el diccionario de palabras clave.
 */
function detectTopicsFromText(rawText = "") {
  if (!rawText) return [];
  const text = normalizeText(rawText);
  const foundTags = new Set();

  for (const key of Object.keys(TOPICS)) {
    const topic = TOPICS[key];
    const canonicalTag = topic.canonicalTag || key;

    for (const rawKeyword of topic.keywords || []) {
      const normalizedKeyword = normalizeText(rawKeyword);
      if (!normalizedKeyword) continue;

      if (text.includes(normalizedKeyword)) {
        foundTags.add(canonicalTag);
        break;
      }
    }
  }

  return Array.from(foundTags);
}

function categorizeAndAggregateTags(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }
  return tags.map(tag => {
    const category = tag && tag.category ? tag.category.toLowerCase() : 'uncategorized';
    const name = tag && tag.name ? tag.name.toLowerCase() : 'unnamed';
    return { ...tag, category, name };
  });
}

module.exports = {
  detectTopicsFromText,
  categorizeAndAggregateTags,
};
