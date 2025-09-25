import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';
import { PlusCircle, Edit, Copy, Trash, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  views: number;
  created_at: string;
  expires_at: string;
  images: string[];
  category: string;
}

const AdsListPage: React.FC = () => {
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchAds();
  }, [user, filter]);

  const fetchAds = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('ads')
        .select('*')
        .eq('user_id', user.id);

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error('Erro ao carregar anúncios:', error);
      toast.error('Erro ao carregar seus anúncios.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (adId: string, newStatus: 'active' | 'pending' | 'expired' | 'rejected' | 'paused') => {
    try {
      const { error } = await supabase
        .from('ads')
        .update({ status: newStatus })
        .eq('id', adId);

      if (error) throw error;

      setAds(ads.map(ad => {
        if (ad.id === adId) {
          return { ...ad, status: newStatus };
        }
        return ad;
      }));

      toast.success(`Anúncio ${newStatus === 'active' ? 'ativado' : 'em análise'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao atualizar status do anúncio:', error);
      toast.error('Erro ao atualizar o anúncio.');
    }
  };

  const handleDuplicateAd = async (ad: Ad) => {
    try {
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const original: any = ad as any;
      const photos: string[] = Array.isArray(original.photos) ? original.photos : [];

      const insertPayload = {
        user_id: user?.id,
        category_id: original.category_id || null,
        type: original.type || 'grid',
        title: `${ad.title} (Cópia)`,
        description: original.description || '',
        price: original.price || 0,
        photos,
        location: original.location || '',
        contact_info: original.contact_info || {},
        plan_id: original.plan_id || null,
        end_date: (original.end_date as string) || endDate.toISOString(),
        status: 'pending',
        max_exposures: original.max_exposures || 0,
        admin_approved: false,
        start_date: original.start_date || now.toISOString(),
      };

      const { error } = await supabase.from('ads').insert([insertPayload]);
      if (error) throw error;

      toast.success('Anúncio duplicado com sucesso!');
      fetchAds();
    } catch (error) {
      console.error('Erro ao duplicar anúncio:', error);
      toast.error('Erro ao duplicar o anúncio.');
    }
  };

  const handleDeleteAd = async (adId: string) => {
    if (!confirm('Tem certeza que deseja excluir este anúncio? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', adId);

      if (error) throw error;

      setAds(ads.filter(ad => ad.id !== adId));
      toast.success('Anúncio excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir anúncio:', error);
      toast.error('Erro ao excluir o anúncio.');
    }
  };

  const handleRenewAd = async (adId: string) => {
    try {
      // Calculate new expiration date (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      const { error } = await supabase
        .from('ads')
        .update({ 
          expires_at: expiresAt.toISOString(),
          status: 'active'
        })
        .eq('id', adId);

      if (error) throw error;

      setAds(ads.map(ad => {
        if (ad.id === adId) {
          return { ...ad, expires_at: expiresAt.toISOString(), status: 'active' };
        }
        return ad;
      }));

      toast.success('Anúncio renovado por mais 30 dias!');
    } catch (error) {
      console.error('Erro ao renovar anúncio:', error);
      toast.error('Erro ao renovar o anúncio.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Ativo</span>;
      case 'pending':
        return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Em análise</span>;
      case 'expired':
        return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Expirado</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Meus Anúncios</h1>
        <Link to="/create-ad" className="inline-flex items-center px-3 sm:px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors w-full sm:w-auto justify-center">
          <PlusCircle size={18} className="mr-2" /> Criar Anúncio
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm ${filter === 'all' ? 'bg-primary text-white' : 'bg-white border border-gray-300 text-gray-700'}`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-md text-sm ${filter === 'active' ? 'bg-primary text-white' : 'bg-white border border-gray-300 text-gray-700'}`}
          >
            Ativos
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md text-sm ${filter === 'pending' ? 'bg-primary text-white' : 'bg-white border border-gray-300 text-gray-700'}`}
          >
            Em análise
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-4 py-2 rounded-md text-sm ${filter === 'expired' ? 'bg-primary text-white' : 'bg-white border border-gray-300 text-gray-700'}`}
          >
            Expirados
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : ads.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Anúncio
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visualizações
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expira em
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {Array.isArray((ad as any).photos) && (ad as any).photos.length > 0 ? (
                            <img className="h-10 w-10 rounded-md object-cover" src={(ad as any).photos[0]} alt={ad.title} />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center text-gray-500">
                              <span className="text-xs">Sem imagem</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            <Link to={`/dashboard/ads/${ad.id}`} className="hover:text-primary">
                              {ad.title}
                            </Link>
                          </div>
                          <div className="text-sm text-gray-500">
                            {ad.category}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(ad.status)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-500">
                      {formatCurrency(ad.price)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-500">
                      {ad.views || 0}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-500">
                      {isExpired(ad.expires_at) ? (
                        <span className="text-red-500">Expirado</span>
                      ) : (
                        formatDate(ad.expires_at)
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link 
                          to={`/ads/${ad.id}`}
                          className="text-gray-600 hover:text-gray-900"
                          title="Visualizar"
                        >
                          <Eye size={18} />
                        </Link>
                        <Link 
                          to={`/dashboard/ads/${ad.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDuplicateAd(ad)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Duplicar"
                        >
                          <Copy size={18} />
                        </button>
                        {ad.status === 'active' ? (
                          <button
                            onClick={() => handleStatusChange(ad.id, 'paused')}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Pausar"
                          >
                            <EyeOff size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(ad.id, 'active')}
                            className="text-green-600 hover:text-green-900"
                            title="Ativar"
                          >
                            <Eye size={18} />
                          </button>
                        )}
                        {isExpired(ad.expires_at) && (
                          <button
                            onClick={() => handleRenewAd(ad.id)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Renovar"
                          >
                            <RefreshCw size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAd(ad.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500 mb-4">Você ainda não tem anúncios {filter !== 'all' ? `com status "${filter}"` : ''}.</p>
          <Link to="/create-ad" className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors">
            <PlusCircle size={18} className="mr-2" /> Criar Anúncio
          </Link>
        </div>
      )}
    </div>
  );
};

export default AdsListPage;