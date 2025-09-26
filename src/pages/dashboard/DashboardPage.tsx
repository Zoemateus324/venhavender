import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { PlusCircle, AlertCircle, TrendingUp, Package, DollarSign } from 'lucide-react';

interface Ad {
  id: string;
  title: string;
  status: string;
  views: number;
  created_at: string;
  expires_at: string;
}

interface Message {
  id: string;
  sender_name: string;
  ad_title: string;
  created_at: string;
  read: boolean;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeAds, setActiveAds] = useState<number>(0);
  const [totalViews, setTotalViews] = useState<number>(0);
  const [recentAds, setRecentAds] = useState<Ad[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Fetch active ads count
        const { data: adsData, error: adsError } = await supabase
          .from('ads')
          .select('id, title, status, views, created_at, expires_at')
          .eq('user_id', user.id)
          .eq('status', 'active');

        if (adsError) throw adsError;

        // Fetch recent ads
        const { data: recentAdsData, error: recentAdsError } = await supabase
          .from('ads')
          .select('id, title, status, views, created_at, expires_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentAdsError) throw recentAdsError;

        // Fetch unread messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`
            id, 
            created_at,
            read,
            sender:sender_id(name),
            ad:ad_id(title)
          `)
          .eq('receiver_id', user.id)
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(5);

        if (messagesError) throw messagesError;

        // Calculate total views
        const views = adsData?.reduce((sum, ad) => sum + (ad.views || 0), 0) || 0;

        setActiveAds(adsData?.length || 0);
        setTotalViews(views);
        setRecentAds(recentAdsData || []);
        
        // Format messages data
        const formattedMessages = messagesData?.map((msg: any) => ({
          id: msg.id,
          sender_name: msg.sender?.name || 'Usuário',
          ad_title: msg.ad?.title || 'Anúncio',
          created_at: msg.created_at,
          read: msg.read
        })) || [];
        
        setUnreadMessages(formattedMessages);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Anúncios Ativos</p>
              <h3 className="text-2xl font-bold">{activeAds}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Visualizações Totais</p>
              <h3 className="text-2xl font-bold">{totalViews}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Plano Atual</p>
              <h3 className="text-2xl font-bold capitalize">{user?.plan_type || 'Gratuito'}</h3>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h2 className="text-lg font-semibold mb-4">Ações Rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/dashboard/ads/create" className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors">
            <PlusCircle size={18} className="mr-2" /> Criar Anúncio
          </Link>
          <Link to="/dashboard/settings" className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 hover:text-orange-600 active:text-orange-600 focus:text-orange-600 transition-colors">
            Atualizar Perfil
          </Link>
          <Link to="/dashboard/messages" className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 hover:text-orange-600 active:text-orange-600 focus:text-orange-600 transition-colors">
            Ver Mensagens {unreadMessages.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadMessages.length}
              </span>
            )}
          </Link>
          <Link to="/dashboard/payments" className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 hover:text-orange-600 active:text-orange-600 focus:text-orange-600 transition-colors">
            Gerenciar Plano
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Ads */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Anúncios Recentes</h2>
          {recentAds.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm font-medium text-gray-500">Título</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-500">Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAds.map((ad) => (
                    <tr key={ad.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 text-sm">
                        <Link to={`/dashboard/ads/${ad.id}`} className="text-primary hover:underline">
                          {ad.title}
                        </Link>
                      </td>
                      <td className="py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${ad.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {ad.status === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-500">{formatDate(ad.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Você ainda não tem anúncios</p>
              <Link to="/dashboard/ads/create" className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors">
                <PlusCircle size={18} className="mr-2" /> Criar Anúncio
              </Link>
            </div>
          )}
          {recentAds.length > 0 && (
            <div className="mt-4 text-right">
              <Link to="/dashboard/ads" className="text-primary hover:underline text-sm">
                Ver todos os anúncios
              </Link>
            </div>
          )}
        </div>
        
        {/* Unread Messages */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Mensagens Não Lidas</h2>
          {unreadMessages.length > 0 ? (
            <div className="space-y-4">
              {unreadMessages.map((message) => (
                <div key={message.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <Link to={`/dashboard/messages/${message.id}`} className="block">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{message.sender_name}</p>
                        <p className="text-sm text-gray-500">Sobre: {message.ad_title}</p>
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(message.created_at)}</span>
                    </div>
                  </Link>
                </div>
              ))}
              <div className="mt-4 text-right">
                <Link to="/dashboard/messages" className="text-primary hover:underline text-sm">
                  Ver todas as mensagens
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <AlertCircle size={40} className="text-gray-400" />
              </div>
              <p className="text-gray-500">Nenhuma mensagem não lida</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;