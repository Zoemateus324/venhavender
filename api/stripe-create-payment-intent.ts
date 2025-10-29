import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

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
      amount: Math.round(amount), // Já vem em centavos do frontend
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    };

    // Fallback: especificar métodos se automatic_payment_methods não estiver habilitado na conta
    if (currency?.toLowerCase() === 'brl') {
      (params as any).payment_method_types = ['card', 'pix'];
    } else {
      (params as any).payment_method_types = ['card'];
    }

    const paymentIntent = await stripe.paymentIntents.create(params);

    // Log the created PaymentIntent (safe to log id and status; avoid logging full secrets in prod)
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
      error: error.message || 'Erro interno do servidor'
    });
  }
}
