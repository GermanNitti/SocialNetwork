const express = require("express");
const multer = require("multer");
const path = require("path");
const prisma = require("../prisma");
const { requireAuth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

const avatarStorage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads/avatars"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.userId}-${Date.now()}${ext}`);
  },
});

const uploadAvatar = multer({ storage: avatarStorage });

const sanitizeUser = (user) => {
  if (!user) return null;
  // Remove password if included
  // eslint-disable-next-line no-unused-vars
  const { password, ...rest } = user;
  return rest;
};

const REACTION_TYPES = ["MACANUDO", "MESSIRVE", "JAJAJA", "DE_UNA", "QUE_BOLUDO", "QUE_BAJON"];
const summarizeReactions = (reactions = []) => {
  const base = {};
  REACTION_TYPES.forEach((t) => {
    base[t] = 0;
  });
  reactions.forEach((r) => {
    base[r.type] = (base[r.type] || 0) + 1;
  });
  return base;
};

const getFriendshipStatus = async (currentUserId, targetUserId) => {
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: currentUserId, addresseeId: targetUserId },
        { requesterId: targetUserId, addresseeId: currentUserId },
      ],
    },
  });

  if (!friendship) return "NONE";
  if (friendship.status === "ACCEPTED") return "FRIENDS";
  if (friendship.requesterId === currentUserId) return "OUTGOING";
  return "INCOMING";
};

router.get("/search", optionalAuth, async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) {
    return res.json([]);
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } },
      ],
      NOT: req.userId ? { id: req.userId } : undefined,
    },
    take: 5,
    orderBy: { name: "asc" },
  });

  res.json(users.map(sanitizeUser));
});

router.get("/:username", optionalAuth, async (req, res) => {
  const { username } = req.params;
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      bio: true,
      avatar: true,
      location: true,
      interests: true,
      createdAt: true,
      _count: { select: { posts: true } },
      userBadges: {
        include: { badge: true },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }

  const posts = await prisma.post.findMany({
    where: { author: { username } },
    orderBy: { createdAt: "desc" },
    include: {
      author: true,
      _count: { select: { likes: true, comments: true } },
      likes: {
        select: { userId: true },
      },
      reactions: true,
      comments: { orderBy: { createdAt: "desc" }, include: { author: true } },
    },
  });

  const friendsCount = await prisma.friendship.count({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: user.id }, { addresseeId: user.id }],
    },
  });

  let friendshipStatus = "NONE";
  let friendship = null;
  if (req.userId) {
    friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: req.userId, addresseeId: user.id },
          { requesterId: user.id, addresseeId: req.userId },
        ],
      },
    });
    friendshipStatus = friendship
      ? friendship.status === "ACCEPTED"
        ? "FRIENDS"
        : friendship.requesterId === req.userId
          ? "OUTGOING"
          : "INCOMING"
      : "NONE";
  }

  res.json({
    user: {
      ...user,
      friendsCount,
      friendshipStatus,
      relationCategory: friendship?.relationCategory || null,
      relationDetail: friendship?.relationDetail || null,
      badges:
        user.userBadges?.map((ub) => ({
          code: ub.badge.code,
          name: ub.badge.name,
          description: ub.badge.description,
          icon: ub.badge.icon,
        })) || [],
    },
    posts: posts.map((post) => ({
      id: post.id,
      content: post.content,
      image: post.image,
      createdAt: post.createdAt,
      author: sanitizeUser(post.author),
      likedBy: post.likes.map((like) => like.userId),
      _count: post._count,
      reactions: summarizeReactions(post.reactions),
      userReaction: post.reactions.find((r) => r.userId === req.userId)?.type || null,
      comments: post.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: sanitizeUser(comment.author),
      })),
    })),
  });
});

router.put("/me", requireAuth, async (req, res) => {
  const { name, bio, username } = req.body;

  if (!name || !username) {
    return res.status(400).json({ message: "Nombre y username son obligatorios" });
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }

  if (username !== user.username) {
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ message: "Username ya está en uso" });
    }
  }

  const updated = await prisma.user.update({
    where: { id: req.userId },
    data: { name, bio, username },
  });

  res.json({ user: sanitizeUser(updated) });
});

router.put("/me/avatar", requireAuth, uploadAvatar.single("avatar"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No se adjuntó archivo" });
  }

  const avatarPath = path.join("uploads/avatars", req.file.filename).replace(/\\/g, "/");

  const updated = await prisma.user.update({
    where: { id: req.userId },
    data: { avatar: avatarPath },
  });

  res.json({ user: sanitizeUser(updated) });
});

router.put("/me/interests", requireAuth, async (req, res) => {
  const { interests } = req.body;
  if (!Array.isArray(interests)) {
    return res.status(400).json({ message: "interests debe ser un array de strings" });
  }
  const updated = await prisma.user.update({
    where: { id: req.userId },
    data: { interests },
  });
  res.json({ user: sanitizeUser(updated) });
});

router.put("/me/location", requireAuth, async (req, res) => {
  const { location } = req.body;
  if (!location || typeof location !== "string") {
    return res.status(400).json({ message: "location es obligatorio" });
  }
  const updated = await prisma.user.update({
    where: { id: req.userId },
    data: { location },
  });
  res.json({ user: sanitizeUser(updated) });
});

router.get("/me/projects", requireAuth, async (req, res) => {
  const projects = await prisma.project.findMany({
    where: { userId: req.userId },
    orderBy: { id: "desc" },
  });
  res.json(projects);
});

router.post("/me/projects", requireAuth, async (req, res) => {
  const { title, description, category, targetDate, visibility, needsHelp } = req.body;
  if (!title) return res.status(400).json({ message: "title es obligatorio" });
  const project = await prisma.project.create({
    data: {
      userId: req.userId,
      title,
      description,
      category,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      visibility,
      needsHelp,
    },
  });
  res.status(201).json(project);
});

router.put("/me/projects/:projectId", requireAuth, async (req, res) => {
  const projectId = Number(req.params.projectId);
  if (Number.isNaN(projectId)) return res.status(400).json({ message: "ID inválido" });

  const existing = await prisma.project.findUnique({ where: { id: projectId } });
  if (!existing || existing.userId !== req.userId) {
    return res.status(404).json({ message: "Proyecto no encontrado" });
  }

  const { title, description, category, targetDate, visibility, needsHelp } = req.body;
  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      title,
      description,
      category,
      targetDate: targetDate ? new Date(targetDate) : null,
      visibility,
      needsHelp,
    },
  });
  res.json(updated);
});

router.delete("/me/projects/:projectId", requireAuth, async (req, res) => {
  const projectId = Number(req.params.projectId);
  if (Number.isNaN(projectId)) return res.status(400).json({ message: "ID inválido" });

  const existing = await prisma.project.findUnique({ where: { id: projectId } });
  if (!existing || existing.userId !== req.userId) {
    return res.status(404).json({ message: "Proyecto no encontrado" });
  }

  await prisma.project.delete({ where: { id: projectId } });
  res.json({ ok: true });
});

module.exports = router;
