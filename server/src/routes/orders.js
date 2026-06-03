const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/", requireAuth, async (request, response, next) => {
  try {
    const { items } = request.body;

    if (!Array.isArray(items) || items.length === 0) {
      return response.status(400).json({ message: "Debes enviar al menos un arbol" });
    }

    const requestedItems = items.map((item) => ({
      treeId: item.treeId,
      quantity: Math.max(Number(item.quantity) || 1, 1)
    }));
    const trees = await prisma.tree.findMany({
      where: { id: { in: requestedItems.map((item) => item.treeId) }, isActive: true }
    });

    if (trees.length !== requestedItems.length) {
      return response.status(400).json({ message: "Uno o mas arboles no estan disponibles" });
    }

    for (const item of requestedItems) {
      const tree = trees.find((candidate) => candidate.id === item.treeId);
      if (!tree || tree.stock < item.quantity) {
        return response.status(400).json({ message: `Stock insuficiente para ${tree?.species || "arbol"}` });
      }
    }

    const total = requestedItems.reduce((sum, item) => {
      const tree = trees.find((candidate) => candidate.id === item.treeId);
      return sum + Number(tree.price) * item.quantity;
    }, 0);

    const order = await prisma.$transaction(async (transaction) => {
      const createdOrder = await transaction.order.create({
        data: {
          userId: request.user.id,
          total,
          items: {
            create: requestedItems.map((item) => {
              const tree = trees.find((candidate) => candidate.id === item.treeId);
              return {
                treeId: item.treeId,
                quantity: item.quantity,
                unitPrice: tree.price
              };
            })
          }
        },
        include: { items: { include: { tree: true } } }
      });

      for (const item of requestedItems) {
        const tree = trees.find((candidate) => candidate.id === item.treeId);
        await transaction.tree.update({
          where: { id: item.treeId },
          data: { stock: tree.stock - item.quantity }
        });

        for (let index = 0; index < item.quantity; index += 1) {
          await transaction.userTree.create({
            data: {
              userId: request.user.id,
              treeId: item.treeId,
              location: "Pendiente de asignacion por TerraBioCol"
            }
          });
        }
      }

      return createdOrder;
    });

    response.status(201).json({ order });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
