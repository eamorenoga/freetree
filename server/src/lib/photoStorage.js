function parsePhotoData(photoData) {
  if (!photoData) {
    return null;
  }

  const dataUrlMatch = photoData.match(/^data:(.+);base64,(.+)$/);
  const base64Content = dataUrlMatch ? dataUrlMatch[2] : photoData;
  const mimeType = dataUrlMatch ? dataUrlMatch[1] : null;

  return {
    buffer: Buffer.from(base64Content, "base64"),
    mimeType
  };
}

function getPhotoUrl(photo) {
  if (photo?.imageData) {
    const apiBaseUrl = process.env.PUBLIC_API_URL || process.env.VITE_API_URL;
    return apiBaseUrl ? `${apiBaseUrl.replace(/\/$/, "")}/photos/${photo.id}` : `/api/photos/${photo.id}`;
  }

  return photo?.imageUrl || null;
}

module.exports = {
  getPhotoUrl,
  parsePhotoData
};
