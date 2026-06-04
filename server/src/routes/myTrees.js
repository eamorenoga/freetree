const express = require("express");
const prisma = require("../lib/prisma");
const { mapTreePurchase } = require("../lib/mappers");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (request, response, next) => {
  try {
    const purchases = await prisma.treePurchase.findMany({
      where: { userId: request.user.id },
      include: {
        treeProduct: true,
        payment: true,
        qrCode: true,
        carbonFootprint: true,
        trackingEvents: { include: { photos: true }, orderBy: { eventDate: "desc" } }
      },
      orderBy: { createdAt: "desc" }
    });

    response.json({ userTrees: purchases.map(mapTreePurchase), purchases: purchases.map(mapTreePurchase) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
