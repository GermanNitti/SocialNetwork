const prisma = require("../prisma");

const POINTS_TABLE = {
  REGISTER: 50,
  LOGIN: 10,
  POST_CREATED: 5,
  COMMENT_CREATED: 2,
  LIKE_GIVEN: 1,
};

async function addInteractionAndPoints(userId, type) {
  const weight = POINTS_TABLE[type] ?? 0;
  if (!weight) return null;
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      points: { increment: weight },
      totalPointsEarned: { increment: weight },
    },
  });
  await prisma.userInteraction.create({
    data: { userId, type, weight },
  });
  return user;
}

async function handleLoginStreak(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const now = new Date();
  const last = user.lastLoginAt ? new Date(user.lastLoginAt) : null;
  let streak = 1;
  if (last) {
    const diffHours = (now - last) / (1000 * 60 * 60);
    if (diffHours <= 24 && diffHours >= 0) {
      streak = user.loginStreak + 1;
    }
  }
  let bonus = 0;
  if (streak > 0 && streak % 5 === 0) {
    bonus = 20;
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      loginStreak: streak,
      lastLoginAt: now,
      points: { increment: bonus },
      totalPointsEarned: { increment: bonus },
    },
  });
  return { streak, bonus };
}

module.exports = { addInteractionAndPoints, handleLoginStreak };
