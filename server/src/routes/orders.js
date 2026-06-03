const express = require("express");
const prisma = require("../lib/prisma");
const { mapTreePurchase } = require("../lib/mappers");
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
    const trees = await prisma.treeProduct.findMany({
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

    const purchases = await prisma.$transaction(async (transaction) => {
      const createdPurchases = [];
      for (const item of requestedItems) {
        const tree = trees.find((candidate) => candidate.id === item.treeId);
        await transaction.treeProduct.update({
          where: { id: item.treeId },
          data: { stock: tree.stock - item.quantity }
        });

        for (let index = 0; index < item.quantity; index += 1) {
          const purchase = await transaction.treePurchase.create({
            data: {
              userId: request.user.id,
              treeProductId: item.treeId,
              quantity: 1,
              unitPrice: tree.price,
              total: tree.price,
              location: "Pendiente de asignacion por TerraBioCol",
              payment: {
                create: {
                  reference: `PAY-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
                  amount: tree.price,
                  status: "APPROVED",
                  paidAt: new Date()
                }
              },
              qrCode: {
                create: {
                  code: `TBC-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 10)}`
                }
              }
            },
            include: { treeProduct: true, payment: true, qrCode: true, trackingEvents: true }
          });
          createdPurchases.push(purchase);
        }
      }

      return createdPurchases;
    });

    response.status(201).json({
      order: { total, purchases: purchases.map(mapTreePurchase) },
      purchases: purchases.map(mapTreePurchase)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
