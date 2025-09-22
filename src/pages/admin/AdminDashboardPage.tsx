import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { BarChart3, Users, FileText, CreditCard, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import AdminLayout from './AdminLayout';

interface DashboardStats {
  totalUsers: number;
  totalAds: number;
  totalRevenue: number;
  activeAds: number;
  pendingPayments: number;
  newUsersToday: number;
  userGrowth: number;
  adGrowth: number;
  revenueGrowth: number;
}

const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalAds: 0,
    totalRevenue: 0,
    activeAds: 0,
    pendingPayments: 0,
    newUsersToday: 0,
    userGrowth: 0,
    adGrowth: 0,
    revenueGrowth: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        
        // Fetch total users
        const { count: totalUsers, error: usersError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        if (usersError) throw usersError;

        // Fetch new users today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: newUsersToday, error: newUsersError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString());

        if (newUsersError) throw newUsersError;

        // Fetch total ads
        const { count: totalAds, error: adsError } = await supabase
          .from('ads')
          .select('*', { count: 'exact', head: true });

        if (adsError) throw adsError;

        // Fetch active ads
        const { count: activeAds, error: activeAdsError } = await supabase
          .from('ads')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        if (activeAdsError) throw activeAdsError;

        // Fetch pending payments
        const { count: pendingPayments, error: paymentsError } = await supabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        if (paymentsError) throw paymentsError;

        // Fetch total revenue
        const { data: revenueData, error: revenueError } = await supabase
          .from('payments')
          .select('amount')
          .eq('status', 'approved');

        if (revenueError) throw revenueError;

        const totalRevenue = revenueData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

        // Mock growth data (in a real app, you'd calculate this from historical data)
        const userGrowth = 12.5; // percentage
        const adGrowth = 8.3;
        const revenueGrowth = 15.7;

        setStats({
          totalUsers: totalUsers || 0,
          totalAds: totalAds || 0,
          totalRevenue,
          activeAds: activeAds || 0,
          pendingPayments: pendingPayments || 0,
          newUsersToday: newUsersToday || 0,
          userGrowth,
          adGrowth,
          revenueGrowth
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Erro ao carregar estatísticas do dashboard');
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // If this is the parent route with children, render the Outlet
  if (location.pathname !== '/admin') {
    return <AdminLayout />;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const StatCard = ({ title, value, icon, growth, isRevenue = false }) => {
    const formattedValue = isRevenue ? formatCurrency(value) : value.toLocaleString();
    const isPositiveGrowth = growth >= 0;

    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <h3 className="text-2xl font-bold mt-2">{formattedValue}</h3>
          </div>
          <div className={`p-3 rounded-full ${isRevenue ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
            {icon}
          </div>
        </div>
        {growth !== undefined && (
          <div className="flex items-center mt-4">
            <span className={`flex items-center text-sm ${isPositiveGrowth ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveGrowth ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
              {Math.abs(growth).toFixed(1)}%
            </span>
            <span className="text-gray-500 text-sm ml-2">desde o mês passado</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Última atualização: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Total de Usuários" 
              value={stats.totalUsers} 
              icon={<Users size={24} />} 
              growth={stats.userGrowth} 
            />
            <StatCard 
              title="Total de Anúncios" 
              value={stats.totalAds} 
              icon={<FileText size={24} />} 
              growth={stats.adGrowth} 
            />
            <StatCard 
              title="Receita Total" 
              value={stats.totalRevenue} 
              icon={<CreditCard size={24} />} 
              growth={stats.revenueGrowth} 
              isRevenue={true} 
            />
            <StatCard 
              title="Anúncios Ativos" 
              value={stats.activeAds} 
              icon={<BarChart3 size={24} />} 
            />
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium mb-4">Visão Geral</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Novos usuários hoje</span>
                  <span className="font-medium">{stats.newUsersToday}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Pagamentos pendentes</span>
                  <span className="font-medium">{stats.pendingPayments}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Taxa de conversão</span>
                  <span className="font-medium">3.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ticket médio</span>
                  <span className="font-medium">{formatCurrency(stats.totalRevenue / (stats.totalAds || 1))}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium mb-4">Ações Rápidas</h3>
              <div className="grid grid-cols-2 gap-4">
                <button className="p-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-left">
                  <FileText size={20} className="mb-2" />
                  <div className="font-medium">Aprovar Anúncios</div>
                  <div className="text-sm text-blue-500">5 pendentes</div>
                </button>
                <button className="p-4 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-left">
                  <CreditCard size={20} className="mb-2" />
                  <div className="font-medium">Verificar Pagamentos</div>
                  <div className="text-sm text-green-500">{stats.pendingPayments} pendentes</div>
                </button>
                <button className="p-4 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-left">
                  <Users size={20} className="mb-2" />
                  <div className="font-medium">Gerenciar Usuários</div>
                  <div className="text-sm text-purple-500">{stats.totalUsers} total</div>
                </button>
                <button className="p-4 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors text-left">
                  <TrendingUp size={20} className="mb-2" />
                  <div className="font-medium">Ver Relatórios</div>
                  <div className="text-sm text-orange-500">Análise completa</div>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium mb-4">Atividade Recente</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="font-medium">Novo usuário registrado</p>
                    <p className="text-sm text-gray-500">João Silva criou uma conta</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">Há 2 horas</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <p className="font-medium">Pagamento recebido</p>
                    <p className="text-sm text-gray-500">R$ 199,90 - Plano Premium</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">Há 3 horas</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mr-3">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="font-medium">Novo anúncio criado</p>
                    <p className="text-sm text-gray-500">"Apartamento para alugar no centro"</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">Há 5 horas</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 mr-3">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="font-medium">Anúncio reportado</p>
                    <p className="text-sm text-gray-500">"Vendo produto falsificado"</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">Há 6 horas</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;