const express = require("express");
const prisma = require("../lib/prisma");
const { mapCarbonFootprint } = require("../lib/mappers");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (request, response, next) => {
  try {
    const purchases = await prisma.treePurchase.findMany({
      where: { userId: request.user.id },
      include: { treeProduct: true }
    });
    const records = await prisma.carbonFootprint.findMany({
      where: { userId: request.user.id },
      orderBy: { calculationDate: "desc" }
    });
    const estimatedKgCo2 = purchases.reduce((sum, purchase) => sum + purchase.treeProduct.estimatedKgCo2PerYear, 0);

    response.json({
      summary: {
        treesCount: purchases.length,
        estimatedKgCo2
      },
      records: records.map(mapCarbonFootprint)
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (request, response, next) => {
  try {
    const purchases = await prisma.treePurchase.findMany({
      where: { userId: request.user.id },
      include: { treeProduct: true }
    });
    const estimatedKgCo2 = purchases.reduce((sum, purchase) => sum + purchase.treeProduct.estimatedKgCo2PerYear, 0);

    const record = await prisma.carbonFootprint.create({
      data: {
        userId: request.user.id,
        estimatedKgCo2,
        accumulatedKgCo2: estimatedKgCo2,
        notes: request.body.notes || "Calculo generado desde el dashboard"
      }
    });

    response.status(201).json({ record: mapCarbonFootprint(record) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
