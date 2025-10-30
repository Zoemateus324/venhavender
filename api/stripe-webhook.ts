import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// ✅ Corrige versão da API Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',

});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  api: {
    bodyParser: false, // ⚠️ Necessário para validar a assinatura Stripe corretamente
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.error('STRIPE_WEBHOOK_SECRET não configurado');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event: Stripe.Event;

  try {
    // ✅ Necessário converter o body em Buffer manualmente
    const buf = await bufferFromRequest(req);
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('❌ Error processing webhook:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// ----------------------------
// 📦 Funções auxiliares
// ----------------------------

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('✅ Payment succeeded:', paymentIntent.id);

  const { plan_id, user_id } = paymentIntent.metadata;

  if (!plan_id || !user_id) {
    console.error('⚠️ Missing metadata in payment intent:', paymentIntent.id);
    return;
  }

  try {
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      console.error('⚠️ Plano não encontrado:', plan_id);
      return;
    }

    const { error: paymentError } = await supabase.from('payments').insert({
      user_id,
      plan_id,
      amount: paymentIntent.amount / 100,
      status: 'completed',
      payment_method: 'stripe',
      stripe_payment_intent_id: paymentIntent.id,
      invoice_url: `https://dashboard.stripe.com/payments/${paymentIntent.id}`,
    });

    if (paymentError) {
      console.error('❌ Erro ao criar registro de pagamento:', paymentError);
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

    const { error: userError } = await supabase.from('user_plans').upsert({
      user_id,
      plan_type: plan.name,
      plan_status: 'active',
      plan_expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (userError) {
      console.error('❌ Erro ao atualizar usuário:', userError);
    }

    console.log('🎉 Pagamento processado com sucesso para usuário:', user_id);
  } catch (error) {
    console.error('❌ Erro ao processar pagamento bem-sucedido:', error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('⚠️ Payment failed:', paymentIntent.id);

  const { user_id } = paymentIntent.metadata;

  if (!user_id) {
    console.error('⚠️ Missing user_id in payment intent:', paymentIntent.id);
    return;
  }

  try {
    const { error: paymentError } = await supabase.from('payments').insert({
      user_id,
      amount: paymentIntent.amount / 100,
      status: 'failed',
      payment_method: 'stripe',
      stripe_payment_intent_id: paymentIntent.id,
    });

    if (paymentError) {
      console.error('❌ Erro ao criar registro de pagamento falhado:', paymentError);
    }

    console.log('🚫 Pagamento falhado registrado para usuário:', user_id);
  } catch (error) {
    console.error('❌ Erro ao processar pagamento falhado:', error);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('✅ Checkout completed:', session.id);

  const { plan_id, user_id } = session.metadata || {};

  if (!plan_id || !user_id) {
    console.error('⚠️ Missing metadata in checkout session:', session.id);
    return;
  }

  try {
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      console.error('⚠️ Plano não encontrado:', plan_id);
      return;
    }

    // ✅ Corrigido: Session não tem invoice_url — usa o ID da fatura se existir
    const invoiceUrl = session.invoice
      ? `https://dashboard.stripe.com/invoices/${session.invoice}`
      : '';

    const { error: paymentError } = await supabase.from('payments').insert({
      user_id,
      plan_id,
      amount: session.amount_total ? session.amount_total / 100 : 0,
      status: 'completed',
      payment_method: 'stripe',
      stripe_checkout_session_id: session.id,
      invoice_url: invoiceUrl,
    });

    if (paymentError) {
      console.error('❌ Erro ao criar registro de pagamento:', paymentError);
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

    const { error: userError } = await supabase
      .from('users')
      .update({
        plan_type: plan.name,
        plan_status: 'active',
        plan_expires_at: expiresAt.toISOString(),
      })
      .eq('id', user_id);

    if (userError) {
      console.error('❌ Erro ao atualizar usuário:', userError);
    }

    console.log('🎉 Checkout processado com sucesso para usuário:', user_id);
  } catch (error) {
    console.error('❌ Erro ao processar checkout:', error);
  }
}

// ----------------------------
// 🧩 Utilitário: converter req.body → Buffer
// ----------------------------
function bufferFromRequest(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
