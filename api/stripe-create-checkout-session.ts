import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
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
      payment_method_types: ['card', 'pix', 'ticket'],
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

  } catch (error: any) {
    console.error('Erro ao criar Checkout Session:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
}
