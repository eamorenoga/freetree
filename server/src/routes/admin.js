const express = require("express");
const prisma = require("../lib/prisma");
const { createQrCode, getPublicTreeUrl, getQrImageUrl } = require("../lib/qr");
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
    const {
      name,
      species,
      description,
      price,
      imageUrl,
      estimatedLocation,
      estimatedCo2,
      estimatedKgCo2PerYear,
      stock,
      isActive = true
    } = request.body;

    if (!species || !description || !price || !imageUrl || !estimatedLocation) {
      return response.status(400).json({ message: "Especie, descripcion, precio, imagen y ubicacion estimada son requeridos" });
    }

    const tree = await prisma.treeProduct.create({
      data: {
        name: name || species,
        species,
        description,
        price,
        imageUrl,
        estimatedLocation,
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
    const { name, species, description, price, imageUrl, estimatedLocation, estimatedCo2, estimatedKgCo2PerYear, stock, isActive } =
      request.body;
    const tree = await prisma.treeProduct.update({
      where: { id: request.params.id },
      data: {
        name,
        species,
        description,
        price,
        imageUrl,
        estimatedLocation,
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

router.post("/trees/:id/qr", async (request, response, next) => {
  try {
    const tree = await prisma.treeProduct.findUnique({ where: { id: request.params.id } });

    if (!tree) {
      return response.status(404).json({ message: "Arbol no encontrado" });
    }

    const code = createQrCode();
    const qrCode = await prisma.qRCode.create({
      data: {
        treeProductId: tree.id,
        code,
        imageUrl: getQrImageUrl(code)
      },
      include: { treeProduct: true }
    });

    response.status(201).json({
      qr: {
        ...qrCode,
        publicUrl: getPublicTreeUrl(qrCode.code)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/qr/:qrCode", async (request, response, next) => {
  try {
    const qrCode = await prisma.qRCode.findUnique({
      where: { code: request.params.qrCode },
      include: {
        treeProduct: true,
        treePurchase: {
          include: {
            user: { select: { id: true, name: true, username: true, role: true } },
            treeProduct: true,
            carbonFootprint: true,
            trackingEvents: { include: { photos: true }, orderBy: { eventDate: "desc" } }
          }
        }
      }
    });

    if (!qrCode) {
      return response.status(404).json({ message: "QR no encontrado" });
    }

    response.json({
      qr: {
        ...qrCode,
        publicUrl: getPublicTreeUrl(qrCode.code)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/qr/:qrCode/progress", async (request, response, next) => {
  try {
    const { title, description, imageUrl, caption, location, status = "GROWING", fileName, notes } = request.body;

    if (!title || !description) {
      return response.status(400).json({ message: "Titulo y descripcion son requeridos" });
    }

    const qrCode = await prisma.qRCode.findUnique({
      where: { code: request.params.qrCode },
      include: { treePurchase: true }
    });

    if (!qrCode) {
      return response.status(404).json({ message: "QR no encontrado" });
    }

    if (!qrCode.treePurchase) {
      return response.status(400).json({ message: "Este QR aun no esta asignado a una compra" });
    }

    const trackingEvent = await prisma.treeTracking.create({
      data: {
        treePurchaseId: qrCode.treePurchase.id,
        description: `${title}: ${description}`,
        location,
        status,
        photos: imageUrl ? { create: { imageUrl, caption: caption || title, uploadedById: request.user.id } } : undefined
      },
      include: { photos: true, treePurchase: { include: { treeProduct: true, payment: true, qrCode: true } } }
    });

    let uploadLog = null;
    if (imageUrl) {
      uploadLog = await prisma.adminUploadLog.create({
        data: {
          adminId: request.user.id,
          fileName: fileName || imageUrl.split("/").pop() || "tree-progress-photo",
          fileUrl: imageUrl,
          entityType: "TreeTracking",
          entityId: trackingEvent.id,
          notes
        }
      });
    }

    response.status(201).json({ event: trackingEvent, uploadLog });
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
