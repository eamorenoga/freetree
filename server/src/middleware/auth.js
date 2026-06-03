const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

async function requireAuth(request, response, next) {
  const authHeader = request.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return response.status(401).json({ message: "Token requerido" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "development-secret");
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, name: true, username: true, email: true, role: true, createdAt: true }
    });

    if (!user) {
      return response.status(401).json({ message: "Usuario no encontrado" });
    }

    request.user = user;
    next();
  } catch (_error) {
    response.status(401).json({ message: "Token invalido o expirado" });
  }
}

function requireRole(role) {
  return (request, response, next) => {
    const allowedRoles = Array.isArray(role) ? role : [role];

    if (!allowedRoles.includes(request.user?.role)) {
      return response.status(403).json({ message: "No tienes permisos para esta accion" });
    }

    next();
  };
}

module.exports = { requireAuth, requireRole };
