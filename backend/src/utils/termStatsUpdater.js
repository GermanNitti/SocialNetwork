// backend/src/utils/termStatsUpdater.js

const { extractTermsFromText } = require("./terms");

/**
 * Actualiza TermGlobal, TermTopicStats y UserTermStats a partir de un post.
 * post: debe tener { id, authorId, content, tags }
 */
async function updateTermStatsFromPost(prisma, post) {
  const { authorId, content, tags } = post;
  const terms = extractTermsFromText(content);
  if (!terms.length) return;

  const uniqueNorms = new Map();
  for (const t of terms) {
    if (!uniqueNorms.has(t.normalized)) {
      uniqueNorms.set(t.normalized, t);
    }
  }

  const now = new Date();
  const tagList = Array.isArray(tags) ? tags : [];

  // TermGlobal + TermTopicStats
  await Promise.all(
    Array.from(uniqueNorms.values()).map((t) => {
      return prisma.$transaction([
        prisma.termGlobal.upsert({
          where: { normalized: t.normalized },
          update: {
            totalCount: { increment: 1 },
            lastSeenAt: now,
          },
          create: {
            term: t.raw,
            normalized: t.normalized,
            totalCount: 1,
            firstSeenAt: now,
            lastSeenAt: now,
          },
        }),
        ...tagList.map((tag) =>
          prisma.termTopicStats.upsert({
            where: {
              termNormalized_tag: {
                termNormalized: t.normalized,
                tag,
              },
            },
            update: {
              count: { increment: 1 },
            },
            create: {
              termNormalized: t.normalized,
              tag,
              count: 1,
            },
          })
        ),
      ]);
    })
  );

  // UserTermStats
  await Promise.all(
    Array.from(uniqueNorms.values()).map(async (t) => {
      const existing = await prisma.userTermStats.findFirst({
        where: { userId: authorId, normalized: t.normalized },
      });
      if (existing) {
        await prisma.userTermStats.update({
          where: { id: existing.id },
          data: {
            count: { increment: 1 },
            lastSeenAt: now,
            isProperName: t.isProperName || existing.isProperName,
          },
        });
      } else {
        await prisma.userTermStats.create({
          data: {
            userId: authorId,
            term: t.raw,
            normalized: t.normalized,
            count: 1,
            lastSeenAt: now,
            isProperName: t.isProperName || false,
          },
        });
      }
    })
  );
}

module.exports = {
  updateTermStatsFromPost,
};
