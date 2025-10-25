const express = require('express');
const Stripe = require('stripe');
const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

router.post('/stripe-confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, paymentMethodId } = req.body;

    if (!paymentIntentId || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        error: 'paymentIntentId e paymentMethodId são obrigatórios'
      });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Chave secreta do Stripe não configurada'
      });
    }

    // Confirmar o pagamento
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });

    return res.status(200).json({
      success: true,
      status: paymentIntent.status,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

module.exports = router;
