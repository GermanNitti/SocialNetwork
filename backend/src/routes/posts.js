const express = require("express");
const multer = require("multer");
const path = require("path");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");
const { notify } = require("../utils/notify");
const { extractHashtagsObjects, normalizeHashtag } = require("../utils/hashtags");
const { detectTopicsFromText } = require("../utils/topicDetection");
const { analyzeEmotionWithAI } = require("../services/aiPostAnalyzer");
const { updateTermStatsFromPost } = require("../utils/termStatsUpdater");
const { registerUserInteraction } = require("../utils/userRelations");
const { createAmbiguousReferenceFromAI } = require("../utils/ambiguousReferencesAI");
const { GROQ_ENABLED } = require("../services/aiClient");
const { uploadToCloudinary } = require("../services/cloudinaryService");

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

const postStorage = multer.memoryStorage();
const uploadPostImage = multer({ storage: postStorage, limits: { fileSize: 5 * 1024 * 1024 } });

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

const mapComment = (comment, userId) => ({
  id: comment.id,
  content: comment.content,
  createdAt: comment.createdAt,
  author: sanitizeUser(comment.author),
  reactions: summarizeReactions(comment.reactions || []),
  userReaction: comment.reactions?.find((r) => r.userId === userId)?.type || null,
});

const serializePost = (post, userId) => ({
  id: post.id,
  content: post.content,
  image: post.image,
  createdAt: post.createdAt,
  author: sanitizeUser(post.author),
  likedBy: post.likes.map((like) => like.userId),
  comments: post.comments.map((comment) => mapComment(comment, userId)),
  _count: post._count,
  reactions: summarizeReactions(post.reactions),
  userReaction: post.reactions.find((r) => r.userId === userId)?.type || null,
  tags: post.tags,
  hashtags: post.hashtags || [],
  type: post.type,
  squad: post.squad ? { id: post.squad.id, name: post.squad.name } : null,
  emotion: post.emotion,
  emotionColor: post.emotionColor,
});

router.get("/", requireAuth, async (req, res) => {
  const { take = 20, skip = 0, tag: tagParam } = req.query;

  const where = {};
  if (tagParam) {
    const canonicalTag = normalizeHashtag(tagParam);
    if (canonicalTag) {
      where.tags = { has: canonicalTag };
    }
  }

  try {
    const posts = await prisma.post.findMany({
      take: Number(take),
      skip: Number(skip),
      orderBy: { createdAt: "desc" },
      where,
      include: {
        author: true,
        _count: { select: { likes: true, comments: true } },
        likes: { select: { userId: true } },
        reactions: true,
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: true,
            reactions: true,
          },
        },
        squad: true,
      },
    });

    res.json(posts.map((post) => serializePost(post, req.userId)));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: "Error cargando posts" });
  }
});

router.get("/feed/personal", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: {
      squadMemberships: { select: { squadId: true } },
    },
  });
  const interests = (user?.interests || []).map((i) => normalizeHashtag(i) || i);
  const interestsCanonical = interests.map((i) => normalizeHashtag(i) || i);
  const squadIds = (user?.squadMemberships || []).map((m) => m.squadId);

  const candidates = await prisma.post.findMany({
    where: {
      OR: [
        squadIds.length > 0 ? { squadId: { in: squadIds } } : undefined,
        interestsCanonical.length > 0 ? { tags: { hasSome: interestsCanonical } } : undefined,
      ].filter(Boolean),
    },
    orderBy: { createdAt: "desc" },
    include: {
      author: true,
      _count: { select: { likes: true, comments: true } },
      likes: { select: { userId: true } },
      reactions: true,
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: true },
      },
      squad: true,
    },
  });

  const interestSet = new Set(interestsCanonical);
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

// Feed de pedidos de ayuda personalizados para el usuario
router.get("/feed/help", requireAuth, async (req, res) => {
  const userId = req.userId;
  const take = parseInt(req.query.take, 10) || 20;
  const skip = parseInt(req.query.skip, 10) || 0;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        squadMemberships: true,
      },
    });

    const squadIds = user?.squadMemberships?.map((m) => m.squadId) || [];
    const interests = user?.interests || [];

    const posts = await prisma.post.findMany({
      where: {
        type: "HELP_REQUEST",
        OR: [
          squadIds.length > 0 ? { squadId: { in: squadIds } } : undefined,
          interests.length > 0 ? { tags: { hasSome: interests } } : undefined,
        ].filter(Boolean),
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        author: true,
        _count: { select: { likes: true, comments: true } },
        likes: { select: { userId: true } },
        reactions: true,
        comments: { orderBy: { createdAt: "asc" }, include: { author: true } },
        squad: true,
      },
    });

    res.json(posts.map((p) => serializePost(p, userId)));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: "Error loading help feed" });
  }
});

router.get("/project/:projectId", requireAuth, async (req, res) => {
  const projectId = Number(req.params.projectId);
  if (Number.isNaN(projectId)) return res.status(400).json({ message: "ID inválido" });

  const posts = await prisma.post.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: {
      author: true,
      _count: { select: { likes: true, comments: true } },
      likes: { select: { userId: true } },
      reactions: true,
        comments: {
          orderBy: { createdAt: "asc" },
          include: { author: true },
        },
      squad: true,
    },
  });

  res.json(posts.map((post) => serializePost(post, req.userId)));
});

router.post("/", requireAuth, uploadPostImage.single("image"), async (req, res) => {
  try {
    const { content, tags: bodyTags, type, squadId, projectId } = req.body;

    if (!content) {
      return res.status(400).json({ message: "El contenido es obligatorio" });
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer, "posts", "image");
    }

    if (squadId) {
      const squadExists = await prisma.squad.findUnique({ where: { id: Number(squadId) } });
      if (!squadExists) return res.status(400).json({ message: "Squad no encontrado" });
    }

    if (projectId) {
      const projectExists = await prisma.project.findUnique({ where: { id: Number(projectId) } });
      if (!projectExists) return res.status(400).json({ message: "Proyecto no encontrado" });
    }

    // 1) Análisis de emociones con IA
    const emotionAnalysis = await analyzeEmotionWithAI(content);
    console.log("[Post Create] Emoción detectada:", emotionAnalysis);

    // 2) Tags explícitos y hashtags escritos (sin IA)
    const explicitTags = Array.isArray(bodyTags) ? bodyTags : [];
    const hashtagObjects = extractHashtagsObjects(content);
    const canonicalFromHashtags = hashtagObjects.map((h) => h.canonical);
    const dictTopics = typeof detectTopicsFromText === "function" ? detectTopicsFromText(content) : [];

    // 3) Unir tags
    const allCanonicalTags = Array.from(
      new Set([...explicitTags, ...canonicalFromHashtags, ...dictTopics])
    );

    const post = await prisma.post.create({
      data: {
        content,
        tags: allCanonicalTags,
        hashtags: [],
        type: type || "NORMAL",
        squadId: squadId ? Number(squadId) : null,
        projectId: projectId ? Number(projectId) : null,
        authorId: req.userId,
        image: imageUrl,
        emotion: emotionAnalysis.emotion,
        emotionColor: emotionAnalysis.emotionColor,
      },
      include: {
        author: true,
        _count: { select: { likes: true, comments: true } },
        likes: { select: { userId: true } },
        reactions: true,
        comments: { orderBy: { createdAt: "desc" }, include: { author: true, reactions: true } },
        squad: true,
      },
    });

    // 7) Notifica menciones
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

    // 4) Stats de términos (global, por tag, por usuario)
    await updateTermStatsFromPost(prisma, post);

    // 5) Stats de hashtags
    if (hashtagObjects.length > 0 && prisma.hashtag?.upsert) {
      await Promise.all(
        hashtagObjects.map((h) =>
          prisma.hashtag.upsert({
            where: { canonical: h.canonical },
            update: {
              useCount: { increment: 1 },
              lastUsedAt: new Date(),
              display: h.raw,
            },
            create: {
              canonical: h.canonical,
              display: h.raw,
              useCount: 1,
              lastUsedAt: new Date(),
            },
          })
        )
      );
    }

    const responsePost = serializePost(post, req.userId);
    res.json(responsePost);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: "Error creando post" });
  }
});

// Editar post (sólo autor)
router.put("/:id", requireAuth, async (req, res) => {
  const postId = Number(req.params.id);
  if (Number.isNaN(postId)) return res.status(400).json({ message: "ID inválido" });

  const existing = await prisma.post.findUnique({ where: { id: postId } });
  if (!existing) return res.status(404).json({ message: "Post no encontrado" });
  if (existing.authorId !== req.userId) return res.status(403).json({ message: "No autorizado" });

  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ message: "El contenido es obligatorio" });

  // Recalcular tags y emoción
  const emotionAnalysis = await analyzeEmotionWithAI(content);
  const explicitTags = Array.isArray(req.body.tags) ? req.body.tags : [];
  const hashtagObjects = extractHashtagsObjects(content);
  const canonicalFromHashtags = hashtagObjects.map((h) => h.canonical);
  const dictTopics = typeof detectTopicsFromText === "function" ? detectTopicsFromText(content) : [];

  const allCanonicalTags = Array.from(
    new Set([...explicitTags, ...canonicalFromHashtags, ...dictTopics])
  );

  const post = await prisma.post.update({
    where: { id: postId },
    data: { content, tags: allCanonicalTags, hashtags: [], emotion: emotionAnalysis.emotion, emotionColor: emotionAnalysis.emotionColor },
    include: {
      author: true,
      _count: { select: { likes: true, comments: true } },
      likes: { select: { userId: true } },
      reactions: true,
      comments: { orderBy: { createdAt: "asc" }, include: { author: true, reactions: true } },
      squad: true,
    },
  });

  const responsePost = serializePost(post, req.userId);
  res.json(responsePost);
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
      comments: { orderBy: { createdAt: "desc" }, include: { author: true, reactions: true } },
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

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true },
  });
  if (!post) return res.status(404).json({ error: "Post no encontrado" });

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
    // incrementar cercanía
    await registerUserInteraction(prisma, req.userId, post.authorId, "like");
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
    include: { author: true, reactions: true },
  });

  res.json(
    comments.map((comment) => mapComment(comment, req.userId))
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

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true },
  });
  if (!post) return res.status(404).json({ error: "Post no encontrado" });

  const comment = await prisma.comment.create({
    data: {
      content,
      postId,
      authorId: req.userId,
    },
    include: { author: true },
  });

  // Notifica al autor del post
  if (post && post.authorId !== req.userId) {
    await notify({
      userId: post.authorId,
      type: "REACTION",
      data: { kind: "COMMENT", postId, by: req.userId },
    });
    // incrementar cercanía
    await registerUserInteraction(prisma, req.userId, post.authorId, "comment");
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
    reactions: summarizeReactions([]),
    userReaction: null,
  });
});

// Editar comentario (sólo autor)
router.put("/:postId/comments/:commentId", requireAuth, async (req, res) => {
  const postId = Number(req.params.postId);
  const commentId = Number(req.params.commentId);
  if (Number.isNaN(postId) || Number.isNaN(commentId)) {
    return res.status(400).json({ message: "ID inválido" });
  }
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ message: "El contenido es obligatorio" });
  }

  const existing = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!existing || existing.postId !== postId) {
    return res.status(404).json({ message: "Comentario no encontrado" });
  }
  if (existing.authorId !== req.userId) {
    return res.status(403).json({ message: "No autorizado" });
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { content },
    include: { author: true, reactions: true },
  });

  res.json(mapComment(updated, req.userId));
});

// Reacciones en comentarios
router.post("/:postId/comments/:commentId/reactions", requireAuth, async (req, res) => {
  const postId = Number(req.params.postId);
  const commentId = Number(req.params.commentId);
  const { type } = req.body;
  if (Number.isNaN(postId) || Number.isNaN(commentId)) {
    return res.status(400).json({ message: "ID inválido" });
  }
  if (!type || !REACTIONS[type]) {
    return res.status(400).json({ message: "Reacción inválida" });
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, postId: true, authorId: true },
  });
  if (!comment || comment.postId !== postId) {
    return res.status(404).json({ message: "Comentario no encontrado" });
  }

  const existing = await prisma.commentReaction.findUnique({
    where: { userId_commentId: { userId: req.userId, commentId } },
  });

  if (existing && existing.type === type) {
    await prisma.commentReaction.delete({ where: { id: existing.id } });
  } else if (existing) {
    await prisma.commentReaction.update({ where: { id: existing.id }, data: { type } });
  } else {
    await prisma.commentReaction.create({
      data: { userId: req.userId, commentId, type },
    });
  }

  const reactions = await prisma.commentReaction.findMany({ where: { commentId } });
  res.json({
    reactions: summarizeReactions(reactions),
    userReaction: reactions.find((r) => r.userId === req.userId)?.type || null,
  });
});

module.exports = router;
