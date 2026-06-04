const healthFactorsByStatus = {
  PURCHASED: 0.2,
  PLANTED: 0.55,
  GROWING: 0.8,
  HEALTHY: 1,
  NEEDS_ATTENTION: 0.45,
  MATURE: 1.1
};

const carKgCo2PerKm = 0.192;
const energyKgCo2PerKwh = 0.4;

function getAgeMonths(purchase) {
  const startDate = purchase.plantedAt || purchase.createdAt;
  const now = new Date();
  const months =
    (now.getFullYear() - startDate.getFullYear()) * 12 +
    (now.getMonth() - startDate.getMonth()) +
    (now.getDate() >= startDate.getDate() ? 0 : -1);

  return Math.max(months, 1);
}

function getCurrentStatus(purchase) {
  return purchase.trackingEvents?.[0]?.status || purchase.status || "PURCHASED";
}

function getHealthFactor(status) {
  return healthFactorsByStatus[status] || 0.7;
}

function calculateTreeCarbonImpact(purchase) {
  const ageMonths = getAgeMonths(purchase);
  const status = getCurrentStatus(purchase);
  const healthFactor = getHealthFactor(status);
  const speciesFactor = Number(purchase.treeProduct.co2FactorPerMonth || purchase.treeProduct.estimatedKgCo2PerYear / 12 || 0);
  const monthlyKgCo2 = speciesFactor * healthFactor;
  const accumulatedKgCo2 = monthlyKgCo2 * ageMonths;
  const annualKgCo2 = monthlyKgCo2 * 12;

  return {
    purchaseId: purchase.id,
    treeId: purchase.treeProductId,
    treeName: purchase.treeProduct.name,
    species: purchase.treeProduct.species,
    status,
    location: purchase.location,
    ageMonths,
    formula: {
      expression: "CO2_estimado = factor_especie * edad_meses * estado_salud",
      speciesFactor,
      healthFactor
    },
    monthlyKgCo2,
    annualKgCo2,
    accumulatedKgCo2
  };
}

function getEquivalences(accumulatedKgCo2) {
  return {
    compensatedCarKm: accumulatedKgCo2 / carKgCo2PerKm,
    compensatedEnergyKwh: accumulatedKgCo2 / energyKgCo2PerKwh
  };
}

function summarizeCarbonImpact(treeImpacts) {
  const totalMonthlyKgCo2 = treeImpacts.reduce((sum, impact) => sum + impact.monthlyKgCo2, 0);
  const totalAnnualKgCo2 = treeImpacts.reduce((sum, impact) => sum + impact.annualKgCo2, 0);
  const totalAccumulatedKgCo2 = treeImpacts.reduce((sum, impact) => sum + impact.accumulatedKgCo2, 0);

  return {
    activeTreesCount: treeImpacts.length,
    totalMonthlyKgCo2,
    totalAnnualKgCo2,
    totalAccumulatedKgCo2,
    equivalences: {
      ...getEquivalences(totalAccumulatedKgCo2),
      activeTreesCount: treeImpacts.length
    },
    disclaimer:
      "Este calculo es estimado y sirve como referencia informativa. No reemplaza una certificacion ambiental oficial."
  };
}

module.exports = {
  calculateTreeCarbonImpact,
  getEquivalences,
  summarizeCarbonImpact
};
