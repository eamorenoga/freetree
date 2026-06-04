const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

router.get("/:id", async (request, response, next) => {
  try {
    const photo = await prisma.treePhoto.findUnique({ where: { id: request.params.id } });

    if (!photo) {
      return response.status(404).json({ message: "Foto no encontrada" });
    }

    if (photo.imageData) {
      response.setHeader("Content-Type", photo.mimeType || "image/jpeg");
      response.setHeader("Cache-Control", "public, max-age=86400");
      return response.send(Buffer.from(photo.imageData));
    }

    if (photo.imageUrl) {
      return response.redirect(photo.imageUrl);
    }

    response.status(404).json({ message: "Foto sin contenido" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
