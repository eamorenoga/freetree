const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (request, response, next) => {
  try {
    const userTrees = await prisma.userTree.findMany({
      where: { userId: request.user.id },
      include: { tree: true }
    });
    const records = await prisma.carbonRecord.findMany({
      where: { userId: request.user.id },
      orderBy: { createdAt: "desc" }
    });
    const estimatedKgCo2 = userTrees.reduce((sum, userTree) => sum + userTree.tree.estimatedCo2, 0);

    response.json({
      summary: {
        treesCount: userTrees.length,
        estimatedKgCo2
      },
      records
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (request, response, next) => {
  try {
    const userTrees = await prisma.userTree.findMany({
      where: { userId: request.user.id },
      include: { tree: true }
    });
    const estimatedKgCo2 = userTrees.reduce((sum, userTree) => sum + userTree.tree.estimatedCo2, 0);

    const record = await prisma.carbonRecord.create({
      data: {
        userId: request.user.id,
        treesCount: userTrees.length,
        estimatedKgCo2,
        notes: request.body.notes || "Calculo generado desde el dashboard"
      }
    });

    response.status(201).json({ record });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
