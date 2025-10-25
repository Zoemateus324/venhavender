const express = require('express');
const Stripe = require('stripe');
const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

router.post('/stripe-create-checkout-session', async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl, metadata = {} } = req.body;

    if (!priceId || !successUrl || !cancelUrl) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: priceId, successUrl, cancelUrl'
      });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Chave secreta do Stripe não configurada'
      });
    }

    // Criar Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'pix'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      locale: 'pt-BR',
      custom_text: {
        submit: {
          message: 'Após o pagamento, você será redirecionado para o painel.',
        },
      },
    });

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Erro ao criar Checkout Session:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

module.exports = router;
