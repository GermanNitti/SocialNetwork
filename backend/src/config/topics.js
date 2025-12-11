// backend/src/config/topics.js
// Catálogo inicial de temas y palabras clave asociadas.
// El campo canonicalTag es lo que termina guardado en Post.tags (normalizado).
module.exports = {
  formula1: {
    canonicalTag: "formula1",
    keywords: [
      "formula 1",
      "f1",
      "max verstappen",
      "verstappen",
      "hamilton",
      "red bull",
      "ferrari",
      "mercedes",
      "gran premio",
      "safety car",
      "pit stop",
    ],
  },

  mate: {
    canonicalTag: "mate",
    keywords: ["mate", "mates", "termo", "bombilla", "yerba", "taragui", "playadito", "union", "cbse"],
  },

  anime: {
    canonicalTag: "anime",
    keywords: [
      "anime",
      "manga",
      "one piece",
      "luffy",
      "naruto",
      "sasuke",
      "goku",
      "dragon ball",
      "my hero academia",
    ],
  },

  apple: {
    canonicalTag: "apple",
    keywords: [
      "apple",
      "mac",
      "macbook",
      "imac",
      "iphone",
      "ipad",
      "ios",
      "airpods",
      "macos",
    ],
  },

  // agregá más: futbol, fotografia, gaming, musica, etc.
};
