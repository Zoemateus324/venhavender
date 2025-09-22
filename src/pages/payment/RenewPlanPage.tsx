import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Clock, AlertCircle } from 'lucide-react';
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

interface UserPlan {
  plan_type: string;
  plan_status: string;
  plan_expires_at: string;
}

const RenewPlanPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  
  useEffect(() => {
    if (user) {
      fetchUserPlanDetails();
    }
  }, [user]);

  const fetchUserPlanDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch user's current plan details
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('plan_type, plan_status, plan_expires_at')
        .eq('id', user?.id)
        .single();

      if (userError) throw userError;
      
      if (!userData || !userData.plan_type) {
        toast.error('Você não possui um plano ativo.');
        navigate('/dashboard/plans');
        return;
      }
      
      setUserPlan(userData);
      
      // Fetch plan details
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('name', userData.plan_type)
        .single();

      if (planError) throw planError;
      
      if (!planData) {
        toast.error('Detalhes do plano não encontrados.');
        return;
      }
      
      setCurrentPlan(planData);
    } catch (error) {
      console.error('Erro ao carregar detalhes do plano:', error);
      toast.error('Erro ao carregar detalhes do plano.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getDaysRemaining = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleRenewPlan = () => {
    if (currentPlan) {
      navigate(`/payment?plan_id=${currentPlan.id}`);
    } else {
      navigate('/dashboard/plans');
    }
  };

  const handleChangePlan = () => {
    navigate('/dashboard/plans');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userPlan || !currentPlan) {
    return (
      <div className="text-center py-8">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Plano não encontrado</h2>
        <p className="text-gray-600 mb-4">Não foi possível encontrar detalhes do seu plano atual.</p>
        <button
          onClick={() => navigate('/dashboard/plans')}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
        >
          Ver Planos Disponíveis
        </button>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(userPlan.plan_expires_at);
  const isExpired = daysRemaining <= 0;
  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Renovar Plano</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold mb-4">Seu Plano Atual</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">{currentPlan.name}</h3>
            <p className="text-gray-600 mb-4">{currentPlan.description}</p>
            
            <div className="space-y-2">
              {currentPlan.features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></div>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-lg font-semibold">
              {formatCurrency(currentPlan.price)}
            </div>
          </div>
          
          <div className="border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6">
            <div className="mb-4">
              <p className="text-gray-600 mb-1">Status</p>
              <div className="flex items-center">
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${isExpired ? 'bg-red-500' : userPlan.plan_status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                <span className="font-medium">
                  {isExpired ? 'Expirado' : userPlan.plan_status === 'active' ? 'Ativo' : 'Pendente'}
                </span>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-1">Expira em</p>
              <div className="flex items-center">
                <Clock size={16} className="mr-2 text-gray-500" />
                <span className={`font-medium ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-gray-800'}`}>
                  {isExpired ? 'Expirado' : `${formatDate(userPlan.plan_expires_at)} (${daysRemaining} dias restantes)`}
                </span>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <button
                onClick={handleRenewPlan}
                className="w-full py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
              >
                Renovar Plano
              </button>
              
              <button
                onClick={handleChangePlan}
                className="w-full py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Mudar de Plano
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="font-medium mb-2">Sobre a Renovação</h3>
        <p className="text-gray-600 text-sm">
          Ao renovar seu plano, a data de expiração será estendida a partir da data atual. 
          Se você renovar antes da data de expiração, os dias restantes serão adicionados ao novo período.
        </p>
      </div>
    </div>
  );
};

export default RenewPlanPage;