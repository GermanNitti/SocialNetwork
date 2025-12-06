const express = require("express");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const sort = req.query.sort === "top" ? { votes: "desc" } : { createdAt: "desc" };
  const items = await prisma.feedback.findMany({
    orderBy: sort,
    include: {
      author: { select: { id: true, username: true, name: true } },
    },
  });
  res.json(items);
});

router.post("/", requireAuth, async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json({ message: "title y description son obligatorios" });
  }
  const item = await prisma.feedback.create({
    data: {
      title,
      description,
      authorId: req.userId,
    },
  });
  res.status(201).json(item);
});

router.post("/:id/vote", requireAuth, async (req, res) => {
  const feedbackId = Number(req.params.id);
  if (Number.isNaN(feedbackId)) return res.status(400).json({ message: "ID inválido" });

  const exists = await prisma.feedback.findUnique({ where: { id: feedbackId } });
  if (!exists) return res.status(404).json({ message: "Feedback no encontrado" });

  const already = await prisma.feedbackVote.findUnique({
    where: { userId_feedbackId: { userId: req.userId, feedbackId } },
  });

  if (already) {
    return res.status(400).json({ message: "Ya votaste esta idea" });
  }

  await prisma.$transaction([
    prisma.feedbackVote.create({
      data: { userId: req.userId, feedbackId },
    }),
    prisma.feedback.update({
      where: { id: feedbackId },
      data: { votes: { increment: 1 } },
    }),
  ]);

  res.json({ ok: true });
});

module.exports = router;
