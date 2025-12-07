// backend/src/utils/hashtags.js

const accentMap = {
  á: "a",
  é: "e",
  í: "i",
  ó: "o",
  ú: "u",
  Á: "a",
  É: "e",
  Í: "i",
  Ó: "o",
  Ú: "o",
  ñ: "n",
  Ñ: "n",
};

function removeAccents(str = "") {
  return str.split("").map((ch) => accentMap[ch] || ch).join("");
}

// Normaliza texto/hashtags para comparación y como clave canónica
function normalizeHashtag(raw = "") {
  if (!raw) return "";
  let s = raw.startsWith("#") ? raw.slice(1) : raw;

  s = s.toLowerCase();
  s = removeAccents(s);

  const replacements = [
    { from: /uno/g, to: "1" },
    { from: /dos/g, to: "2" },
    { from: /tres/g, to: "3" },
    { from: /cuatro/g, to: "4" },
    { from: /cinco/g, to: "5" },
    { from: /seis/g, to: "6" },
    { from: /siete/g, to: "7" },
    { from: /ocho/g, to: "8" },
    { from: /nueve/g, to: "9" },
    { from: /cero/g, to: "0" },
  ];
  for (const r of replacements) s = s.replace(r.from, r.to);

  s = s.replace(/\s+/g, "");
  return s;
}

// Devuelve [{ raw: '#Formula1', canonical: 'formula1' }, ...]
function extractHashtagsObjects(text = "") {
  if (!text) return [];
  const regex = /#([A-Za-z0-9_ÁÉÍÓÚÑáéíóúñ]+)/g;
  const seenCanonical = new Set();
  const result = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    const rawWord = match[1];
    const canonical = normalizeHashtag(rawWord);
    if (!canonical) continue;

    if (!seenCanonical.has(canonical)) {
      seenCanonical.add(canonical);
      result.push({
        raw: `#${rawWord}`,
        canonical,
      });
    }
  }
  return result;
}

module.exports = {
  normalizeHashtag,
  extractHashtagsObjects,
};
