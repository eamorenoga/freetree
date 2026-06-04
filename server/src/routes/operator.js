const express = require("express");
const prisma = require("../lib/prisma");
const { mapTreeTracking } = require("../lib/mappers");
const { parsePhotoData } = require("../lib/photoStorage");
const { mapQrCode } = require("../lib/qr");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireRole(["ADMIN", "OPERARIO"]));

function mapOperatorQr(qrCode) {
  const treePurchase = qrCode.treePurchase
    ? {
        id: qrCode.treePurchase.id,
        status: qrCode.treePurchase.status,
        location: qrCode.treePurchase.location,
        createdAt: qrCode.treePurchase.createdAt,
        user: qrCode.treePurchase.user,
        treeProduct: qrCode.treePurchase.treeProduct,
        trackingEvents: qrCode.treePurchase.trackingEvents?.map(mapTreeTracking) || []
      }
    : null;

  return {
    ...mapQrCode(qrCode),
    treePurchase,
    treeProduct: qrCode.treeProduct
  };
}

function buildPhotoCreateData({ imageUrl, photoData, photoMimeType, fileName, caption, title, userId }) {
  const parsedPhoto = parsePhotoData(photoData);

  if (!imageUrl && !parsedPhoto) {
    return undefined;
  }

  return {
    imageUrl: imageUrl || undefined,
    imageData: parsedPhoto?.buffer,
    mimeType: photoMimeType || parsedPhoto?.mimeType,
    fileName,
    caption: caption || title,
    uploadedById: userId
  };
}

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
            trackingEvents: { include: { photos: true }, orderBy: { eventDate: "desc" } }
          }
        }
      }
    });

    if (!qrCode) {
      return response.status(404).json({ message: "QR no encontrado" });
    }

    response.json({ qr: mapOperatorQr(qrCode) });
  } catch (error) {
    next(error);
  }
});

router.post("/qr/:qrCode/progress", async (request, response, next) => {
  try {
    const {
      title,
      description,
      imageUrl,
      photoData,
      photoMimeType,
      caption,
      location,
      status = "GROWING",
      fileName
    } = request.body;

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

    const photoCreateData = buildPhotoCreateData({
      imageUrl,
      photoData,
      photoMimeType,
      fileName,
      caption,
      title,
      userId: request.user.id
    });

    const trackingEvent = await prisma.treeTracking.create({
      data: {
        treePurchaseId: qrCode.treePurchase.id,
        description: `${title}: ${description}`,
        location,
        status,
        photos: photoCreateData ? { create: photoCreateData } : undefined
      },
      include: { photos: true, treePurchase: { include: { treeProduct: true, payment: true, qrCode: true } } }
    });

    if (imageUrl || photoData) {
      await prisma.adminUploadLog.create({
        data: {
          adminId: request.user.id,
          fileName: fileName || imageUrl?.split("/").pop() || "tree-progress-photo",
          fileUrl: imageUrl || `/api/photos/${trackingEvent.photos[0]?.id}`,
          entityType: "TreeTracking",
          entityId: trackingEvent.id,
          notes: "Carga de foto realizada por operario de campo."
        }
      });
    }

    response.status(201).json({ event: mapTreeTracking(trackingEvent) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
