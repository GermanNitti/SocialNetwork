const express = require("express");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const makeSlug = async (name) => {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `squad-${Date.now()}`;
  let slug = base;
  let counter = 1;
  // ensure unique
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await prisma.squad.findUnique({ where: { slug } });
    if (!exists) break;
    slug = `${base}-${counter++}`;
  }
  return slug;
};

router.get("/", requireAuth, async (req, res) => {
  const q = (req.query.q || "").trim();
  const squads = await prisma.squad.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { tags: { hasSome: [q] } },
          ],
        }
      : {},
    include: {
      _count: { select: { members: true } },
      members: {
        where: { userId: req.userId },
        select: { userId: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(
    squads.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      tags: s.tags,
      type: s.type,
      membersCount: s._count.members,
      joined: s.members.some((m) => m.userId === req.userId),
    }))
  );
});

router.post("/", requireAuth, async (req, res) => {
  const { name, description, tags = [], type } = req.body;
  if (!name || !description) {
    return res.status(400).json({ message: "name y description son obligatorios" });
  }
  const slug = await makeSlug(name);
  const squad = await prisma.$transaction(async (tx) => {
    const created = await tx.squad.create({
      data: {
        name,
        description,
        tags,
        type,
        slug,
      },
    });
    await tx.squadMember.create({
      data: {
        userId: req.userId,
        squadId: created.id,
        role: "ADMIN",
      },
    });
    return created;
  });
  res.status(201).json(squad);
});

router.post("/:id/join", requireAuth, async (req, res) => {
  const squadId = Number(req.params.id);
  if (Number.isNaN(squadId)) return res.status(400).json({ message: "ID inválido" });

  const squad = await prisma.squad.findUnique({ where: { id: squadId } });
  if (!squad) return res.status(404).json({ message: "Squad no encontrado" });

  const existing = await prisma.squadMember.findUnique({
    where: { userId_squadId: { userId: req.userId, squadId } },
  });
  if (existing) return res.json({ joined: true });

  await prisma.squadMember.create({
    data: { userId: req.userId, squadId, role: "MEMBER" },
  });
  res.json({ joined: true });
});

router.post("/:id/leave", requireAuth, async (req, res) => {
  const squadId = Number(req.params.id);
  if (Number.isNaN(squadId)) return res.status(400).json({ message: "ID inválido" });

  const existing = await prisma.squadMember.findUnique({
    where: { userId_squadId: { userId: req.userId, squadId } },
  });
  if (!existing) return res.status(404).json({ message: "No eres miembro" });

  await prisma.squadMember.delete({
    where: { userId_squadId: { userId: req.userId, squadId } },
  });
  res.json({ left: true });
});

router.get("/:id/posts", requireAuth, async (req, res) => {
  const squadId = Number(req.params.id);
  if (Number.isNaN(squadId)) return res.status(400).json({ message: "ID inválido" });

  const posts = await prisma.post.findMany({
    where: { squadId },
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

  const reactionsSummary = (reactions = []) =>
    reactions.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {});

  res.json(
    posts.map((post) => ({
      id: post.id,
      content: post.content,
      image: post.image,
      createdAt: post.createdAt,
      author: { ...post.author, password: undefined },
      likedBy: post.likes.map((like) => like.userId),
      comments: post.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: { ...comment.author, password: undefined },
      })),
      _count: post._count,
      reactions: reactionsSummary(post.reactions),
      userReaction: post.reactions.find((r) => r.userId === req.userId)?.type || null,
      tags: post.tags,
      type: post.type,
      squad: post.squad ? { id: post.squad.id, name: post.squad.name } : null,
    }))
  );
});

router.get("/:id", requireAuth, async (req, res) => {
  const squadId = Number(req.params.id);
  if (Number.isNaN(squadId)) return res.status(400).json({ message: "ID inválido" });

  const squad = await prisma.squad.findUnique({
    where: { id: squadId },
    include: {
      _count: { select: { members: true } },
      members: {
        include: {
          user: { select: { id: true, username: true, name: true } },
        },
      },
    },
  });

  if (!squad) return res.status(404).json({ message: "Squad no encontrado" });

  res.json({
    id: squad.id,
    name: squad.name,
    description: squad.description,
    tags: squad.tags,
    type: squad.type,
    membersCount: squad._count.members,
    joined: squad.members.some((m) => m.userId === req.userId),
    members: squad.members.map((m) => ({
      userId: m.userId,
      username: m.user.username,
      name: m.user.name,
      role: m.role,
    })),
  });
});

module.exports = router;
