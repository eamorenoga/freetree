const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const express = require("express");
const prisma = require("../lib/prisma");
const { signUserToken } = require("../lib/tokens");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernamePattern = /^[a-zA-Z0-9._-]{3,30}$/;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase();
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
}

function validatePassword(password) {
  if (!password || password.length < 8) {
    return "La contrasena debe tener al menos 8 caracteres";
  }

  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "La contrasena debe incluir letras y numeros";
  }

  return "";
}

function validateRegisterFields({ name, username, email, password }) {
  if (!name?.trim()) return "El nombre es requerido";
  if (!usernamePattern.test(username)) return "El usuario debe tener 3 a 30 caracteres y solo letras, numeros, punto, guion o guion bajo";
  if (!emailPattern.test(email)) return "El correo no tiene un formato valido";

  return validatePassword(password);
}

async function findUserByIdentifier(identifier) {
  const normalizedIdentifier = String(identifier || "").trim().toLowerCase();

  if (!normalizedIdentifier) return null;

  return prisma.user.findFirst({
    where: {
      OR: [
        { email: normalizedIdentifier },
        { username: normalizedIdentifier }
      ]
    }
  });
}

router.post("/register", async (request, response, next) => {
  try {
    const name = String(request.body.name || "").trim();
    const username = normalizeUsername(request.body.username);
    const email = normalizeEmail(request.body.email);
    const password = String(request.body.password || "");
    const validationError = validateRegisterFields({ name, username, email, password });

    if (validationError) {
      return response.status(400).json({ message: validationError });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });
    if (existingUser?.email === email) {
      return response.status(409).json({ message: "El correo ya esta registrado" });
    }
    if (existingUser?.username === username) {
      return response.status(409).json({ message: "El usuario ya esta registrado" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, username, email, passwordHash, role: "CLIENTE" }
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
    const identifier = String(request.body.identifier || request.body.email || "").trim();
    const password = String(request.body.password || "");

    if (!identifier || !password) {
      return response.status(400).json({ message: "Usuario/correo y contrasena son requeridos" });
    }

    const user = await findUserByIdentifier(identifier);
    const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;

    if (!user || !passwordMatches) {
      return response.status(401).json({ message: "Usuario/correo o contrasena invalidos" });
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

router.put("/profile", requireAuth, async (request, response, next) => {
  try {
    const name = String(request.body.name || "").trim();
    const username = normalizeUsername(request.body.username);

    if (!name) {
      return response.status(400).json({ message: "El nombre es requerido" });
    }

    if (!usernamePattern.test(username)) {
      return response.status(400).json({ message: "El usuario debe tener 3 a 30 caracteres validos" });
    }

    const existingUser = await prisma.user.findFirst({
      where: { username, NOT: { id: request.user.id } }
    });
    if (existingUser) {
      return response.status(409).json({ message: "El usuario ya esta registrado" });
    }

    const user = await prisma.user.update({
      where: { id: request.user.id },
      data: { name, username },
      select: { id: true, name: true, username: true, email: true, role: true, createdAt: true }
    });

    response.json({ user });
  } catch (error) {
    next(error);
  }
});

router.post("/forgot-password", async (request, response, next) => {
  try {
    const identifier = String(request.body.identifier || "").trim();

    if (!identifier) {
      return response.status(400).json({ message: "Ingresa tu usuario o correo" });
    }

    const user = await findUserByIdentifier(identifier);
    const genericMessage = "Si la cuenta existe, se genero un enlace de recuperacion simulado";

    if (!user) {
      return response.json({ message: genericMessage });
    }

    const resetToken = crypto.randomBytes(24).toString("hex");
    const passwordResetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetTokenHash, passwordResetExpiresAt }
    });

    console.log(`Recuperacion simulada para ${user.email}: token=${resetToken}`);

    response.json({
      message: genericMessage,
      resetToken,
      simulatedEmail: `Para desarrollo: usa este token para restablecer la contrasena de ${user.email}.`
    });
  } catch (error) {
    next(error);
  }
});

router.post("/reset-password", async (request, response, next) => {
  try {
    const token = String(request.body.token || "").trim();
    const password = String(request.body.password || "");
    const passwordError = validatePassword(password);

    if (!token) {
      return response.status(400).json({ message: "El token de recuperacion es requerido" });
    }

    if (passwordError) {
      return response.status(400).json({ message: passwordError });
    }

    const passwordResetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await prisma.user.findFirst({
      where: {
        passwordResetTokenHash,
        passwordResetExpiresAt: { gt: new Date() }
      }
    });

    if (!user) {
      return response.status(400).json({ message: "Token invalido o expirado" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(password, 12),
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null
      }
    });

    response.json({ message: "Contrasena actualizada correctamente" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
