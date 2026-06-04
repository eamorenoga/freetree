const express = require("express");
const prisma = require("../lib/prisma");
const { calculateTreeCarbonImpact, summarizeCarbonImpact } = require("../lib/carbonAnalysis");
const { mapCarbonFootprint } = require("../lib/mappers");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (request, response, next) => {
  try {
    const purchases = await prisma.treePurchase.findMany({
      where: { userId: request.user.id },
      include: {
        treeProduct: true,
        trackingEvents: { orderBy: { eventDate: "desc" } }
      }
    });
    const records = await prisma.carbonFootprint.findMany({
      where: { userId: request.user.id },
      orderBy: { calculationDate: "desc" }
    });
    const treeImpacts = purchases.map(calculateTreeCarbonImpact);
    const summary = summarizeCarbonImpact(treeImpacts);

    response.json({
      summary: {
        treesCount: summary.activeTreesCount,
        activeTreesCount: summary.activeTreesCount,
        estimatedKgCo2: summary.totalAccumulatedKgCo2,
        monthlyKgCo2: summary.totalMonthlyKgCo2,
        annualKgCo2: summary.totalAnnualKgCo2,
        accumulatedKgCo2: summary.totalAccumulatedKgCo2,
        equivalences: summary.equivalences,
        disclaimer: summary.disclaimer
      },
      trees: treeImpacts,
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
      include: {
        treeProduct: true,
        trackingEvents: { orderBy: { eventDate: "desc" } }
      }
    });
    const summary = summarizeCarbonImpact(purchases.map(calculateTreeCarbonImpact));

    const record = await prisma.carbonFootprint.create({
      data: {
        userId: request.user.id,
        estimatedKgCo2: summary.totalAnnualKgCo2,
        accumulatedKgCo2: summary.totalAccumulatedKgCo2,
        notes: request.body.notes || "Calculo generado desde el dashboard"
      }
    });

    response.status(201).json({ record: mapCarbonFootprint(record) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
