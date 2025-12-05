const express = require("express");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/items", requireAuth, async (req, res) => {
  const items = await prisma.shopItem.findMany({
    include: {
      theme: true,
      userItems: {
        where: { userId: req.userId },
      },
    },
  });
  res.json(
    items.map((item) => ({
      ...item,
      owned: item.userItems.length > 0,
      equipped: item.userItems.some((u) => u.equipped),
      userItemId: item.userItems[0]?.id || null,
    }))
  );
});

router.post("/purchase", requireAuth, async (req, res) => {
  const { itemId } = req.body;
  const item = await prisma.shopItem.findUnique({ where: { id: itemId } });
  if (!item) return res.status(404).json({ message: "Item no encontrado" });

  const already = await prisma.userItem.findFirst({
    where: { userId: req.userId, itemId },
  });
  if (already) return res.status(400).json({ message: "Ya lo tienes" });

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (user.points < item.pricePoints) {
    return res.status(400).json({ message: "Puntos insuficientes" });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: req.userId },
      data: { points: { decrement: item.pricePoints } },
    }),
    prisma.userItem.create({
      data: {
        userId: req.userId,
        itemId,
        equipped: item.category === "THEME" && item.pricePoints === 0, // auto-equipar free theme
      },
    }),
  ]);

  res.json({ ok: true });
});

router.post("/equip", requireAuth, async (req, res) => {
  const { userItemId } = req.body;
  const userItem = await prisma.userItem.findFirst({
    where: { id: userItemId, userId: req.userId },
    include: { item: true },
  });
  if (!userItem) return res.status(404).json({ message: "No encontrado" });

  await prisma.$transaction(async (tx) => {
    // desactivar otros de la misma categoría
    await tx.userItem.updateMany({
      where: {
        userId: req.userId,
        id: { not: userItemId },
        item: { category: userItem.item.category },
      },
      data: { equipped: false },
    });
    await tx.userItem.update({
      where: { id: userItemId },
      data: { equipped: true },
    });

    if (userItem.item.category === "THEME" && userItem.item.themeKey) {
      const theme = await tx.theme.findUnique({ where: { key: userItem.item.themeKey } });
      if (theme) {
        await tx.user.update({ where: { id: req.userId }, data: { themeId: theme.id } });
      }
    }
  });

  res.json({ ok: true });
});

module.exports = router;
