const express = require("express");
const prisma = require("../lib/prisma");
const { getPublicTreeUrl } = require("../lib/qr");
const { mapTreeProduct, mapTreeTracking } = require("../lib/mappers");

const router = express.Router();

function mapPublicOwner(user) {
  if (!user) {
    return null;
  }

  return {
    name: user.name,
    username: user.username
  };
}

router.get("/public/:qrCode", async (request, response, next) => {
  try {
    const qrCode = await prisma.qRCode.findUnique({
      where: { code: request.params.qrCode },
      include: {
        treeProduct: true,
        treePurchase: {
          include: {
            user: true,
            treeProduct: true,
            carbonFootprint: true,
            trackingEvents: {
              include: { photos: true },
              orderBy: { eventDate: "desc" }
            }
          }
        }
      }
    });

    if (!qrCode) {
      return response.status(404).json({ message: "QR no encontrado" });
    }

    const purchase = qrCode.treePurchase;
    const tree = purchase?.treeProduct || qrCode.treeProduct;

    response.json({
      qr: {
        code: qrCode.code,
        imageUrl: qrCode.imageUrl,
        publicUrl: getPublicTreeUrl(qrCode.code),
        assigned: Boolean(purchase)
      },
      tree: tree ? mapTreeProduct(tree) : null,
      owner: mapPublicOwner(purchase?.user),
      ownerLabel: purchase?.user ? purchase.user.name : "No asignado",
      purchase: purchase
        ? {
            id: purchase.id,
            status: purchase.status,
            location: purchase.location,
            plantedAt: purchase.plantedAt,
            createdAt: purchase.createdAt
          }
        : null,
      co2: purchase?.carbonFootprint
        ? {
            estimatedKgCo2: purchase.carbonFootprint.estimatedKgCo2,
            accumulatedKgCo2: purchase.carbonFootprint.accumulatedKgCo2,
            calculationDate: purchase.carbonFootprint.calculationDate
          }
        : {
            estimatedKgCo2: tree?.estimatedKgCo2PerYear || 0,
            accumulatedKgCo2: 0,
            calculationDate: null
          },
      timeline: purchase?.trackingEvents ? purchase.trackingEvents.map(mapTreeTracking) : []
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
