import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

<<<<<<< HEAD
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
=======
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',

});
>>>>>>> d2e339fd8b064fe159bc59b723e5a55e700d75e8

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

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
    const params: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount), // já vem em centavos do frontend
      currency,
      metadata,
      payment_method_types:
        currency.toLowerCase() === 'brl'
          ? ['card', 'pix']
          : ['card'],
    };

    const paymentIntent = await stripe.paymentIntents.create(params);

    console.log('[Stripe] Created PaymentIntent:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
    });

    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Erro ao criar Payment Intent:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor',
    });
  }
}
