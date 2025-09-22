import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  icon: string;
}

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
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: 'credit_card', name: 'Cartão de Crédito', type: 'card', icon: 'credit-card' },
    { id: 'pix', name: 'PIX', type: 'pix', icon: 'qr-code' },
    { id: 'boleto', name: 'Boleto Bancário', type: 'boleto', icon: 'file-text' },
  ]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('credit_card');
  const [cardInfo, setCardInfo] = useState({
    number: '',
    name: '',
    expiry: '',
    cvc: '',
  });
  
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

  const handlePaymentMethodChange = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
  };

  const handleCardInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlan) {
      toast.error('Selecione um plano para continuar.');
      return;
    }

    try {
      setProcessingPayment(true);
      
      // In a real implementation, this would integrate with a payment gateway
      // For this demo, we'll simulate a successful payment after a delay
      setTimeout(async () => {
        try {
          // Create payment record
          const { data: paymentData, error: paymentError } = await supabase
            .from('payments')
            .insert([
              {
                user_id: user?.id,
                plan_id: selectedPlan.id,
                amount: selectedPlan.price,
                status: 'completed',
                payment_method: selectedPaymentMethod,
                invoice_url: 'https://example.com/invoice/123',
              }
            ]);

          if (paymentError) throw paymentError;

          // Update user's plan
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + selectedPlan.duration_days);

          const { error: userError } = await supabase
            .from('users')
            .update({
              plan_type: selectedPlan.name,
              plan_status: 'active',
              plan_expires_at: expiresAt.toISOString(),
            })
            .eq('id', user?.id);

          if (userError) throw userError;

          toast.success('Pagamento processado com sucesso!');
          navigate('/dashboard');
        } catch (error) {
          console.error('Erro ao processar pagamento:', error);
          toast.error('Erro ao processar pagamento.');
          setProcessingPayment(false);
        }
      }, 2000);
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error('Erro ao processar pagamento.');
      setProcessingPayment(false);
    }
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
            
            <div className="mb-6">
              <div className="flex flex-wrap gap-4">
                {paymentMethods.map((method) => (
                  <div 
                    key={method.id}
                    onClick={() => handlePaymentMethodChange(method.id)}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${selectedPaymentMethod === method.id ? 'border-primary bg-primary-light' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <div className="mr-3">
                      {method.type === 'card' && <CreditCard className="text-gray-600" />}
                      {method.type === 'pix' && <div className="text-gray-600">PIX</div>}
                      {method.type === 'boleto' && <div className="text-gray-600">Boleto</div>}
                    </div>
                    <div>
                      <p className="font-medium">{method.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              {selectedPaymentMethod === 'credit_card' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
                      Número do Cartão
                    </label>
                    <input
                      type="text"
                      id="number"
                      name="number"
                      value={cardInfo.number}
                      onChange={handleCardInfoChange}
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nome no Cartão
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={cardInfo.name}
                      onChange={handleCardInfoChange}
                      placeholder="NOME COMO ESTÁ NO CARTÃO"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Expiração
                      </label>
                      <input
                        type="text"
                        id="expiry"
                        name="expiry"
                        value={cardInfo.expiry}
                        onChange={handleCardInfoChange}
                        placeholder="MM/AA"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="cvc" className="block text-sm font-medium text-gray-700 mb-1">
                        CVC
                      </label>
                      <input
                        type="text"
                        id="cvc"
                        name="cvc"
                        value={cardInfo.cvc}
                        onChange={handleCardInfoChange}
                        placeholder="123"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {selectedPaymentMethod === 'pix' && (
                <div className="text-center py-4">
                  <div className="bg-gray-100 p-4 rounded-lg inline-block mb-4">
                    <div className="text-2xl font-mono border-2 border-gray-300 p-6 rounded">
                      PIX QR CODE
                    </div>
                  </div>
                  <p className="text-gray-600 mb-2">Escaneie o QR Code acima com o aplicativo do seu banco</p>
                  <p className="text-sm text-gray-500">O pagamento será confirmado automaticamente</p>
                </div>
              )}
              
              {selectedPaymentMethod === 'boleto' && (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">Clique no botão abaixo para gerar o boleto</p>
                  <button 
                    type="button"
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors mb-4"
                  >
                    Gerar Boleto
                  </button>
                  <p className="text-sm text-gray-500">O boleto leva até 3 dias úteis para ser compensado</p>
                </div>
              )}
              
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={processingPayment}
                  className={`w-full py-3 rounded-md bg-primary text-white font-medium hover:bg-primary-dark transition-colors ${processingPayment ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {processingPayment ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                      Processando...
                    </div>
                  ) : (
                    `Pagar ${formatCurrency(selectedPlan.price)}`
                  )}
                </button>
              </div>
            </form>
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