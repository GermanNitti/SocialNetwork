const express = require("express");
const prisma = require("../prisma");
const { requireAuth } = require("../middleware/auth");
const notify = require("../utils/notify");

const router = express.Router();

// Middleware to check if the reel exists and is accessible
async function getReel(req, res, next) {
  const { reelId } = req.params;
  const userId = req.userId; // Assuming userId is available from requireAuth

  try {
    const reel = await prisma.reel.findUnique({
      where: { id: parseInt(reelId) },
      include: {
        reactions: {
          select: {
            type: true,
            userId: true,
          },
        },
      },
    });

    if (!reel) {
      return res.status(404).json({ message: "Reel not found" });
    }

    // Aggregate reaction counts
    const reactionCounts = reel.reactions.reduce((acc, reaction) => {
      acc[reaction.type] = (acc[reaction.type] || 0) + 1;
      return acc;
    }, {});

    // Check if current user has reacted
    const userReaction = reel.reactions.find(r => r.userId === userId)?.type || null;

    req.reel = {
      ...reel,
      reactions: reactionCounts,
      userReaction: userReaction,
    };
    next();
  } catch (error) {
    console.error("Error fetching reel:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Endpoint for sharing a reel
router.post("/:reelId/share", requireAuth, getReel, async (req, res) => {
  const { id: reelId } = req.reel; // Use the reel ID from the middleware
  const { friendId } = req.body;
  const userId = req.userId; // User sharing the reel

  if (!friendId) {
    return res.status(400).json({ message: "Friend ID is required" });
  }

  // Verify friendship
  const friendship = await prisma.friendship.findFirst({
    where: {
      AND: [
        { status: "ACCEPTED" },
        {
          OR: [
            { requesterId: userId, addresseeId: friendId },
            { requesterId: friendId, addresseeId: userId },
          ],
        },
      ],
    },
  });

  if (!friendship) {
    return res.status(400).json({ message: "You are not friends with this user" });
  }

  // Get sender's username for notification message
  const sender = await prisma.user.findUnique({ where: { id: userId } });
  if (!sender) {
    return res.status(404).json({ message: "Sender not found" });
  }

  // Create notification
  await notify({
    userId: friendId, // Recipient
    actorId: userId,   // Sender
    type: "REEL_SHARED",
    message: `${sender.username} compartió un reel contigo.`,
    link: `/reels/${reelId}`, // Deep link to the reel
    metadata: {
      reelId: reelId,
      sharerUsername: sender.username,
    },
  });

  res.status(200).json({ message: "Reel shared successfully", reelId, friendId });
});

// Endpoint for reacting to a reel
router.post("/:reelId/reactions", requireAuth, getReel, async (req, res) => {
  const { id: reelId } = req.reel; // Use the reel ID from the middleware
  const { type } = req.body; // e.g., 'LIKE', 'LAUGH', 'LOVE'
  const userId = req.userId;

  // Validate reaction type
  // This needs to be consistent with frontend REACTIONS
  const VALID_REACTIONS = ["LIKE", "LOVE", "LAUGH", "SAD", "ANGRY"]; // Example valid types
  if (!VALID_REACTIONS.includes(type)) {
    return res.status(400).json({ message: "Invalid reaction type" });
  }

  // Find existing reaction by this user on this reel
  const existingReaction = await prisma.reelReaction.findUnique({
    where: {
      userId_reelId: {
        userId: userId,
        reelId: reelId,
      },
    },
  });

  let newReaction;
  if (existingReaction) {
    if (existingReaction.type === type) {
      // User is unreacting
      await prisma.reelReaction.delete({
        where: {
          userId_reelId: {
            userId: userId,
            reelId: reelId,
          },
        },
      });
      newReaction = null;
    } else {
      // User is changing reaction type
      newReaction = await prisma.reelReaction.update({
        where: {
          userId_reelId: {
            userId: userId,
            reelId: reelId,
          },
        },
        data: { type: type },
      });
    }
  } else {
    // User is adding a new reaction
    newReaction = await prisma.reelReaction.create({
      data: {
        userId: userId,
        reelId: reelId,
        type: type,
      },
    });
  }

  // Recalculate and return all reactions for the reel
  const reactions = await prisma.reelReaction.groupBy({
    by: ["type"],
    where: { reelId: reelId },
    _count: {
      type: true,
    },
  });

  const formattedReactions = reactions.reduce((acc, curr) => {
    acc[curr.type] = curr._count.type;
    return acc;
  }, {});

  res.status(200).json({
    message: "Reaction updated",
    userReaction: newReaction ? newReaction.type : null,
    reactions: formattedReactions,
  });
});


module.exports = router;