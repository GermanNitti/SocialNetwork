// backend/src/utils/terms.js

const { normalizeHashtag } = require("./hashtags");

const STOPWORDS = new Set([
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "de",
  "del",
  "al",
  "a",
  "en",
  "con",
  "por",
  "para",
  "que",
  "y",
  "o",
  "u",
  "es",
  "soy",
  "estoy",
  "estas",
  "esta",
  "estamos",
  "me",
  "te",
  "se",
  "mi",
  "tu",
  "su",
  "nos",
  "sus",
]);

function isProbablyProperName(token) {
  if (!token || token.length < 2) return false;
  const first = token[0];
  if (first !== first.toUpperCase()) return false;
  if (first === first.toLowerCase()) return false;
  return true;
}

/**
 * Devuelve [{ raw, normalized, isProperName }, ...]
 */
function extractTermsFromText(text = "") {
  if (!text) return [];

  const rawTokens = text
    .split(/[\s,.;:!?()"'\«»¿¡]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const result = [];

  for (const token of rawTokens) {
    const lower = token.toLowerCase();
    if (STOPWORDS.has(lower)) continue;

    const normalized = normalizeHashtag(token);
    if (!normalized) continue;

    result.push({
      raw: token,
      normalized,
      isProperName: isProbablyProperName(token),
    });
  }

  return result;
}

module.exports = {
  extractTermsFromText,
};
