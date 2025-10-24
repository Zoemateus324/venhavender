import { loadStripe } from '@stripe/stripe-js';

// Chaves públicas do Stripe (podem ser expostas no frontend)
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!STRIPE_PUBLISHABLE_KEY) {
  console.warn('VITE_STRIPE_PUBLISHABLE_KEY não encontrada. Configure a variável de ambiente.');
}

// Inicializar Stripe
export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Configurações do Stripe
export const STRIPE_CONFIG = {
  currency: 'brl',
  locale: 'pt-BR',
  appearance: {
    theme: 'stripe',
    variables: {
      colorPrimary: '#f97316', // Cor laranja do tema
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
    rules: {
      '.Tab': {
        border: '1px solid #e6e6e6',
        borderRadius: '8px',
      },
      '.Tab:hover': {
        color: '#f97316',
      },
      '.Tab--selected': {
        borderColor: '#f97316',
        color: '#f97316',
      },
    },
  },
};

// Função para criar Payment Intent
export const createPaymentIntent = async (amount: number, currency: string = 'brl', metadata?: Record<string, string>) => {
  try {
    const response = await fetch('/api/stripe-create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Stripe usa centavos
        currency,
        metadata,
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao criar Payment Intent');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao criar Payment Intent:', error);
    throw error;
  }
};

// Função para criar Checkout Session
export const createCheckoutSession = async (priceId: string, successUrl: string, cancelUrl: string, metadata?: Record<string, string>) => {
  try {
    const response = await fetch('/api/stripe-create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        successUrl,
        cancelUrl,
        metadata,
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao criar Checkout Session');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao criar Checkout Session:', error);
    throw error;
  }
};

// Função para processar pagamento com cartão
export const processPayment = async (paymentIntentId: string, paymentMethodId: string) => {
  try {
    const response = await fetch('/api/stripe-confirm-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentIntentId,
        paymentMethodId,
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao processar pagamento');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    throw error;
  }
};

export default stripePromise;
