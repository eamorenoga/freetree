const PaymentGateway = require("./paymentGateway");

const allowedStatuses = new Set(["PENDING", "APPROVED", "REJECTED"]);

class MockPaymentGateway extends PaymentGateway {
  async createPayment({ amount, requestedStatus }) {
    const status = allowedStatuses.has(requestedStatus) ? requestedStatus : "APPROVED";

    return {
      provider: "MOCK",
      reference: `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      amount,
      currency: "COP",
      status,
      paidAt: status === "APPROVED" ? new Date() : null,
      rawResponse: {
        message: "Pago simulado. Reemplazar este adaptador por Wompi, PayU, MercadoPago o Stripe."
      }
    };
  }
}

module.exports = MockPaymentGateway;
