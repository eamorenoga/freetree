const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (request, response, next) => {
  try {
    const events = await prisma.trackingEvent.findMany({
      where: { userTree: { userId: request.user.id } },
      include: { userTree: { include: { tree: true } } },
      orderBy: { eventDate: "desc" }
    });

    response.json({ events });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (request, response, next) => {
  try {
    const { userTreeId, title, description, imageUrl } = request.body;

    if (!userTreeId || !title || !description) {
      return response.status(400).json({ message: "Arbol, titulo y descripcion son requeridos" });
    }

    const userTree = await prisma.userTree.findFirst({
      where: { id: userTreeId, userId: request.user.id }
    });

    if (!userTree) {
      return response.status(404).json({ message: "Arbol no encontrado para este usuario" });
    }

    const event = await prisma.trackingEvent.create({
      data: { userTreeId, title, description, imageUrl }
    });

    response.status(201).json({ event });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
