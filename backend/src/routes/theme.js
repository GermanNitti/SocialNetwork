const express = require("express");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");
const { suggestThemeForUser } = require("../services/themeSuggestionService");

const router = express.Router();

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: {
      theme: true,
      userItems: {
        where: { equipped: true },
        include: { item: true },
      },
    },
  });
  const prefs = await prisma.userPreference.findUnique({ where: { userId: req.userId } });
  res.json({
    theme: user?.theme,
    decorations: user?.userItems?.filter((ui) => ui.item.category === "DECORATION").map((ui) => ui.item) || [],
    customThemeSettings: user?.customThemeSettings || prefs?.cardStyle || {},
  });
});

router.put("/me", requireAuth, async (req, res) => {
  const { themeId, customThemeSettings } = req.body;
  if (themeId) {
    const theme = await prisma.theme.findUnique({ where: { id: themeId } });
    if (!theme) return res.status(404).json({ message: "Tema no encontrado" });
    // Opcionalmente validar que lo posee
    await prisma.user.update({ where: { id: req.userId }, data: { themeId } });
  }
  if (customThemeSettings) {
    await prisma.user.update({
      where: { id: req.userId },
      data: { customThemeSettings },
    });
  }
  res.json({ ok: true });
});

router.post("/me/recalculate", requireAuth, async (req, res) => {
  const suggestion = await suggestThemeForUser(req.userId);
  res.json({ suggestedTheme: suggestion.theme, reason: suggestion.reason });
});

router.post("/me/apply-suggested", requireAuth, async (req, res) => {
  const suggestion = await suggestThemeForUser(req.userId);
  if (!suggestion.theme) return res.status(404).json({ message: "No hay sugerencia" });
  await prisma.user.update({ where: { id: req.userId }, data: { themeId: suggestion.theme.id } });
  res.json({ applied: suggestion.theme });
});

module.exports = router;
