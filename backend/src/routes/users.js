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

const profileVideoStorage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads/profile_videos"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile-video-${req.userId}-${Date.now()}${ext}`);
  },
});

const coverStorage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads/covers"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `cover-${req.userId}-${Date.now()}${ext}`);
  },
});

const uploadAvatar = multer({ storage: avatarStorage });
const uploadProfileVideo = multer({
  storage: profileVideoStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = ["video/mp4", "video/webm"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Tipo de video inválido"));
    }
    cb(null, true);
  },
});

const uploadCover = multer({ storage: coverStorage });
const uploadCoverVideo = multer({
  storage: coverStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["video/mp4", "video/webm"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Tipo de video inválido"));
    }
    cb(null, true);
  },
});

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
      hasCompletedOnboarding: true,
      profileVideoUrl: true,
      profileVideoThumbnailUrl: true,
      useVideoAvatar: true,
      coverImageUrl: true,
      coverVideoUrl: true,
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
      comments: { orderBy: { createdAt: "asc" }, include: { author: true } },
      squad: true,
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

router.put("/me/profile-video", requireAuth, uploadProfileVideo.single("profileVideo"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No se adjuntó archivo de video" });
  }
  try {
    const rawStart = Number(req.body.start);
    const rawEnd = Number(req.body.end);
    const rawLength = Number(req.body.length);
    const start = Number.isFinite(rawStart) && rawStart >= 0 ? rawStart : 0;
    const desiredLength = Number.isFinite(rawLength)
      ? rawLength
      : Number.isFinite(rawEnd)
        ? rawEnd - start
        : 3;
    const clipLength = Math.min(5, Math.max(3, desiredLength || 3));
    const computedEnd = Number.isFinite(rawEnd) ? rawEnd : start + clipLength;
    const end = Math.min(start + 5, computedEnd);
    const videoPath = path.join("uploads/profile_videos", req.file.filename).replace(/\\/g, "/");
    const finalPath = end ? `${videoPath}#t=${Math.max(0, start)},${Math.max(0, end)}` : videoPath;
    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: { profileVideoUrl: finalPath, useVideoAvatar: true },
    });
    res.json({ user: sanitizeUser(updated) });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ message: "Error al subir video de perfil" });
  }
});

router.put("/me/avatar-mode", requireAuth, async (req, res) => {
  const { useVideoAvatar } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (useVideoAvatar && !user.profileVideoUrl) {
    return res.status(400).json({ message: "No tienes video de perfil para activar el modo video" });
  }
  const updated = await prisma.user.update({
    where: { id: req.userId },
    data: { useVideoAvatar: !!useVideoAvatar },
  });
  res.json({ user: sanitizeUser(updated) });
});

router.put("/me/cover", requireAuth, uploadCover.single("coverImage"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No se adjuntó archivo de portada" });
  }
  const coverPath = path.join("uploads/covers", req.file.filename).replace(/\\/g, "/");
  const updated = await prisma.user.update({
    where: { id: req.userId },
    data: { coverImageUrl: coverPath },
  });
  res.json({ user: sanitizeUser(updated) });
});

router.put("/me/cover-video", requireAuth, uploadCoverVideo.single("coverVideo"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No se adjuntó archivo de video de portada" });
  }
  const rawStart = Number(req.body.start);
  const rawEnd = Number(req.body.end);
  const rawLength = Number(req.body.length);
  const start = Number.isFinite(rawStart) && rawStart >= 0 ? rawStart : 0;
  const desiredLength = Number.isFinite(rawLength)
    ? rawLength
    : Number.isFinite(rawEnd)
      ? rawEnd - start
      : 3;
  const clipLength = Math.min(5, Math.max(3, desiredLength || 3));
  const computedEnd = Number.isFinite(rawEnd) ? rawEnd : start + clipLength;
  const end = Math.min(start + 5, computedEnd);
  const coverPath = path.join("uploads/covers", req.file.filename).replace(/\\/g, "/");
  const finalPath = end ? `${coverPath}#t=${Math.max(0, start)},${Math.max(0, end)}` : coverPath;
  const updated = await prisma.user.update({
    where: { id: req.userId },
    data: { coverVideoUrl: finalPath },
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

// Marca el onboarding como completado
router.put("/me/onboarding", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { hasCompletedOnboarding: true },
    });
    res.json(sanitizeUser(user));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: "Error updating onboarding state" });
  }
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

router.put("/me/projects/:projectId/progress", requireAuth, async (req, res) => {
  const userId = req.userId;
  const projectId = parseInt(req.params.projectId, 10);
  const { progress } = req.body;

  try {
    const project = await prisma.project.update({
      where: { id: projectId, userId },
      data: { progress: Math.min(100, Math.max(0, progress || 0)) },
    });
    res.json(project);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: "Error updating project progress" });
  }
});

router.get("/me/projects/overview", requireAuth, async (req, res) => {
  const userId = req.userId;

  try {
    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        posts: {
          select: {
            id: true,
            type: true,
            createdAt: true,
          },
        },
      },
    });

    const mapped = projects.map((p) => {
      const helpRequests = p.posts.filter((po) => po.type === "HELP_REQUEST");
      const updates = p.posts.filter((po) => po.type === "PROJECT_UPDATE");
      const lastUpdateAt = p.posts.length
        ? p.posts.reduce((max, po) => (po.createdAt > max ? po.createdAt : max), p.posts[0].createdAt)
        : null;

      return {
        ...p,
        postsCount: p.posts.length,
        helpRequestsCount: helpRequests.length,
        updatesCount: updates.length,
        lastUpdateAt,
      };
    });

    res.json(mapped);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: "Error loading projects overview" });
  }
});

router.get("/me/suggested", requireAuth, async (req, res) => {
  const userId = req.userId;
  const limit = parseInt(req.query.limit, 10) || 10;

  try {
    const me = await prisma.user.findUnique({
      where: { id: userId },
      include: { squadMemberships: true },
    });

    const myInterests = me?.interests || [];
    const mySquadIds = me?.squadMemberships?.map((m) => m.squadId) || [];

    const others = await prisma.user.findMany({
      where: {
        id: { not: userId },
        OR: [
          myInterests.length ? { interests: { hasSome: myInterests } } : undefined,
          mySquadIds.length
            ? {
                squadMemberships: {
                  some: { squadId: { in: mySquadIds } },
                },
              }
            : undefined,
        ].filter(Boolean),
      },
      take: limit * 3,
      include: {
        squadMemberships: true,
      },
    });

    const scored = others.map((u) => {
      const sharedInterests = (u.interests || []).filter((i) => myInterests.includes(i));
      const sharedSquads = (u.squadMemberships || []).filter((m) => mySquadIds.includes(m.squadId));
      const score = sharedInterests.length * 2 + sharedSquads.length * 3;

      return {
        id: u.id,
        username: u.username,
        name: u.name,
        avatar: u.avatar,
        sharedInterests,
        sharedSquadsCount: sharedSquads.length,
        score,
      };
    });

    const sorted = scored.sort((a, b) => b.score - a.score).slice(0, limit);

    res.json(sorted);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: "Error loading suggested users" });
  }
});

module.exports = router;
