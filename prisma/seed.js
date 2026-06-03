const bcrypt = require("bcryptjs");
const { PrismaClient, Role, UserTreeStatus } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Terrabio123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@terrabiocol.com" },
    update: {},
    create: {
      name: "Administracion TerraBioCol",
      email: "admin@terrabiocol.com",
      passwordHash,
      role: Role.ADMIN
    }
  });

  const cliente = await prisma.user.upsert({
    where: { email: "cliente@terrabiocol.com" },
    update: {},
    create: {
      name: "Cliente Demo",
      email: "cliente@terrabiocol.com",
      passwordHash,
      role: Role.CLIENTE
    }
  });

  const trees = await Promise.all([
    prisma.tree.upsert({
      where: { id: "seed-guayacan" },
      update: {},
      create: {
        id: "seed-guayacan",
        species: "Guayacan amarillo",
        description: "Arbol nativo ornamental que apoya polinizadores y mejora corredores verdes urbanos.",
        price: 69000,
        imageUrl: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1200&q=80",
        estimatedCo2: 120,
        stock: 45
      }
    }),
    prisma.tree.upsert({
      where: { id: "seed-cedro" },
      update: {},
      create: {
        id: "seed-cedro",
        species: "Cedro rosado",
        description: "Especie de alto valor ecologico para restauracion y captura de carbono a largo plazo.",
        price: 89000,
        imageUrl: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80",
        estimatedCo2: 180,
        stock: 30
      }
    }),
    prisma.tree.upsert({
      where: { id: "seed-yarumo" },
      update: {},
      create: {
        id: "seed-yarumo",
        species: "Yarumo",
        description: "Arbol pionero ideal para recuperacion de suelos y refugio de fauna local.",
        price: 54000,
        imageUrl: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80",
        estimatedCo2: 95,
        stock: 60
      }
    })
  ]);

  const assignedTree = await prisma.userTree.upsert({
    where: { id: "seed-user-tree" },
    update: {},
    create: {
      id: "seed-user-tree",
      userId: cliente.id,
      treeId: trees[0].id,
      location: "Reserva La Esperanza, Cundinamarca",
      plantedAt: new Date("2026-05-12"),
      status: UserTreeStatus.EN_CRECIMIENTO
    }
  });

  await prisma.trackingEvent.upsert({
    where: { id: "seed-tracking-event" },
    update: {},
    create: {
      id: "seed-tracking-event",
      userTreeId: assignedTree.id,
      title: "Primer control de crecimiento",
      description: "El arbol presenta buen follaje y humedad estable en el suelo.",
      eventDate: new Date("2026-06-01")
    }
  });

  await prisma.carbonRecord.upsert({
    where: { id: "seed-carbon-record" },
    update: {},
    create: {
      id: "seed-carbon-record",
      userId: cliente.id,
      treesCount: 1,
      estimatedKgCo2: trees[0].estimatedCo2,
      notes: "Estimacion inicial segun especie adquirida."
    }
  });

  console.log(`Seed listo para ${admin.email} y ${cliente.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
