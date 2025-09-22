import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { BarChart3, PieChart, LineChart, Download, Calendar, Filter, RefreshCw } from 'lucide-react';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

interface StatCard {
  title: string;
  value: string | number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
}

const AdminReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '12m'>('30d');
  const [statCards, setStatCards] = useState<StatCard[]>([]);
  const [adsChartData, setAdsChartData] = useState<ChartData | null>(null);
  const [usersChartData, setUsersChartData] = useState<ChartData | null>(null);
  const [categoryDistribution, setCategoryDistribution] = useState<ChartData | null>(null);
  const [revenueData, setRevenueData] = useState<ChartData | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch data for stat cards
      await fetchStatCards();
      
      // Fetch data for charts
      await Promise.all([
        fetchAdsChartData(),
        fetchUsersChartData(),
        fetchCategoryDistribution(),
        fetchRevenueData()
      ]);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Erro ao carregar dados do dashboard');
      setLoading(false);
    }
  };

  const fetchStatCards = async () => {
    try {
      // In a real app, these would be actual database queries
      // For now, we'll use mock data
      
      // Get total users
      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (usersError) throw usersError;
      
      // Get new users in period
      const periodStart = getPeriodStartDate();
      const { count: newUsers, error: newUsersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', periodStart.toISOString());
      
      if (newUsersError) throw newUsersError;
      
      // Get total ads
      const { count: totalAds, error: adsError } = await supabase
        .from('ads')
        .select('*', { count: 'exact', head: true });
      
      if (adsError) throw adsError;
      
      // Get new ads in period
      const { count: newAds, error: newAdsError } = await supabase
        .from('ads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', periodStart.toISOString());
      
      if (newAdsError) throw newAdsError;
      
      // Calculate previous period for comparison
      const previousPeriodStart = new Date(periodStart);
      const previousPeriodEnd = new Date(periodStart);
      
      switch (dateRange) {
        case '7d':
          previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
          break;
        case '30d':
          previousPeriodStart.setDate(previousPeriodStart.getDate() - 30);
          break;
        case '90d':
          previousPeriodStart.setDate(previousPeriodStart.getDate() - 90);
          break;
        case '12m':
          previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 12);
          break;
      }
      
      // Get previous period new users for comparison
      const { count: prevPeriodUsers, error: prevUsersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', periodStart.toISOString());
      
      if (prevUsersError) throw prevUsersError;
      
      // Get previous period new ads for comparison
      const { count: prevPeriodAds, error: prevAdsError } = await supabase
        .from('ads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', periodStart.toISOString());
      
      if (prevAdsError) throw prevAdsError;
      
      // Calculate percentage changes
      const userChange = prevPeriodUsers ? ((newUsers - prevPeriodUsers) / prevPeriodUsers) * 100 : 0;
      const adChange = prevPeriodAds ? ((newAds - prevPeriodAds) / prevPeriodAds) * 100 : 0;
      
      // Mock revenue data for now
      const currentRevenue = 5840;
      const prevRevenue = 4320;
      const revenueChange = ((currentRevenue - prevRevenue) / prevRevenue) * 100;
      
      // Mock conversion rate
      const currentConversion = 2.8;
      const prevConversion = 2.4;
      const conversionChange = ((currentConversion - prevConversion) / prevConversion) * 100;
      
      setStatCards([
        {
          title: 'Novos Usuários',
          value: newUsers || 0,
          change: parseFloat(userChange.toFixed(1)),
          changeType: userChange > 0 ? 'positive' : userChange < 0 ? 'negative' : 'neutral',
          icon: <BarChart3 size={24} className="text-blue-500" />
        },
        {
          title: 'Novos Anúncios',
          value: newAds || 0,
          change: parseFloat(adChange.toFixed(1)),
          changeType: adChange > 0 ? 'positive' : adChange < 0 ? 'negative' : 'neutral',
          icon: <LineChart size={24} className="text-green-500" />
        },
        {
          title: 'Receita',
          value: `R$ ${currentRevenue.toLocaleString('pt-BR')}`,
          change: parseFloat(revenueChange.toFixed(1)),
          changeType: revenueChange > 0 ? 'positive' : revenueChange < 0 ? 'negative' : 'neutral',
          icon: <BarChart3 size={24} className="text-purple-500" />
        },
        {
          title: 'Taxa de Conversão',
          value: `${currentConversion}%`,
          change: parseFloat(conversionChange.toFixed(1)),
          changeType: conversionChange > 0 ? 'positive' : conversionChange < 0 ? 'negative' : 'neutral',
          icon: <PieChart size={24} className="text-orange-500" />
        }
      ]);
    } catch (error) {
      console.error('Error fetching stat cards:', error);
      toast.error('Erro ao carregar estatísticas');
    }
  };

  const fetchAdsChartData = async () => {
    try {
      const periodStart = getPeriodStartDate();
      const labels = generateTimeLabels();
      
      // In a real app, you would aggregate this data in the database
      // For now, we'll generate some mock data based on the date range
      const data = [];
      for (let i = 0; i < labels.length; i++) {
        // Generate some random but somewhat realistic data
        data.push(Math.floor(Math.random() * 20) + 5);
      }
      
      setAdsChartData({
        labels,
        datasets: [
          {
            label: 'Novos Anúncios',
            data,
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 2
          }
        ]
      });
    } catch (error) {
      console.error('Error fetching ads chart data:', error);
    }
  };

  const fetchUsersChartData = async () => {
    try {
      const labels = generateTimeLabels();
      
      // Mock data for users chart
      const newUsersData = [];
      const activeUsersData = [];
      
      for (let i = 0; i < labels.length; i++) {
        newUsersData.push(Math.floor(Math.random() * 15) + 2);
        activeUsersData.push(Math.floor(Math.random() * 50) + 20);
      }
      
      setUsersChartData({
        labels,
        datasets: [
          {
            label: 'Novos Usuários',
            data: newUsersData,
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2
          },
          {
            label: 'Usuários Ativos',
            data: activeUsersData,
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            borderColor: 'rgba(99, 102, 241, 1)',
            borderWidth: 2
          }
        ]
      });
    } catch (error) {
      console.error('Error fetching users chart data:', error);
    }
  };

  const fetchCategoryDistribution = async () => {
    try {
      // In a real app, you would fetch this from the database
      // For now, we'll use mock data
      const categories = [
        'Imóveis',
        'Veículos',
        'Eletrônicos',
        'Móveis',
        'Serviços',
        'Outros'
      ];
      
      const data = [25, 18, 15, 12, 20, 10];
      
      const backgroundColors = [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)'
      ];
      
      setCategoryDistribution({
        labels: categories,
        datasets: [
          {
            label: 'Distribuição por Categoria',
            data,
            backgroundColor: backgroundColors,
            borderWidth: 1
          }
        ]
      });
    } catch (error) {
      console.error('Error fetching category distribution:', error);
    }
  };

  const fetchRevenueData = async () => {
    try {
      const labels = generateTimeLabels();
      
      // Mock data for revenue
      const revenueData = [];
      
      for (let i = 0; i < labels.length; i++) {
        revenueData.push(Math.floor(Math.random() * 2000) + 500);
      }
      
      setRevenueData({
        labels,
        datasets: [
          {
            label: 'Receita (R$)',
            data: revenueData,
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            borderColor: 'rgba(139, 92, 246, 1)',
            borderWidth: 2
          }
        ]
      });
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    }
  };

  const getPeriodStartDate = (): Date => {
    const now = new Date();
    const periodStart = new Date(now);
    
    switch (dateRange) {
      case '7d':
        periodStart.setDate(now.getDate() - 7);
        break;
      case '30d':
        periodStart.setDate(now.getDate() - 30);
        break;
      case '90d':
        periodStart.setDate(now.getDate() - 90);
        break;
      case '12m':
        periodStart.setMonth(now.getMonth() - 12);
        break;
    }
    
    return periodStart;
  };

  const generateTimeLabels = (): string[] => {
    const labels = [];
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {};
    
    switch (dateRange) {
      case '7d':
        options.weekday = 'short';
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(now.getDate() - i);
          labels.push(date.toLocaleDateString('pt-BR', options));
        }
        break;
      
      case '30d':
        for (let i = 29; i >= 0; i -= 3) {
          const date = new Date(now);
          date.setDate(now.getDate() - i);
          labels.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
        }
        break;
      
      case '90d':
        for (let i = 90; i >= 0; i -= 10) {
          const date = new Date(now);
          date.setDate(now.getDate() - i);
          labels.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
        }
        break;
      
      case '12m':
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(now.getMonth() - i);
          labels.push(date.toLocaleDateString('pt-BR', { month: 'short' }));
        }
        break;
    }
    
    return labels;
  };

  const handleRefresh = () => {
    fetchDashboardData();
    toast.success('Dados atualizados');
  };

  const handleExportCSV = () => {
    // In a real app, this would generate and download a CSV file
    toast.success('Relatório exportado com sucesso');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios e Estatísticas</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm flex items-center hover:bg-gray-50"
          >
            <RefreshCw size={16} className="mr-1" />
            Atualizar
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm flex items-center hover:bg-gray-50"
          >
            <Download size={16} className="mr-1" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center">
          <Calendar size={18} className="text-gray-400 mr-2" />
          <span className="text-sm text-gray-500 mr-4">Período:</span>
          <div className="flex space-x-1">
            <button
              onClick={() => setDateRange('7d')}
              className={`px-3 py-1 text-sm rounded-md ${dateRange === '7d' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              7 dias
            </button>
            <button
              onClick={() => setDateRange('30d')}
              className={`px-3 py-1 text-sm rounded-md ${dateRange === '30d' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              30 dias
            </button>
            <button
              onClick={() => setDateRange('90d')}
              className={`px-3 py-1 text-sm rounded-md ${dateRange === '90d' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              90 dias
            </button>
            <button
              onClick={() => setDateRange('12m')}
              className={`px-3 py-1 text-sm rounded-md ${dateRange === '12m' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              12 meses
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{card.title}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                  </div>
                  <div className="p-2 rounded-full bg-gray-50">
                    {card.icon}
                  </div>
                </div>
                <div className="mt-2">
                  <span className={`text-xs font-medium ${card.changeType === 'positive' ? 'text-green-600' : card.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'}`}>
                    {card.change > 0 ? '+' : ''}{card.change}%
                  </span>
                  <span className="text-xs text-gray-500 ml-1">vs. período anterior</span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Users Chart */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-medium mb-4">Usuários</h2>
              <div className="h-64">
                {/* In a real app, you would render a chart library component here */}
                <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Gráfico de Usuários</p>
                </div>
              </div>
            </div>

            {/* Ads Chart */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-medium mb-4">Anúncios</h2>
              <div className="h-64">
                {/* In a real app, you would render a chart library component here */}
                <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Gráfico de Anúncios</p>
                </div>
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-medium mb-4">Distribuição por Categoria</h2>
              <div className="h-64">
                {/* In a real app, you would render a chart library component here */}
                <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Gráfico de Distribuição por Categoria</p>
                </div>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-medium mb-4">Receita</h2>
              <div className="h-64">
                {/* In a real app, you would render a chart library component here */}
                <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Gráfico de Receita</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium mb-4">Métricas Detalhadas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Top Categorias</h3>
                <ul className="space-y-2">
                  <li className="flex items-center justify-between">
                    <span className="text-sm">Imóveis</span>
                    <span className="text-sm font-medium">25%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-sm">Veículos</span>
                    <span className="text-sm font-medium">18%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-sm">Eletrônicos</span>
                    <span className="text-sm font-medium">15%</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Retenção de Usuários</h3>
                <ul className="space-y-2">
                  <li className="flex items-center justify-between">
                    <span className="text-sm">Após 7 dias</span>
                    <span className="text-sm font-medium">68%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-sm">Após 30 dias</span>
                    <span className="text-sm font-medium">42%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-sm">Após 90 dias</span>
                    <span className="text-sm font-medium">28%</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Conversão por Canal</h3>
                <ul className="space-y-2">
                  <li className="flex items-center justify-between">
                    <span className="text-sm">Orgânico</span>
                    <span className="text-sm font-medium">3.2%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-sm">Redes Sociais</span>
                    <span className="text-sm font-medium">2.8%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-sm">Referência</span>
                    <span className="text-sm font-medium">4.1%</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReportsPage;