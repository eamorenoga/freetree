const bcrypt = require("bcryptjs");
require("../server/src/config/env").requireEnvironment();
const { PrismaClient, PaymentStatus, TreeStatus, UserRole } = require("@prisma/client");
const { getQrImageUrl } = require("../server/src/lib/qr");

const prisma = new PrismaClient();

async function upsertProduct(product) {
  const { id, ...data } = product;

  return prisma.treeProduct.upsert({
    where: { id },
    update: data,
    create: product
  });
}

async function main() {
  const passwordHash = await bcrypt.hash("Terrabio123!", 10);

  await Promise.all([
    prisma.role.upsert({
      where: { name: UserRole.CLIENTE },
      update: { description: "Usuario comprador de arboles y consultor de seguimiento ambiental." },
      create: {
        name: UserRole.CLIENTE,
        description: "Usuario comprador de arboles y consultor de seguimiento ambiental."
      }
    }),
    prisma.role.upsert({
      where: { name: UserRole.ADMIN },
      update: { description: "Administrador con permisos para catalogo, fotos y seguimiento." },
      create: {
        name: UserRole.ADMIN,
        description: "Administrador con permisos para catalogo, fotos y seguimiento."
      }
    })
  ]);

  const admin = await prisma.user.upsert({
    where: { email: "admin@terrabiocol.com" },
    update: { username: "admin", passwordHash, role: UserRole.ADMIN },
    create: {
      name: "Administracion TerraBioCol",
      username: "admin",
      email: "admin@terrabiocol.com",
      passwordHash,
      role: UserRole.ADMIN
    }
  });

  const cliente = await prisma.user.upsert({
    where: { email: "cliente@terrabiocol.com" },
    update: { username: "cliente", passwordHash, role: UserRole.CLIENTE },
    create: {
      name: "Cliente Demo",
      username: "cliente",
      email: "cliente@terrabiocol.com",
      passwordHash,
      role: UserRole.CLIENTE
    }
  });

  const products = await Promise.all([
    upsertProduct({
      id: "product-guayacan",
      name: "Guayacan amarillo restaurador",
      species: "Guayacan amarillo",
      description: "Arbol nativo ornamental que apoya polinizadores y mejora corredores verdes urbanos.",
      price: 69000,
      imageUrl: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1200&q=80",
      estimatedLocation: "Corredores verdes urbanos, Cundinamarca",
      estimatedKgCo2PerYear: 120,
      co2FactorPerMonth: 10,
      stock: 45,
      isActive: true
    }),
    upsertProduct({
      id: "product-cedro",
      name: "Cedro rosado de restauracion",
      species: "Cedro rosado",
      description: "Especie de alto valor ecologico para restauracion y captura de carbono a largo plazo.",
      price: 89000,
      imageUrl: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80",
      estimatedLocation: "Reserva La Esperanza, Cundinamarca",
      estimatedKgCo2PerYear: 180,
      co2FactorPerMonth: 15,
      stock: 30,
      isActive: true
    }),
    upsertProduct({
      id: "product-yarumo",
      name: "Yarumo pionero",
      species: "Yarumo",
      description: "Arbol pionero ideal para recuperacion de suelos y refugio de fauna local.",
      price: 54000,
      imageUrl: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80",
      estimatedLocation: "Zonas de recuperacion de suelos, Antioquia",
      estimatedKgCo2PerYear: 95,
      co2FactorPerMonth: 7.9,
      stock: 60,
      isActive: true
    })
  ]);

  const purchase = await prisma.treePurchase.upsert({
    where: { id: "purchase-demo-guayacan" },
    update: {},
    create: {
      id: "purchase-demo-guayacan",
      userId: cliente.id,
      treeProductId: products[0].id,
      quantity: 1,
      unitPrice: products[0].price,
      total: products[0].price,
      status: TreeStatus.GROWING,
      plantedAt: new Date("2026-05-12"),
      location: "Reserva La Esperanza, Cundinamarca"
    }
  });

  await prisma.payment.upsert({
    where: { reference: "PAY-DEMO-0001" },
    update: {},
    create: {
      treePurchaseId: purchase.id,
      provider: "SIMULATED",
      reference: "PAY-DEMO-0001",
      amount: purchase.total,
      status: PaymentStatus.APPROVED,
      paidAt: new Date("2026-05-10")
    }
  });

  await prisma.qRCode.upsert({
    where: { code: "TBC-QR-DEMO-GUAYACAN-0001" },
    update: {},
    create: {
      treePurchaseId: purchase.id,
      treeProductId: products[0].id,
      code: "TBC-QR-DEMO-GUAYACAN-0001",
      imageUrl: getQrImageUrl("TBC-QR-DEMO-GUAYACAN-0001")
    }
  });

  const tracking = await prisma.treeTracking.upsert({
    where: { id: "tracking-demo-guayacan-001" },
    update: {},
    create: {
      id: "tracking-demo-guayacan-001",
      treePurchaseId: purchase.id,
      eventDate: new Date("2026-06-01"),
      description: "Primer control de crecimiento: buen follaje y humedad estable en el suelo.",
      location: "Reserva La Esperanza, lote 4",
      status: TreeStatus.GROWING
    }
  });

  await prisma.treePhoto.upsert({
    where: { id: "photo-demo-guayacan-001" },
    update: {},
    create: {
      id: "photo-demo-guayacan-001",
      treeTrackingId: tracking.id,
      imageUrl: "https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?auto=format&fit=crop&w=1200&q=80",
      caption: "Seguimiento inicial del Guayacan amarillo",
      uploadedById: admin.id
    }
  });

  await prisma.carbonFootprint.upsert({
    where: { treePurchaseId: purchase.id },
    update: {
      estimatedKgCo2: products[0].estimatedKgCo2PerYear,
      accumulatedKgCo2: products[0].estimatedKgCo2PerYear
    },
    create: {
      userId: cliente.id,
      treePurchaseId: purchase.id,
      estimatedKgCo2: products[0].estimatedKgCo2PerYear,
      accumulatedKgCo2: products[0].estimatedKgCo2PerYear,
      notes: "Huella inicial por arbol comprado."
    }
  });

  await prisma.adminUploadLog.upsert({
    where: { id: "upload-log-demo-001" },
    update: {},
    create: {
      id: "upload-log-demo-001",
      adminId: admin.id,
      fileName: "guayacan-seguimiento-001.jpg",
      fileUrl: "https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?auto=format&fit=crop&w=1200&q=80",
      entityType: "TreePhoto",
      entityId: "photo-demo-guayacan-001",
      notes: "Carga inicial de prueba para seguimiento del arbol."
    }
  });

  console.log(`Seed listo: ${admin.email}, ${cliente.email}, ${products.length} productos y 1 compra con QR.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
