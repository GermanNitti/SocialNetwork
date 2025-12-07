// backend/src/utils/ambiguousReferencesAI.js

const { getRelationScore } = require("./userRelations");

/**
 * Crea una AmbiguousReference a partir de implicitRef de la IA
 * y genera candidatos usando likes + score de cercanía.
 *
 * implicitRef: {
 *   present: boolean,
 *   kind: 'none'|'romantic'|'friend'|'family'|'pet'|'group'|'brand'|'place'|'other',
 *   target_is_person: boolean
 * }
 */
async function createAmbiguousReferenceFromAI(prisma, post, implicitRef) {
  if (!implicitRef || !implicitRef.present) return null;

  const { id: postId, authorId } = post;

  let label = "ambiguous_reference";
  let sentiment = "neutral";

  if (implicitRef.kind === "romantic") {
    label = "possible_love_interest";
    sentiment = "positive";
  } else if (implicitRef.kind === "family") {
    label = "family_reference";
    sentiment = "positive";
  } else if (implicitRef.kind === "friend") {
    label = "friend_reference";
    sentiment = "positive";
  }

  const reference = await prisma.ambiguousReference.create({
    data: {
      postId,
      authorId,
      label,
      sentiment,
      kind: implicitRef.kind || "other",
    },
  });

  // OJO: ajustá 'like' al nombre real de tu modelo si es distinto
  const likes = await prisma.like.findMany({
    where: { postId },
    select: { userId: true },
  });

  const candidateIds = Array.from(new Set(likes.map((l) => l.userId).filter((id) => id !== authorId)));
  if (!candidateIds.length) return reference;

  const scoredCandidates = [];
  for (const targetUserId of candidateIds) {
    const score = await getRelationScore(prisma, authorId, targetUserId);
    if (score > 0) {
      scoredCandidates.push({ targetUserId, score });
    }
  }

  scoredCandidates.sort((a, b) => b.score - a.score);
  const top = scoredCandidates.slice(0, 5);

  await Promise.all(
    top.map((c) =>
      prisma.ambiguousReferenceCandidate.create({
        data: {
          referenceId: reference.id,
          targetUserId: c.targetUserId,
          confidence: c.score,
        },
      })
    )
  );

  return reference;
}

module.exports = {
  createAmbiguousReferenceFromAI,
};
