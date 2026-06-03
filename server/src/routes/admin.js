const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/dashboard", async (_request, response, next) => {
  try {
    const [usersCount, treesCount, ordersCount, userTreesCount, revenue] = await Promise.all([
      prisma.user.count(),
      prisma.tree.count(),
      prisma.order.count(),
      prisma.userTree.count(),
      prisma.order.aggregate({ _sum: { total: true } })
    ]);

    const recentOrders = await prisma.order.findMany({
      take: 6,
      include: { user: true, items: { include: { tree: true } } },
      orderBy: { createdAt: "desc" }
    });

    response.json({
      stats: {
        usersCount,
        treesCount,
        ordersCount,
        userTreesCount,
        revenue: Number(revenue._sum.total || 0)
      },
      recentOrders
    });
  } catch (error) {
    next(error);
  }
});

router.get("/trees", async (_request, response, next) => {
  try {
    const trees = await prisma.tree.findMany({ orderBy: { createdAt: "desc" } });
    response.json({ trees });
  } catch (error) {
    next(error);
  }
});

router.post("/trees", async (request, response, next) => {
  try {
    const { species, description, price, imageUrl, estimatedCo2, stock, isActive = true } = request.body;

    if (!species || !description || !price || !imageUrl) {
      return response.status(400).json({ message: "Especie, descripcion, precio e imagen son requeridos" });
    }

    const tree = await prisma.tree.create({
      data: {
        species,
        description,
        price,
        imageUrl,
        estimatedCo2: Number(estimatedCo2) || 0,
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
    const { species, description, price, imageUrl, estimatedCo2, stock, isActive } = request.body;
    const tree = await prisma.tree.update({
      where: { id: request.params.id },
      data: {
        species,
        description,
        price,
        imageUrl,
        estimatedCo2: Number(estimatedCo2),
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
    await prisma.tree.update({
      where: { id: request.params.id },
      data: { isActive: false }
    });

    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
