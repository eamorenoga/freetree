const bcrypt = require("bcryptjs");
const express = require("express");
const prisma = require("../lib/prisma");
const { signUserToken } = require("../lib/tokens");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
}

router.post("/register", async (request, response, next) => {
  try {
    const { name, email, password } = request.body;

    if (!name || !email || !password) {
      return response.status(400).json({ message: "Nombre, email y contrasena son requeridos" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return response.status(409).json({ message: "El email ya esta registrado" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: "CLIENTE" }
    });

    response.status(201).json({
      token: signUserToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (request, response, next) => {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return response.status(400).json({ message: "Email y contrasena son requeridos" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;

    if (!user || !passwordMatches) {
      return response.status(401).json({ message: "Credenciales invalidas" });
    }

    response.json({
      token: signUserToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, (request, response) => {
  response.json({ user: request.user });
});

module.exports = router;
