function createQrCode() {
  return `TBC-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`.toUpperCase();
}

function getPublicTreeUrl(code) {
  const publicBaseUrl = process.env.PUBLIC_APP_URL || process.env.RENDER_EXTERNAL_URL || process.env.CLIENT_URL || "http://localhost:5173";
  return `${publicBaseUrl.replace(/\/$/, "")}/tree/public/${encodeURIComponent(code)}`;
}

function mapQrCode(qrCode) {
  if (!qrCode) {
    return qrCode;
  }

  return {
    ...qrCode,
    imageUrl: getQrImageUrl(qrCode.code),
    publicUrl: getPublicTreeUrl(qrCode.code)
  };
}

function getQrImageUrl(code) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(getPublicTreeUrl(code))}`;
}

module.exports = {
  createQrCode,
  getPublicTreeUrl,
  getQrImageUrl,
  mapQrCode
};
