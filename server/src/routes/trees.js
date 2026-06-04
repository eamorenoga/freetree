const express = require("express");
const prisma = require("../lib/prisma");
const { mapTreeProduct } = require("../lib/mappers");

const router = express.Router();

router.get("/", async (_request, response, next) => {
  try {
    const trees = await prisma.treeProduct.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" }
    });

    response.json({ trees: trees.map(mapTreeProduct) });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (request, response, next) => {
  try {
    const tree = await prisma.treeProduct.findFirst({
      where: { id: request.params.id, isActive: true }
    });

    if (!tree) {
      return response.status(404).json({ message: "Arbol no encontrado" });
    }

    response.json({ tree: mapTreeProduct(tree) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
