const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function createToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function sanitizeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

router.post("/register", async (req, res) => {
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password) {
    return res.status(400).json({ message: "Faltan campos obligatorios" });
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existing) {
    return res.status(400).json({ message: "Email o username ya registrado" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      username,
      email,
      password: hashedPassword,
    },
  });

  // Badge para fundadores (primeros N usuarios)
  const totalUsers = await prisma.user.count();
  if (totalUsers <= 200) {
    const founderBadge = await prisma.badge.findUnique({ where: { code: "FOUNDER_2025" } });
    if (founderBadge) {
      await prisma.userBadge.upsert({
        where: { userId_badgeId: { userId: user.id, badgeId: founderBadge.id } },
        update: {},
        create: { userId: user.id, badgeId: founderBadge.id },
      });
    }
  }

  const token = createToken(user.id);
  res.status(201).json({ token, user: sanitizeUser(user) });
});

router.post("/login", async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: "Faltan credenciales" });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
  });

  if (!user) {
    return res.status(400).json({ message: "Usuario no encontrado" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(400).json({ message: "Credenciales inválidas" });
  }

  const token = createToken(user.id);
  res.json({ token, user: sanitizeUser(user) });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
  });

  if (!user) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }

  res.json({ user: sanitizeUser(user) });
});

module.exports = router;
