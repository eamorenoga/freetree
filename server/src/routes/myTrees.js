const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (request, response, next) => {
  try {
    const userTrees = await prisma.userTree.findMany({
      where: { userId: request.user.id },
      include: {
        tree: true,
        trackingEvents: { orderBy: { eventDate: "desc" } }
      },
      orderBy: { createdAt: "desc" }
    });

    response.json({ userTrees });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
