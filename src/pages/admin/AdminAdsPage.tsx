import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { Eye, Edit, Trash2, CheckCircle, XCircle, Filter, Search, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Ad {
  id: string;
  title: string;
  price: number;
  status: 'pending' | 'active' | 'expired' | 'rejected';
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  category: {
    id: string;
    name: string;
  };
  views: number;
  reports_count?: number;
}

const AdminAdsPage: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [selectedAds, setSelectedAds] = useState<string[]>([]);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAds();
  }, [statusFilter, sortBy, sortOrder]);

  const fetchAds = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('ads')
        .select(`
          id, 
          title, 
          price, 
          status, 
          created_at, 
          views,
          user:user_id (id, name, email),
          category:category_id (id, name)
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch report counts for each ad
      const adsWithReports = await Promise.all(
        (data || []).map(async (ad) => {
          const { count, error: reportError } = await supabase
            .from('reports')
            .select('id', { count: 'exact', head: true })
            .eq('ad_id', ad.id);

          return {
            ...ad,
            reports_count: count || 0
          };
        })
      );

      setAds(adsWithReports);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast.error('Erro ao carregar anúncios');
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter ads locally based on search query
    // In a real app, you might want to do this server-side
  };

  const handleStatusChange = async (adId: string, newStatus: 'pending' | 'active' | 'expired' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('ads')
        .update({ status: newStatus })
        .eq('id', adId);

      if (error) throw error;

      setAds(ads.map(ad => ad.id === adId ? { ...ad, status: newStatus } : ad));
      toast.success(`Status do anúncio alterado para ${newStatus}`);
    } catch (error) {
      console.error('Error updating ad status:', error);
      toast.error('Erro ao atualizar status do anúncio');
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
      toast.success('Anúncio excluído com sucesso');
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast.error('Erro ao excluir anúncio');
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (selectedAds.length === 0) return;

    if (action === 'delete' && !confirm(`Tem certeza que deseja excluir ${selectedAds.length} anúncios? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      if (action === 'delete') {
        const { error } = await supabase
          .from('ads')
          .delete()
          .in('id', selectedAds);

        if (error) throw error;

        setAds(ads.filter(ad => !selectedAds.includes(ad.id)));
        toast.success(`${selectedAds.length} anúncios excluídos com sucesso`);
      } else {
        const newStatus = action === 'approve' ? 'active' : 'rejected';
        const { error } = await supabase
          .from('ads')
          .update({ status: newStatus })
          .in('id', selectedAds);

        if (error) throw error;

        setAds(ads.map(ad => selectedAds.includes(ad.id) ? { ...ad, status: newStatus as any } : ad));
        toast.success(`${selectedAds.length} anúncios ${action === 'approve' ? 'aprovados' : 'rejeitados'} com sucesso`);
      }

      setSelectedAds([]);
    } catch (error) {
      console.error(`Error performing bulk action ${action}:`, error);
      toast.error(`Erro ao ${action === 'approve' ? 'aprovar' : action === 'reject' ? 'rejeitar' : 'excluir'} anúncios`);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedAds(ads.map(ad => ad.id));
    } else {
      setSelectedAds([]);
    }
  };

  const handleSelectAd = (adId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedAds([...selectedAds, adId]);
    } else {
      setSelectedAds(selectedAds.filter(id => id !== adId));
    }
  };

  const filteredAds = searchQuery
    ? ads.filter(ad => 
        ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad.user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : ads;

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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'pending':
        return 'Pendente';
      case 'expired':
        return 'Expirado';
      case 'rejected':
        return 'Rejeitado';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Anúncios</h1>
        <div className="flex items-center space-x-2">
          {selectedAds.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('approve')}
                className="bg-green-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
              >
                <CheckCircle size={16} className="mr-1" />
                Aprovar ({selectedAds.length})
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="bg-red-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
              >
                <XCircle size={16} className="mr-1" />
                Rejeitar ({selectedAds.length})
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="bg-gray-800 text-white px-3 py-1 rounded-md text-sm flex items-center"
              >
                <Trash2 size={16} className="mr-1" />
                Excluir ({selectedAds.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter size={18} className="text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativos</option>
                <option value="pending">Pendentes</option>
                <option value="expired">Expirados</option>
                <option value="rejected">Rejeitados</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 text-sm">Ordenar por:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="created_at">Data de criação</option>
                <option value="price">Preço</option>
                <option value="views">Visualizações</option>
                <option value="title">Título</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="desc">Decrescente</option>
                <option value="asc">Crescente</option>
              </select>
            </div>
          </div>
          <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Buscar por título, usuário ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </form>
        </div>
      </div>

      {/* Ads Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : filteredAds.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileText size={48} className="mb-4 opacity-20" />
            <p>Nenhum anúncio encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedAds.length === ads.length && ads.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Anúncio
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Métricas
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAds.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedAds.includes(ad.id)}
                        onChange={(e) => handleSelectAd(ad.id, e.target.checked)}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 line-clamp-1">{ad.title}</div>
                          <div className="text-sm text-gray-500">{ad.category.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{ad.user.name}</div>
                      <div className="text-sm text-gray-500">{ad.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(ad.price)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(ad.status)}`}>
                        {getStatusText(ad.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(ad.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Eye size={14} className="mr-1" />
                          {ad.views}
                        </div>
                        {ad.reports_count > 0 && (
                          <div className="flex items-center text-red-600">
                            <AlertTriangle size={14} className="mr-1" />
                            {ad.reports_count}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => setShowActionMenu(showActionMenu === ad.id ? null : ad.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MoreHorizontal size={20} />
                        </button>
                        
                        {showActionMenu === ad.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  navigate(`/ads/${ad.id}`);
                                  setShowActionMenu(null);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                <Eye size={16} className="mr-2" />
                                Ver anúncio
                              </button>
                              {ad.status !== 'active' && (
                                <button
                                  onClick={() => {
                                    handleStatusChange(ad.id, 'active');
                                    setShowActionMenu(null);
                                  }}
                                  className="flex items-center px-4 py-2 text-sm text-green-700 hover:bg-gray-100 w-full text-left"
                                >
                                  <CheckCircle size={16} className="mr-2" />
                                  Aprovar
                                </button>
                              )}
                              {ad.status !== 'rejected' && (
                                <button
                                  onClick={() => {
                                    handleStatusChange(ad.id, 'rejected');
                                    setShowActionMenu(null);
                                  }}
                                  className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-gray-100 w-full text-left"
                                >
                                  <XCircle size={16} className="mr-2" />
                                  Rejeitar
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  handleDeleteAd(ad.id);
                                  setShowActionMenu(null);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                <Trash2 size={16} className="mr-2" />
                                Excluir
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAdsPage;