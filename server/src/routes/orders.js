const express = require("express");
const prisma = require("../lib/prisma");
const { mapTreePurchase } = require("../lib/mappers");
const { createQrCode, getQrImageUrl } = require("../lib/qr");
const { requireAuth } = require("../middleware/auth");
const { getPaymentGateway } = require("../services/payments");

const router = express.Router();

router.post("/", requireAuth, async (request, response, next) => {
  try {
    const { items, paymentStatus } = request.body;

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

    const paymentGateway = getPaymentGateway();
    const paymentResult = await paymentGateway.createPayment({
      amount: total,
      requestedStatus: paymentStatus
    });

    if (paymentResult.status !== "APPROVED") {
      return response.status(202).json({
        message: paymentResult.status === "PENDING" ? "Pago pendiente de aprobacion" : "Pago rechazado",
        payment: paymentResult,
        purchases: []
      });
    }

    const purchases = await prisma.$transaction(async (transaction) => {
      const createdPurchases = [];
      let purchaseSequence = 0;

      for (const item of requestedItems) {
        const tree = trees.find((candidate) => candidate.id === item.treeId);
        await transaction.treeProduct.update({
          where: { id: item.treeId },
          data: { stock: tree.stock - item.quantity }
        });

        for (let index = 0; index < item.quantity; index += 1) {
          purchaseSequence += 1;
          const purchaseLocation = tree.estimatedLocation || "Pendiente de asignacion por TerraBioCol";
          const qrCode = createQrCode();

          const purchase = await transaction.treePurchase.create({
            data: {
              userId: request.user.id,
              treeProductId: item.treeId,
              quantity: 1,
              unitPrice: tree.price,
              total: tree.price,
              location: purchaseLocation,
              payment: {
                create: {
                  provider: paymentResult.provider,
                  reference: `${paymentResult.reference}-${purchaseSequence}`,
                  amount: tree.price,
                  currency: paymentResult.currency,
                  status: paymentResult.status,
                  paidAt: paymentResult.paidAt
                }
              },
              qrCode: {
                create: {
                  treeProductId: item.treeId,
                  code: qrCode,
                  imageUrl: getQrImageUrl(qrCode)
                }
              },
              trackingEvents: {
                create: {
                  description: "Compra aprobada. Arbol asignado y pendiente de siembra por TerraBioCol.",
                  location: purchaseLocation,
                  status: "PURCHASED"
                }
              },
              carbonFootprint: {
                create: {
                  userId: request.user.id,
                  estimatedKgCo2: tree.estimatedKgCo2PerYear,
                  accumulatedKgCo2: 0,
                  notes: "Registro inicial generado automaticamente al aprobar la compra."
                }
              }
            },
            include: {
              treeProduct: true,
              payment: true,
              qrCode: true,
              carbonFootprint: true,
              trackingEvents: { include: { photos: true }, orderBy: { eventDate: "desc" } }
            }
          });
          createdPurchases.push(purchase);
        }
      }

      return createdPurchases;
    });

    response.status(201).json({
      order: { total, payment: paymentResult, purchases: purchases.map(mapTreePurchase) },
      payment: paymentResult,
      purchases: purchases.map(mapTreePurchase)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
