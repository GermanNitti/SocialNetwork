// backend/src/utils/userRelations.js

const BASE_WEIGHTS = {
  like: 0.01,
  comment: 0.03,
  message: 0.05,
  friend_accept: 0.2,
};

function clampScore(score) {
  if (score < 0) return 0;
  if (score > 1) return 1;
  return score;
}

function getOrderedPair(a, b) {
  return a < b ? [a, b] : [b, a];
}

/**
 * Registra una interacción entre dos usuarios y actualiza el score (0 a 1).
 */
async function registerUserInteraction(prisma, userIdA, userIdB, eventType) {
  if (!userIdA || !userIdB) return;
  if (userIdA === userIdB) return;

  const weight = BASE_WEIGHTS[eventType] || 0;
  if (weight === 0) return;

  const [user1Id, user2Id] = getOrderedPair(userIdA, userIdB);

  const existing = await prisma.userRelation.findUnique({
    where: {
      user1Id_user2Id: { user1Id, user2Id },
    },
  });

  if (!existing) {
    await prisma.userRelation.create({
      data: {
        user1Id,
        user2Id,
        score: clampScore(weight),
        lastInteractionAt: new Date(),
      },
    });
    return;
  }

  const newScore = clampScore(existing.score + weight);

  await prisma.userRelation.update({
    where: {
      user1Id_user2Id: { user1Id, user2Id },
    },
    data: {
      score: newScore,
      lastInteractionAt: new Date(),
    },
  });
}

/**
 * Devuelve las relaciones más cercanas (otros usuarios + score).
 */
async function getTopRelations(prisma, userId, limit = 20) {
  const relations = await prisma.userRelation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    orderBy: { score: "desc" },
    take: limit,
  });

  return relations.map((r) => ({
    otherUserId: r.user1Id === userId ? r.user2Id : r.user1Id,
    score: r.score,
    lastInteractionAt: r.lastInteractionAt,
  }));
}

/**
 * Devuelve el score de cercanía entre dos usuarios (0 si no hay registro).
 */
async function getRelationScore(prisma, userIdA, userIdB) {
  if (userIdA === userIdB) return 1;

  const [user1Id, user2Id] = getOrderedPair(userIdA, userIdB);
  const rel = await prisma.userRelation.findUnique({
    where: {
      user1Id_user2Id: { user1Id, user2Id },
    },
  });

  return rel ? rel.score : 0;
}

module.exports = {
  registerUserInteraction,
  getTopRelations,
  getRelationScore,
};
