const express = require('express');
const Stripe = require('stripe');
const router = express.Router();
const dotenv = require('dotenv');

// Carregar variáveis de ambiente com base no ambiente
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
} else {
  dotenv.config({ path: '.env.local' });
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
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
    const params = {
      amount: Math.round(amount), // Já vem em centavos do frontend
      currency,
      metadata,
      // Usar lista explícita de métodos (não combinar com automatic_payment_methods)
      payment_method_types: ((currency || '').toLowerCase() === 'brl') ? ['card', 'pix'] : ['card']
    };

    const paymentIntent = await stripe.paymentIntents.create(params);

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
