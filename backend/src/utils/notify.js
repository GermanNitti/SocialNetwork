const prisma = require("../prisma");

async function notify({ userId, type, data }) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        data,
      },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Notification error", e);
  }
}

module.exports = { notify };
