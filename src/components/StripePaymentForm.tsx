import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { CreditCard, Lock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface StripePaymentFormProps {
  amount: number;
  currency?: string;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
  metadata?: Record<string, string>;
}

const PaymentForm: React.FC<{
  amount: number;
  currency: string;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
  metadata?: Record<string, string>;
}> = ({ amount, currency, onSuccess, onError, metadata }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || 'Erro no pagamento');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setIsComplete(true);
        onSuccess(paymentIntent);
        toast.success('Pagamento realizado com sucesso!');
      }
    } catch (err: any) {
      onError(err.message || 'Erro inesperado');
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(value);
  };

  if (isComplete) {
    return (
      <div className="text-center py-8">
        <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-700 mb-2">
          Pagamento Realizado!
        </h3>
        <p className="text-gray-600">
          Seu pagamento foi processado com sucesso.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Valor a pagar:</span>
          <span className="text-lg font-semibold text-gray-900">
            {formatCurrency(amount)}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Lock size={16} />
          <span>Seus dados de pagamento são protegidos com criptografia SSL</span>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <PaymentElement
            options={{
              layout: 'tabs',
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Processando...</span>
          </>
        ) : (
          <>
            <CreditCard size={20} />
            <span>Pagar {formatCurrency(amount)}</span>
          </>
        )}
      </button>

      <div className="text-xs text-gray-500 text-center">
        <p>Pagamentos processados com segurança pelo Stripe</p>
        <p>Suportamos cartão e boleto</p>
      </div>
    </form>
  );
};

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  amount,
  currency = 'brl',
  onSuccess,
  onError,
  metadata
}) => {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        // Usar o caminho relativo para aproveitar o proxy do Vite
        const response = await fetch('/api/stripe-create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // Converter para centavos
            currency,
            metadata,
          }),
        });

        const data = await response.json();
        // Log the response to help debug elements session 400 errors
        //console.log('[Stripe] createPaymentIntent response:', data);

        if (data.success) {
          setClientSecret(data.clientSecret);
        } else {
          onError(data.error || 'Erro ao inicializar pagamento');
        }
      } catch (error: any) {
        onError(error.message || 'Erro de conexão');
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [amount, currency, metadata, onError]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Inicializando pagamento...</p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="text-center py-8">
        <XCircle size={48} className="text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-700 mb-2">
          Erro na Inicialização
        </h3>
        <p className="text-gray-600">
          Não foi possível inicializar o pagamento.
        </p>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#f97316',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Elements options={options} stripe={stripePromise}>
      <PaymentForm
        amount={amount}
        currency={currency}
        onSuccess={onSuccess}
        onError={onError}
        metadata={metadata}
      />
    </Elements>
  );
};

export default StripePaymentForm;
