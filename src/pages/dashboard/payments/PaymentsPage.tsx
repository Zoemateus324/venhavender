import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';
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

interface Payment {
  id: string;
  created_at: string;
  amount: number;
  status: string;
  plan_name: string;
  payment_method: string;
  invoice_url?: string;
}

const PaymentsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingPayments, setLoadingPayments] = useState<boolean>(true);

  useEffect(() => {
    fetchPlans();
    if (user) {
      fetchPayments();
    }
  }, [user]);

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

  const fetchPayments = async () => {
    try {
      setLoadingPayments(true);
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico de pagamentos:', error);
      toast.error('Erro ao carregar seu histórico de pagamentos.');
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    try {
      // In a real implementation, this would redirect to a checkout page
      // For now, we'll just show a toast
      toast.success('Redirecionando para a página de pagamento...');
      
      // Navigate to payment page with plan ID (checkout route)
      window.location.href = `/payment?plan_id=${planId}`;
    } catch (error) {
      console.error('Erro ao selecionar plano:', error);
      toast.error('Erro ao processar sua solicitação.');
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
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Pago</span>;
      case 'pending':
        return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Pendente</span>;
      case 'failed':
        return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Falhou</span>;
      case 'refunded':
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">Reembolsado</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const isPlanActive = (planName: string) => {
    return user?.plan_type === planName && user?.plan_status === 'active';
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Planos e Pagamentos</h1>
      
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
                  {(plan.features ?? []).map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle size={16} className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                  <div className="flex items-center">
                    <Award size={16} className="mr-1" />
                    <span>Até {('photo_limit' in plan ? (plan as any).photo_limit : (plan as any).max_images) || 0} imagens</span>
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
      
      {/* Payment History */}
      <h2 className="text-xl font-semibold mb-4">Histórico de Pagamentos</h2>
      
      {loadingPayments ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : payments.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plano
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.plan_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {payment.payment_method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {payment.invoice_url && (
                        <a 
                          href={payment.invoice_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-dark"
                        >
                          Ver fatura
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">Você ainda não possui histórico de pagamentos.</p>
        </div>
      )}
      
      {/* Footer Banner */}
      <div className="mt-8 bg-orange from-primary to-primary-dark rounded-lg shadow-lg p-6 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Anúncio de Rodapé</h3>
            <p className="mb-4 md:mb-0">Destaque seu anúncio no rodapé de todas as páginas por apenas R$ 99,90 por semana!</p>
          </div>
          <Link 
            to="/dashboard/ads/footer-request" 
            className="px-6 py-2 bg-white text-primary font-medium rounded-md hover:bg-gray-100 transition-colors"
          >
            Solicitar Anúncio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;