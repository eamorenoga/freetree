const express = require("express");
const prisma = require("../lib/prisma");
const { mapTreeTracking } = require("../lib/mappers");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (request, response, next) => {
  try {
    const events = await prisma.treeTracking.findMany({
      where: { treePurchase: { userId: request.user.id } },
      include: { photos: true, treePurchase: { include: { treeProduct: true, payment: true, qrCode: true } } },
      orderBy: { eventDate: "desc" }
    });

    response.json({ events: events.map(mapTreeTracking) });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (request, response, next) => {
  try {
    const { userTreeId, title, description, imageUrl, location, status = "GROWING" } = request.body;

    if (!userTreeId || !title || !description) {
      return response.status(400).json({ message: "Arbol, titulo y descripcion son requeridos" });
    }

    const userTree = await prisma.treePurchase.findFirst({
      where: { id: userTreeId, userId: request.user.id }
    });

    if (!userTree) {
      return response.status(404).json({ message: "Arbol no encontrado para este usuario" });
    }

    const event = await prisma.treeTracking.create({
      data: {
        treePurchaseId: userTreeId,
        description: title ? `${title}: ${description}` : description,
        location,
        status,
        photos: imageUrl ? { create: { imageUrl, caption: title } } : undefined
      },
      include: { photos: true, treePurchase: { include: { treeProduct: true, payment: true, qrCode: true } } }
    });

    response.status(201).json({ event: mapTreeTracking(event) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
