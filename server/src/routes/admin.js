const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/dashboard", async (_request, response, next) => {
  try {
    const [usersCount, treesCount, ordersCount, userTreesCount, revenue] = await Promise.all([
      prisma.user.count(),
      prisma.treeProduct.count(),
      prisma.payment.count(),
      prisma.treePurchase.count(),
      prisma.payment.aggregate({ where: { status: "APPROVED" }, _sum: { amount: true } })
    ]);

    const recentOrders = await prisma.treePurchase.findMany({
      take: 6,
      include: { user: true, treeProduct: true, payment: true, qrCode: true },
      orderBy: { createdAt: "desc" }
    });

    response.json({
      stats: {
        usersCount,
        treesCount,
        ordersCount,
        userTreesCount,
        revenue: Number(revenue._sum.amount || 0)
      },
      recentOrders
    });
  } catch (error) {
    next(error);
  }
});

router.get("/trees", async (_request, response, next) => {
  try {
    const trees = await prisma.treeProduct.findMany({ orderBy: { createdAt: "desc" } });
    response.json({ trees });
  } catch (error) {
    next(error);
  }
});

router.post("/trees", async (request, response, next) => {
  try {
    const { name, species, description, price, imageUrl, estimatedCo2, estimatedKgCo2PerYear, stock, isActive = true } = request.body;

    if (!species || !description || !price || !imageUrl) {
      return response.status(400).json({ message: "Especie, descripcion, precio e imagen son requeridos" });
    }

    const tree = await prisma.treeProduct.create({
      data: {
        name: name || species,
        species,
        description,
        price,
        imageUrl,
        estimatedKgCo2PerYear: Number(estimatedKgCo2PerYear || estimatedCo2) || 0,
        stock: Number(stock) || 0,
        isActive
      }
    });

    response.status(201).json({ tree });
  } catch (error) {
    next(error);
  }
});

router.put("/trees/:id", async (request, response, next) => {
  try {
    const { name, species, description, price, imageUrl, estimatedCo2, estimatedKgCo2PerYear, stock, isActive } = request.body;
    const tree = await prisma.treeProduct.update({
      where: { id: request.params.id },
      data: {
        name,
        species,
        description,
        price,
        imageUrl,
        estimatedKgCo2PerYear: Number(estimatedKgCo2PerYear || estimatedCo2),
        stock: Number(stock),
        isActive
      }
    });

    response.json({ tree });
  } catch (error) {
    next(error);
  }
});

router.delete("/trees/:id", async (request, response, next) => {
  try {
    await prisma.treeProduct.update({
      where: { id: request.params.id },
      data: { isActive: false }
    });

    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post("/tracking/:id/photos", async (request, response, next) => {
  try {
    const { imageUrl, caption, fileName, notes } = request.body;

    if (!imageUrl) {
      return response.status(400).json({ message: "La URL de la foto es requerida" });
    }

    const photo = await prisma.treePhoto.create({
      data: {
        treeTrackingId: request.params.id,
        imageUrl,
        caption,
        uploadedById: request.user.id
      }
    });

    const uploadLog = await prisma.adminUploadLog.create({
      data: {
        adminId: request.user.id,
        fileName: fileName || imageUrl.split("/").pop() || "tree-progress-photo",
        fileUrl: imageUrl,
        entityType: "TreePhoto",
        entityId: photo.id,
        notes
      }
    });

    response.status(201).json({ photo, uploadLog });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
