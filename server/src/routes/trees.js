const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

router.get("/", async (_request, response, next) => {
  try {
    const trees = await prisma.tree.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" }
    });

    response.json({ trees });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
