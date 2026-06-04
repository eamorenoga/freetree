class PaymentGateway {
  async createPayment() {
    throw new Error("createPayment debe implementarse en la pasarela concreta");
  }
}

module.exports = PaymentGateway;
