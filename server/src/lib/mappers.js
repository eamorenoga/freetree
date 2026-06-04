const { mapQrCode } = require("./qr");
const { getPhotoUrl } = require("./photoStorage");

function mapTreeProduct(product) {
  return {
    id: product.id,
    name: product.name,
    species: product.species,
    description: product.description,
    price: product.price,
    imageUrl: product.imageUrl,
    estimatedLocation: product.estimatedLocation,
    location: product.estimatedLocation,
    estimatedCo2: product.estimatedKgCo2PerYear,
    estimatedKgCo2PerYear: product.estimatedKgCo2PerYear,
    co2FactorPerMonth: product.co2FactorPerMonth,
    stock: product.stock,
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };
}

function mapTreePurchase(purchase) {
  return {
    id: purchase.id,
    userId: purchase.userId,
    treeProductId: purchase.treeProductId,
    treeId: purchase.treeProductId,
    quantity: purchase.quantity,
    unitPrice: purchase.unitPrice,
    total: purchase.total,
    status: purchase.status,
    plantedAt: purchase.plantedAt,
    location: purchase.location || "Pendiente de asignacion por TerraBioCol",
    createdAt: purchase.createdAt,
    tree: purchase.treeProduct ? mapTreeProduct(purchase.treeProduct) : undefined,
    treeProduct: purchase.treeProduct ? mapTreeProduct(purchase.treeProduct) : undefined,
    trackingEvents: purchase.trackingEvents ? purchase.trackingEvents.map(mapTreeTracking) : [],
    qrCode: mapQrCode(purchase.qrCode),
    carbonFootprint: purchase.carbonFootprint,
    payment: purchase.payment
  };
}

function mapTreeTracking(event) {
  return {
    id: event.id,
    userTreeId: event.treePurchaseId,
    treePurchaseId: event.treePurchaseId,
    title: event.status,
    description: event.description,
    imageUrl: event.photos?.[0] ? getPhotoUrl(event.photos[0]) : undefined,
    eventDate: event.eventDate,
    location: event.location,
    status: event.status,
    photos: event.photos ? event.photos.map(mapTreePhoto) : [],
    userTree: event.treePurchase ? mapTreePurchase(event.treePurchase) : undefined,
    treePurchase: event.treePurchase ? mapTreePurchase(event.treePurchase) : undefined
  };
}

function mapTreePhoto(photo) {
  return {
    id: photo.id,
    treeTrackingId: photo.treeTrackingId,
    imageUrl: getPhotoUrl(photo),
    caption: photo.caption,
    uploadedById: photo.uploadedById,
    fileName: photo.fileName,
    mimeType: photo.mimeType,
    createdAt: photo.createdAt
  };
}

function mapCarbonFootprint(record) {
  return {
    id: record.id,
    userId: record.userId,
    treePurchaseId: record.treePurchaseId,
    treesCount: record.treePurchaseId ? 1 : 0,
    estimatedKgCo2: record.estimatedKgCo2,
    accumulatedKgCo2: record.accumulatedKgCo2,
    notes: record.notes,
    createdAt: record.calculationDate,
    calculationDate: record.calculationDate
  };
}

module.exports = {
  mapCarbonFootprint,
  mapTreePhoto,
  mapTreeProduct,
  mapTreePurchase,
  mapTreeTracking
};
