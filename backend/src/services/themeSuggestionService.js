const prisma = require("../prisma");

const KEYWORDS = {
  NATURE: ["planta", "bosque", "árbol", "arbol", "camping", "verde", "fogata", "montaña"],
  RACING: ["carrera", "f1", "formula", "auto", "velocidad", "pista", "bandera", "racing"],
  MUSIC: ["música", "musica", "canción", "cancion", "banda", "álbum", "album", "guitarra"],
  TECH: ["programación", "programacion", "codigo", "react", "python", "tech", "software", "js"],
  ART: ["arte", "pintura", "dibujo", "galería", "galeria", "ilustración", "ilustracion"],
};

const TOPIC_TO_THEME_KEY = {
  NATURE: "nature",
  RACING: "racing",
  MUSIC: "space",
  TECH: "tech",
  ART: "space",
  GENERIC: "nature",
};

async function suggestThemeForUser(userId) {
  const posts = await prisma.post.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const score = {
    NATURE: 0,
    RACING: 0,
    MUSIC: 0,
    TECH: 0,
    ART: 0,
  };
  for (const post of posts) {
    const text = (post.content || "").toLowerCase();
    Object.entries(KEYWORDS).forEach(([topic, words]) => {
      words.forEach((w) => {
        if (text.includes(w)) {
          score[topic] += 1;
        }
      });
    });
  }
  let best = "GENERIC";
  let bestScore = 0;
  Object.entries(score).forEach(([topic, value]) => {
    if (value > bestScore) {
      bestScore = value;
      best = topic;
    }
  });
  const themeKey = TOPIC_TO_THEME_KEY[best] || "nature";
  const theme = await prisma.theme.findUnique({ where: { key: themeKey } });
  return {
    topic: best,
    theme,
    reason: bestScore > 0 ? `Detectamos afinidad con ${best}` : "Tema genérico",
  };
}

module.exports = { suggestThemeForUser };
