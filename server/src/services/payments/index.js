const MockPaymentGateway = require("./mockPaymentGateway");

function getPaymentGateway() {
  const provider = process.env.PAYMENT_PROVIDER || "mock";

  if (provider === "mock") {
    return new MockPaymentGateway();
  }

  throw new Error(`Pasarela de pagos no soportada: ${provider}`);
}

module.exports = { getPaymentGateway };
