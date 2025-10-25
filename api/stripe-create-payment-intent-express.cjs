const express = require('express');
const Stripe = require('stripe');
const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

router.post('/stripe-create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'brl', metadata = {} } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valor inválido'
      });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Chave secreta do Stripe não configurada'
      });
    }

    // Criar Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Já vem em centavos do frontend
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error) {
    console.error('Erro ao criar Payment Intent:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

module.exports = router;
