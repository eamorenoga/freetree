const bcrypt = require("bcryptjs");
const express = require("express");
const prisma = require("../lib/prisma");
const { mapTreePurchase } = require("../lib/mappers");
const { createQrCode, getQrImageUrl } = require("../lib/qr");
const { signUserToken } = require("../lib/tokens");
const { requireAuth } = require("../middleware/auth");
const { getPaymentGateway } = require("../services/payments");

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePublicBuyer({ name, email, password }) {
  if (!String(name || "").trim()) return "El nombre es requerido";
  if (!emailPattern.test(String(email || "").trim().toLowerCase())) return "El correo no tiene un formato valido";
  if (!password || password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "La contrasena debe tener al menos 8 caracteres e incluir letras y numeros";
  }

  return "";
}

async function createUniqueUsername(email, transaction) {
  const baseUsername = String(email).split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 24) || "cliente";
  let username = baseUsername;
  let counter = 1;

  while (await transaction.user.findUnique({ where: { username } })) {
    username = `${baseUsername}${counter}`;
    counter += 1;
  }

  return username;
}

async function createApprovedTreeOrder({ userId, items, paymentStatus = "APPROVED" }) {
  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error("Debes enviar al menos un arbol");
    error.status = 400;
    throw error;
  }

  const requestedItems = items.map((item) => ({
    treeId: item.treeId,
    quantity: Math.max(Number(item.quantity) || 1, 1)
  }));
  const trees = await prisma.treeProduct.findMany({
    where: { id: { in: requestedItems.map((item) => item.treeId) }, isActive: true }
  });

  if (trees.length !== requestedItems.length) {
    const error = new Error("Uno o mas arboles no estan disponibles");
    error.status = 400;
    throw error;
  }

  for (const item of requestedItems) {
    const tree = trees.find((candidate) => candidate.id === item.treeId);
    if (!tree || tree.stock < item.quantity) {
      const error = new Error(`Stock insuficiente para ${tree?.species || "arbol"}`);
      error.status = 400;
      throw error;
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
    return {
      statusCode: 202,
      body: {
        message: paymentResult.status === "PENDING" ? "Pago pendiente de aprobacion" : "Pago rechazado",
        payment: paymentResult,
        purchases: []
      }
    };
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
            userId,
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
                userId,
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

  return {
    statusCode: 201,
    body: {
      order: { total, payment: paymentResult, purchases: purchases.map(mapTreePurchase) },
      payment: paymentResult,
      purchases: purchases.map(mapTreePurchase)
    }
  };
}

router.post("/", requireAuth, async (request, response, next) => {
  try {
    const { items, paymentStatus } = request.body;
    const orderResult = await createApprovedTreeOrder({ userId: request.user.id, items, paymentStatus });
    response.status(orderResult.statusCode).json(orderResult.body);
  } catch (error) {
    next(error);
  }
});

router.post("/public-checkout", async (request, response, next) => {
  try {
    const buyer = {
      name: String(request.body.name || "").trim(),
      email: String(request.body.email || "").trim().toLowerCase(),
      password: String(request.body.password || "")
    };
    const validationError = validatePublicBuyer(buyer);

    if (validationError) {
      return response.status(400).json({ message: validationError });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: buyer.email } });
    if (existingUser) {
      return response.status(409).json({ message: "Este correo ya esta registrado. Inicia sesion para comprar." });
    }

    const result = await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          name: buyer.name,
          username: await createUniqueUsername(buyer.email, transaction),
          email: buyer.email,
          passwordHash: await bcrypt.hash(buyer.password, 12),
          role: "CLIENTE"
        }
      });

      return user;
    });

    const orderResult = await createApprovedTreeOrder({
      userId: result.id,
      items: request.body.items,
      paymentStatus: request.body.paymentStatus || "APPROVED"
    });

    response.status(orderResult.statusCode).json({
      ...orderResult.body,
      token: signUserToken(result),
      user: {
        id: result.id,
        name: result.name,
        username: result.username,
        email: result.email,
        role: result.role,
        createdAt: result.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
