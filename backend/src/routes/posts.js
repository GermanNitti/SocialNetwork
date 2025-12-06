const express = require("express");
const multer = require("multer");
const path = require("path");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");
const { notify } = require("../utils/notify");

const router = express.Router();

const REACTIONS = {
  MACANUDO: { label: "Macanudo", icon: "\u{1F44D}" },
  MESSIRVE: { label: "Messirve", icon: "\u{1F410}" }, // cabra
  JAJAJA: { label: "Jajaja", icon: "\u{1F923}" },
  DE_UNA: { label: "De una", icon: "\u{1F60D}" },
  QUE_BOLUDO: { label: "Que boludo", icon: "\u{1F644}" },
  QUE_BAJON: { label: "Que bajon", icon: "\u{1F622}" },
};
const REACTION_TYPES = Object.keys(REACTIONS);

const postStorage = multer.diskStorage({
  destination: path.join(__dirname, "../../uploads/posts"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `post-${req.userId}-${Date.now()}${ext}`);
  },
});

const uploadPostImage = multer({ storage: postStorage });

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
};

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

const findMentions = (text = "") => {
  const matches = text.match(/@([a-zA-Z0-9_]+)/g) || [];
  return [...new Set(matches.map((m) => m.slice(1)))];
};

const serializePost = (post, userId) => ({
  id: post.id,
  content: post.content,
  image: post.image,
  createdAt: post.createdAt,
  author: sanitizeUser(post.author),
  likedBy: post.likes.map((like) => like.userId),
  comments: post.comments.map((comment) => ({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    author: sanitizeUser(comment.author),
  })),
  _count: post._count,
  reactions: summarizeReactions(post.reactions),
  userReaction: post.reactions.find((r) => r.userId === userId)?.type || null,
  tags: post.tags,
  type: post.type,
  squad: post.squad ? { id: post.squad.id, name: post.squad.name } : null,
});

router.get("/", requireAuth, async (req, res) => {
  const { take = 20, skip = 0 } = req.query;
  const posts = await prisma.post.findMany({
    take: Number(take),
    skip: Number(skip),
    orderBy: { createdAt: "desc" },
    include: {
      author: true,
      _count: { select: { likes: true, comments: true } },
      likes: { select: { userId: true } },
      reactions: true,
      comments: {
        orderBy: { createdAt: "desc" },
        include: { author: true },
      },
      squad: true,
    },
  });

  res.json(posts.map((post) => serializePost(post, req.userId)));
});

router.get("/feed/personal", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: {
      squadMemberships: { select: { squadId: true } },
    },
  });
  const interests = user?.interests || [];
  const squadIds = (user?.squadMemberships || []).map((m) => m.squadId);

  const candidates = await prisma.post.findMany({
    where: {
      OR: [
        squadIds.length > 0 ? { squadId: { in: squadIds } } : undefined,
        interests.length > 0 ? { tags: { hasSome: interests } } : undefined,
      ].filter(Boolean),
    },
    orderBy: { createdAt: "desc" },
    include: {
      author: true,
      _count: { select: { likes: true, comments: true } },
      likes: { select: { userId: true } },
      reactions: true,
      comments: {
        orderBy: { createdAt: "desc" },
        include: { author: true },
      },
      squad: true,
    },
  });

  const interestSet = new Set(interests);
  const squadSet = new Set(squadIds);

  const scored = candidates.map((p) => {
    const inSquad = p.squadId && squadSet.has(p.squadId);
    const hasInterest = (p.tags || []).some((t) => interestSet.has(t));
    let score = 0;
    if (inSquad && hasInterest) score = 3;
    else if (inSquad) score = 2;
    else if (hasInterest) score = 1;
    return { post: p, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.post.createdAt) - new Date(a.post.createdAt);
  });

  res.json(scored.map(({ post }) => serializePost(post, req.userId)));
});

router.post("/", requireAuth, uploadPostImage.single("image"), async (req, res) => {
  const { content, tags = [], type = "NORMAL", squadId, projectId } = req.body;
  if (!content) {
    return res.status(400).json({ message: "El contenido es obligatorio" });
  }

  const imagePath = req.file
    ? path.join("uploads/posts", req.file.filename).replace(/\\/g, "/")
    : null;

  if (squadId) {
    const squadExists = await prisma.squad.findUnique({ where: { id: Number(squadId) } });
    if (!squadExists) return res.status(400).json({ message: "Squad no encontrado" });
  }

  if (projectId) {
    const projectExists = await prisma.project.findUnique({ where: { id: Number(projectId) } });
    if (!projectExists) return res.status(400).json({ message: "Proyecto no encontrado" });
  }

  const post = await prisma.post.create({
    data: {
      content,
      image: imagePath,
      authorId: req.userId,
      tags,
      type,
      squadId: squadId ? Number(squadId) : undefined,
      projectId: projectId ? Number(projectId) : undefined,
    },
    include: {
      author: true,
      _count: { select: { likes: true, comments: true } },
      likes: { select: { userId: true } },
      reactions: true,
      comments: { orderBy: { createdAt: "desc" }, include: { author: true } },
      squad: true,
    },
  });

  const mentionUsernames = findMentions(content);
  if (mentionUsernames.length > 0) {
    const mentioned = await prisma.user.findMany({
      where: { username: { in: mentionUsernames } },
      select: { id: true },
    });
    await Promise.all(
      mentioned
        .filter((u) => u.id !== req.userId)
        .map((u) =>
          notify({
            userId: u.id,
            type: "MENTION",
            data: { postId: post.id, by: req.userId },
          })
        )
    );
  }

  res.status(201).json(serializePost(post, req.userId));
});

router.get("/:id", requireAuth, async (req, res) => {
  const postId = Number(req.params.id);
  if (Number.isNaN(postId)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: true,
      _count: { select: { likes: true, comments: true } },
      likes: { select: { userId: true } },
      reactions: true,
      comments: { orderBy: { createdAt: "desc" }, include: { author: true } },
      squad: true,
    },
  });

  if (!post) {
    return res.status(404).json({ message: "Post no encontrado" });
  }

  res.json({
    id: post.id,
    content: post.content,
    image: post.image,
    createdAt: post.createdAt,
    author: sanitizeUser(post.author),
    likedBy: post.likes.map((like) => like.userId),
    comments: post.comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: sanitizeUser(comment.author),
    })),
    _count: post._count,
    reactions: summarizeReactions(post.reactions),
    userReaction: post.reactions.find((r) => r.userId === req.userId)?.type || null,
  });
});

router.post("/:id/like", requireAuth, async (req, res) => {
  const postId = Number(req.params.id);
  if (Number.isNaN(postId)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId: req.userId, postId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({
      data: {
        userId: req.userId,
        postId,
      },
    });
  }

  const likesCount = await prisma.like.count({ where: { postId } });
  res.json({ liked: !existing, likesCount });
});

router.post("/:id/reactions", requireAuth, async (req, res) => {
  const postId = Number(req.params.id);
  if (Number.isNaN(postId)) {
    return res.status(400).json({ message: "ID inválido" });
  }
  const { type } = req.body;
  if (!type || !REACTIONS[type]) {
    return res.status(400).json({ message: "Reacción inválida" });
  }

  const existing = await prisma.reaction.findUnique({
    where: { userId_postId: { userId: req.userId, postId } },
  });

  if (existing && existing.type === type) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else if (existing) {
    await prisma.reaction.update({ where: { id: existing.id }, data: { type } });
  } else {
    await prisma.reaction.create({
      data: {
        userId: req.userId,
        postId,
        type,
      },
    });
  }

  const reactions = await prisma.reaction.findMany({ where: { postId } });
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (post && post.authorId !== req.userId && type) {
    await notify({
      userId: post.authorId,
      type: "REACTION",
      data: { kind: "POST_REACTION", postId, by: req.userId, reaction: type },
    });
  }
  res.json({
    reactions: summarizeReactions(reactions),
    userReaction: reactions.find((r) => r.userId === req.userId)?.type || null,
  });
});

router.get("/:id/comments", async (req, res) => {
  const postId = Number(req.params.id);
  if (Number.isNaN(postId)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: { author: true },
  });

  res.json(
    comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: sanitizeUser(comment.author),
    }))
  );
});

router.post("/:id/comments", requireAuth, async (req, res) => {
  const postId = Number(req.params.id);
  if (Number.isNaN(postId)) {
    return res.status(400).json({ message: "ID inválido" });
  }
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ message: "El comentario es obligatorio" });
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      postId,
      authorId: req.userId,
    },
    include: { author: true },
  });

  // Notifica al autor del post
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (post && post.authorId !== req.userId) {
    await notify({
      userId: post.authorId,
      type: "REACTION",
      data: { kind: "COMMENT", postId, by: req.userId },
    });
  }

  // Notifica menciones en el comentario
  const mentionUsernames = findMentions(content);
  if (mentionUsernames.length > 0) {
    const mentioned = await prisma.user.findMany({
      where: { username: { in: mentionUsernames } },
      select: { id: true },
    });
    await Promise.all(
      mentioned
        .filter((u) => u.id !== req.userId)
        .map((u) =>
          notify({
            userId: u.id,
            type: "MENTION",
            data: { postId, by: req.userId },
          })
        )
    );
  }

  res.status(201).json({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    author: sanitizeUser(comment.author),
  });
});

module.exports = router;
