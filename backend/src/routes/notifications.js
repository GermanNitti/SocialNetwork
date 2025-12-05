const express = require("express");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const items = await prisma.notification.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(items);
});

router.post("/read", requireAuth, async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.userId, readAt: null },
    data: { readAt: new Date() },
  });
  res.json({ ok: true });
});

module.exports = router;
