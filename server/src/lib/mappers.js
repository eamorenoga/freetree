const { getPublicTreeUrl } = require("./qr");

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
    qrCode: purchase.qrCode ? { ...purchase.qrCode, publicUrl: getPublicTreeUrl(purchase.qrCode.code) } : purchase.qrCode,
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
    imageUrl: event.photos?.[0]?.imageUrl,
    eventDate: event.eventDate,
    location: event.location,
    status: event.status,
    photos: event.photos || [],
    userTree: event.treePurchase ? mapTreePurchase(event.treePurchase) : undefined,
    treePurchase: event.treePurchase ? mapTreePurchase(event.treePurchase) : undefined
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
  mapTreeProduct,
  mapTreePurchase,
  mapTreeTracking
};
