const express = require("express");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
};

const getFriendship = async (userId, targetId) =>
  prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userId, addresseeId: targetId },
        { requesterId: targetId, addresseeId: userId },
      ],
    },
  });

router.get("/", requireAuth, async (req, res) => {
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ requesterId: req.userId }, { addresseeId: req.userId }],
    },
    include: { requester: true, addressee: true },
  });

  const friends = friendships.map((f) =>
    f.requesterId === req.userId ? f.addressee : f.requester
  );

  res.json(
    friendships.map((f) => ({
      status: f.status,
      relationCategory: f.relationCategory,
      relationDetail: f.relationDetail,
      user: sanitizeUser(f.requesterId === req.userId ? f.addressee : f.requester),
      direction: f.requesterId === req.userId ? "OUTGOING" : "INCOMING",
    }))
  );
});

router.post("/:username", requireAuth, async (req, res) => {
  const target = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!target) return res.status(404).json({ message: "Usuario no encontrado" });
  if (target.id === req.userId) return res.status(400).json({ message: "No puedes agregarte" });

  const existing = await getFriendship(req.userId, target.id);
  if (existing) {
    if (existing.status === "ACCEPTED") return res.json({ status: "FRIENDS" });
    if (existing.requesterId === req.userId) return res.json({ status: "OUTGOING" });
    if (existing.addresseeId === req.userId) return res.json({ status: "INCOMING" });
  }

  await prisma.friendship.create({
    data: { requesterId: req.userId, addresseeId: target.id, status: "PENDING" },
  });

  res.json({ status: "OUTGOING" });
});

router.post("/:username/accept", requireAuth, async (req, res) => {
  const target = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!target) return res.status(404).json({ message: "Usuario no encontrado" });

  const existing = await getFriendship(req.userId, target.id);
  if (!existing || existing.status !== "PENDING" || existing.requesterId !== target.id) {
    return res.status(400).json({ message: "No hay solicitud pendiente" });
  }

  await prisma.friendship.update({ where: { id: existing.id }, data: { status: "ACCEPTED" } });
  res.json({ status: "FRIENDS" });
});

router.post("/:username/relation", requireAuth, async (req, res) => {
  const target = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!target) return res.status(404).json({ message: "Usuario no encontrado" });

  const { category, detail } = req.body;
  const existing = await getFriendship(req.userId, target.id);
  if (!existing || existing.status !== "ACCEPTED") {
    return res.status(400).json({ message: "No son amigos" });
  }

  await prisma.friendship.update({
    where: { id: existing.id },
    data: { relationCategory: category || null, relationDetail: detail || null },
  });

  res.json({ status: existing.status, category: category || null, detail: detail || null });
});

router.delete("/:username", requireAuth, async (req, res) => {
  const target = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!target) return res.status(404).json({ message: "Usuario no encontrado" });

  const existing = await getFriendship(req.userId, target.id);
  if (!existing) {
    return res.status(404).json({ message: "Relación no encontrada" });
  }

  await prisma.friendship.delete({ where: { id: existing.id } });
  res.json({ status: "NONE" });
});

module.exports = router;
