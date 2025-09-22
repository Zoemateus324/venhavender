import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { CreditCard, Award, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  max_images: number;
  duration_days: number;
}

const PlansPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast.error('Erro ao carregar planos disponíveis.');
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  const handleSelectPlan = async (planId: string) => {
    try {
      // Redirect to payment page with plan ID
      window.location.href = `/dashboard/payments/checkout/${planId}`;
    } catch (error) {
      console.error('Erro ao selecionar plano:', error);
      toast.error('Erro ao processar sua solicitação.');
    }
  };

  const isPlanActive = (planName: string) => {
    return user?.plan_type === planName && user?.plan_status === 'active';
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Planos Disponíveis</h1>
      
      {/* Current Plan Status */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-primary-light text-primary mr-4">
            <CreditCard size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Seu Plano Atual</h2>
            <div className="flex items-center mt-1">
              <p className="text-gray-700 font-medium capitalize">
                {user?.plan_type === 'free' ? 'Gratuito' : user?.plan_type || 'Gratuito'}
              </p>
              <span className="mx-2">•</span>
              {user?.plan_status === 'active' ? (
                <span className="text-green-600 text-sm flex items-center">
                  <CheckCircle size={16} className="mr-1" /> Ativo
                </span>
              ) : (
                <span className="text-gray-500 text-sm flex items-center">
                  <AlertCircle size={16} className="mr-1" /> Inativo
                </span>
              )}
            </div>
            {user?.plan_expires_at && user?.plan_status === 'active' && (
              <p className="text-sm text-gray-500 mt-1">
                Expira em: {formatDate(user.plan_expires_at)}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Available Plans */}
      <h2 className="text-xl font-semibold mb-4">Escolha seu Plano</h2>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`bg-white rounded-lg shadow-sm border ${isPlanActive(plan.name) ? 'border-primary' : 'border-gray-200'} overflow-hidden`}
            >
              <div className={`p-4 ${isPlanActive(plan.name) ? 'bg-primary text-white' : 'bg-gray-50'}`}>
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-2xl font-bold">{formatCurrency(plan.price)}</span>
                  <span className="text-sm">/mês</span>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-gray-600 mb-4">{plan.description}</p>
                
                <ul className="space-y-2 mb-6">
                  {plan.features && plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle size={16} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                  <div className="flex items-center">
                    <Award size={16} className="mr-1" />
                    <span>Até {plan.max_images} imagens</span>
                  </div>
                  <div className="flex items-center">
                    <Clock size={16} className="mr-1" />
                    <span>{plan.duration_days} dias</span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full py-2 rounded-md ${isPlanActive(plan.name) 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-primary text-white hover:bg-primary-dark transition-colors'}`}
                  disabled={isPlanActive(plan.name)}
                >
                  {isPlanActive(plan.name) ? 'Plano Atual' : 'Selecionar Plano'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* FAQ Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Perguntas Frequentes</h2>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
          <div className="p-4">
            <h3 className="font-medium text-lg mb-2">Como funciona a renovação?</h3>
            <p className="text-gray-600">Os planos não são renovados automaticamente. Você receberá uma notificação quando seu plano estiver próximo do vencimento.</p>
          </div>
          
          <div className="p-4">
            <h3 className="font-medium text-lg mb-2">Posso mudar de plano?</h3>
            <p className="text-gray-600">Sim, você pode mudar de plano a qualquer momento. Se você fizer upgrade, o valor proporcional do plano atual será descontado do novo plano.</p>
          </div>
          
          <div className="p-4">
            <h3 className="font-medium text-lg mb-2">Como são feitos os pagamentos?</h3>
            <p className="text-gray-600">Aceitamos pagamentos via cartão de crédito, boleto bancário e PIX através da nossa plataforma de pagamentos segura.</p>
          </div>
          
          <div className="p-4">
            <h3 className="font-medium text-lg mb-2">Posso cancelar meu plano?</h3>
            <p className="text-gray-600">Você pode cancelar seu plano a qualquer momento, mas não fazemos reembolso de valores já pagos.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlansPage;