import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Payment {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  payment_method: string;
  created_at: string;
  user_name?: string;
  plan_name?: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPayments() {
      try {
        // Fetch payments with user and plan information
        const { data, error } = await supabase
          .from('payments')
          .select(`
            *,
            users:user_id (name, email),
            plans:plan_id (name)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Format the data to include user_name and plan_name
        const formattedData = data?.map(payment => ({
          ...payment,
          user_name: payment.users?.name || 'Usuário desconhecido',
          plan_name: payment.plans?.name || 'Plano desconhecido'
        })) || [];

        setPayments(formattedData);
      } catch (err) {
        setError('Falha ao carregar pagamentos');
        console.error('Error fetching payments:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPayments();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprovado';
      case 'pending':
        return 'Pendente';
      case 'rejected':
        return 'Rejeitado';
      case 'refunded':
        return 'Reembolsado';
      default:
        return status;
    }
  };

  const updatePaymentStatus = async (paymentId: string, newStatus: 'approved' | 'rejected' | 'refunded') => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: newStatus })
        .eq('id', paymentId);

      if (error) throw error;

      // Update local state
      setPayments(payments.map(payment => 
        payment.id === paymentId ? { ...payment, status: newStatus } : payment
      ));
    } catch (err) {
      console.error('Error updating payment status:', err);
      alert('Falha ao atualizar status do pagamento');
    }
  };

  if (isLoading) return <div className="p-8 text-center">Carregando pagamentos...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Pagamentos</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plano</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.length > 0 ? (
              payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.id.substring(0, 8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap">{payment.user_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{payment.plan_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatPrice(payment.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{payment.payment_method}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(payment.created_at)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(payment.status)}`}>
                      {getStatusText(payment.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {payment.status === 'pending' && (
                      <>
                        <button 
                          className="text-green-600 hover:text-green-900 mr-2"
                          onClick={() => updatePaymentStatus(payment.id, 'approved')}
                        >
                          Aprovar
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => updatePaymentStatus(payment.id, 'rejected')}
                        >
                          Rejeitar
                        </button>
                      </>
                    )}
                    {payment.status === 'approved' && (
                      <button 
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => updatePaymentStatus(payment.id, 'refunded')}
                      >
                        Reembolsar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                  Nenhum pagamento encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}