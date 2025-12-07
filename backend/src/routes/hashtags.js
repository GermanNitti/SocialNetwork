const express = require("express");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Hashtags en tendencia
router.get("/trending", requireAuth, async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;

  try {
    const hashtags = await prisma.hashtag.findMany({
      orderBy: [{ useCount: "desc" }, { lastUsedAt: "desc" }],
      take: limit,
    });

    res.json(hashtags);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: "Error obteniendo hashtags en tendencia" });
  }
});

module.exports = router;
