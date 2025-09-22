import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  features: string[];
  is_active: boolean;
  created_at: string;
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .order('price', { ascending: true });

        if (error) throw error;
        setPlans(data || []);
      } catch (err) {
        setError('Falha ao carregar planos');
        console.error('Error fetching plans:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlans();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('plans')
        .update({ is_active: !currentStatus })
        .eq('id', planId);

      if (error) throw error;

      // Update local state
      setPlans(plans.map(plan => 
        plan.id === planId ? { ...plan, is_active: !currentStatus } : plan
      ));
    } catch (err) {
      console.error('Error updating plan status:', err);
      alert('Falha ao atualizar status do plano');
    }
  };

  if (isLoading) return <div className="p-8 text-center">Carregando planos...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Planos</h1>
        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => alert('Funcionalidade para adicionar novo plano')}
        >
          Adicionar Plano
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duração</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {plans.length > 0 ? (
              plans.map((plan) => (
                <tr key={plan.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{plan.name}</td>
                  <td className="px-6 py-4">{plan.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatPrice(plan.price)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{plan.duration_days} dias</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${plan.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {plan.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                      onClick={() => alert(`Editar plano ${plan.id}`)}
                    >
                      Editar
                    </button>
                    <button 
                      className={`${plan.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                      onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                    >
                      {plan.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  Nenhum plano encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}