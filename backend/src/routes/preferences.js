const express = require("express");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const prefs = await prisma.userPreference.findUnique({ where: { userId: req.userId } });
  res.json(prefs || {});
});

router.put("/", requireAuth, async (req, res) => {
  const { cardStyle, theme } = req.body;
  const prefs = await prisma.userPreference.upsert({
    where: { userId: req.userId },
    update: { cardStyle: cardStyle || {}, theme: theme || null },
    create: { userId: req.userId, cardStyle: cardStyle || {}, theme: theme || null },
  });
  res.json(prefs);
});

module.exports = router;
