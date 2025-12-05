const express = require("express");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");
const { notify } = require("../utils/notify");

const router = express.Router();

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
};

const getOrCreateDirectConversation = async (userId, otherId) => {
  const existing = await prisma.conversation.findFirst({
    where: {
      isDirect: true,
      participants: { every: { userId: { in: [userId, otherId] } } },
    },
    include: { participants: true },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      isDirect: true,
      participants: {
        createMany: {
          data: [
            { userId },
            { userId: otherId },
          ],
        },
      },
    },
    include: { participants: true },
  });
};

// Crea o recupera conversación directa con un usuario
router.post("/start/:username", requireAuth, async (req, res) => {
  const target = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!target) return res.status(404).json({ message: "Usuario no encontrado" });
  if (target.id === req.userId) return res.status(400).json({ message: "No puedes chatear contigo" });

  const conversation = await getOrCreateDirectConversation(req.userId, target.id);
  res.json({ id: conversation.id });
});

router.get("/conversations", requireAuth, async (req, res) => {
  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId: req.userId } } },
    include: {
      participants: { include: { user: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(
    conversations.map((c) => ({
      id: c.id,
      isDirect: c.isDirect,
      participants: c.participants.map((p) => sanitizeUser(p.user)),
      lastMessage: c.messages[0]
        ? {
            id: c.messages[0].id,
            content: c.messages[0].content,
            createdAt: c.messages[0].createdAt,
            sender: sanitizeUser(c.messages[0].sender),
          }
        : null,
    }))
  );
});

router.get("/:id/messages", requireAuth, async (req, res) => {
  const conversationId = Number(req.params.id);
  if (Number.isNaN(conversationId)) return res.status(400).json({ message: "ID inválido" });

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      participants: { some: { userId: req.userId } },
    },
  });
  if (!conversation) return res.status(404).json({ message: "Conversación no encontrada" });

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: { sender: true },
  });

  res.json(
    messages.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt,
      sender: sanitizeUser(m.sender),
    }))
  );
});

router.post("/to/:username", requireAuth, async (req, res) => {
  const target = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!target) return res.status(404).json({ message: "Usuario no encontrado" });
  if (!req.body.content || !req.body.content.trim()) {
    return res.status(400).json({ message: "Contenido vacío" });
  }

  const conversation = await getOrCreateDirectConversation(req.userId, target.id);
  const message = await prisma.message.create({
    data: {
      content: req.body.content,
      conversationId: conversation.id,
      senderId: req.userId,
    },
    include: { sender: true },
  });

  if (target.id !== req.userId) {
    await notify({
      userId: target.id,
      type: "MESSAGE",
      data: { conversationId: conversation.id, by: req.userId },
    });
  }

  res.status(201).json({
    id: message.id,
    content: message.content,
    createdAt: message.createdAt,
    sender: sanitizeUser(message.sender),
    conversationId: conversation.id,
  });
});

module.exports = router;
