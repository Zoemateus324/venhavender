import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import StripePaymentForm from '../../components/StripePaymentForm';


interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  max_images: number;
  duration_days: number;
}

const PaymentPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  
  // Get plan ID from URL or query params
  const params = new URLSearchParams(window.location.search);
  const planId = params.get('plan_id');

  useEffect(() => {
    if (planId) {
      fetchPlanDetails(planId);
    } else {
      setLoading(false);
      toast.error('Nenhum plano selecionado.');
      navigate('/dashboard/plans');
    }
  }, [planId]);

  const fetchPlanDetails = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        toast.error('Plano não encontrado.');
        navigate('/dashboard/plans');
        return;
      }

      setSelectedPlan(data);
    } catch (error) {
      console.error('Erro ao carregar detalhes do plano:', error);
      toast.error('Erro ao carregar detalhes do plano.');
    } finally {
      setLoading(false);
    }
  };


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handlePaymentSuccess = async (paymentIntent: any) => {
    if (!selectedPlan || !user) return;

    try {
      setProcessingPayment(true);

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([
          {
            user_id: user.id,
            plan_id: selectedPlan.id,
            amount: selectedPlan.price,
            status: 'completed',
            payment_method: 'stripe',
            stripe_payment_intent_id: paymentIntent.id,
            invoice_url: `https://dashboard.stripe.com/payments/${paymentIntent.id}`,
          }
        ]);

      if (paymentError) throw paymentError;

      // Update user's plan
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + selectedPlan.duration_days);

      const { error: userError } = await supabase
        .from('user_plans')
        .upsert({
          user_id: user.id,
          plan_type: selectedPlan.name,
          plan_status: 'active',
          plan_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (userError) throw userError;

      toast.success('Pagamento processado com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePaymentError = (error: string) => {
    toast.error(error);
    setProcessingPayment(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!selectedPlan) {
    return (
      <div className="text-center py-8">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Plano não encontrado</h2>
        <p className="text-gray-600 mb-4">O plano selecionado não está disponível.</p>
        <button
          onClick={() => navigate('/dashboard/plans')}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
        >
          Voltar para Planos
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Payment Form */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Método de Pagamento</h2>
            
            
            <StripePaymentForm
              amount={selectedPlan.price}
              currency="brl"
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              metadata={{
                plan_id: selectedPlan.id,
                plan_name: selectedPlan.name,
                user_id: user?.id || '',
              }}
            />
          </div>
        </div>
        
        {/* Order Summary */}
        <div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Resumo do Pedido</h2>
            
            <div className="border-t border-gray-200 pt-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Plano</span>
                <span className="font-medium">{selectedPlan.name}</span>
              </div>
              
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Duração</span>
                <span>{selectedPlan.duration_days} dias</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Imagens</span>
                <span>Até {selectedPlan.max_images}</span>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-4">
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span className="text-lg">{formatCurrency(selectedPlan.price)}</span>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-start">
                <CheckCircle size={20} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">
                  Seu plano será ativado imediatamente após a confirmação do pagamento.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;