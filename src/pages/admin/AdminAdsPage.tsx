import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { Eye, Edit, Trash2, CheckCircle, XCircle, Filter, Search, MoreHorizontal, AlertTriangle, FileText, Upload, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  status: 'pending' | 'active' | 'expired' | 'rejected';
  created_at: string;
  user_id: string;
  category_id: string;
  photos: string[];
  user?: {
    id: string;
    name: string;
    email: string;
  };
  category?: {
    id: string;
    name: string;
  };
  views: number;
  reports_count?: number;
}

const AdminAdsPage: React.FC = () => {
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [userFilter, setUserFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [selectedAds, setSelectedAds] = useState<string[]>([]);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; email: string }[]>([]);
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;
  const [total, setTotal] = useState<number>(0);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    price: 0,
    category_id: '',
    status: 'active'
  });
  const [editPhotos, setEditPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchAds();
  }, [statusFilter, categoryFilter, userFilter, sortBy, sortOrder, page, searchQuery]);

  useEffect(() => {
    fetchCategories();
    fetchUsers();
    // aplica filtro inicial vindo da query string, ex: /admin/ads?status=pending
    const initialStatus = (searchParams.get('status') || '').toLowerCase();
    if (['all', 'active', 'pending', 'expired', 'rejected'].includes(initialStatus)) {
      setStatusFilter(initialStatus);
      setPage(1);
    }
  }, []);

  const fetchAds = async () => {
    try {
      setLoading(true);
      // Count first
      let countQuery = supabase
        .from('ads')
        .select('id', { count: 'exact', head: true });

      if (statusFilter !== 'all') countQuery = countQuery.eq('status', statusFilter);
      if (categoryFilter) countQuery = countQuery.eq('category_id', categoryFilter);
      if (userFilter) countQuery = countQuery.eq('user_id', userFilter);
      if (searchQuery) countQuery = countQuery.ilike('title', `%${searchQuery}%`);

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;
      setTotal(count || 0);

      // Data query with range
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      let query = supabase
        .from('ads')
        .select(`
          id,
          title,
          description,
          price,
          status,
          created_at,
          views,
          user_id,
          category_id,
          photos,
          user:user_id (id, name, email),
          category:category_id (id, name)
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(from, to);

      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (categoryFilter) query = query.eq('category_id', categoryFilter);
      if (userFilter) query = query.eq('user_id', userFilter);
      if (searchQuery) query = query.ilike('title', `%${searchQuery}%`);

      const { data, error } = await query;

      if (error) throw error;


      // Fetch report counts for each ad
      const adsWithReports = await Promise.all(
        (data || []).map(async (ad) => {
          try {
            const { count, error: reportError } = await supabase
              .from('reports')
              .select('id', { count: 'exact', head: true })
              .eq('ad_id', ad.id);
            if (reportError) throw reportError;
            return { ...ad, reports_count: count || 0 };
          } catch (_) {
            return { ...ad, reports_count: 0 };
          }
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

  const fetchCategories = async () => {
    try {
      const { data } = await supabase.from('categories').select('id, name').order('name');
      setCategories(data || []);
    } catch (error) {
      // ignore
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await supabase.from('users').select('id, email').order('email');
      setUsers(data || []);
    } catch (error) {
      // ignore
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAds();
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

  const handleEditAd = (ad: Ad) => {
    setEditingAd(ad);
    setEditFormData({
      title: ad.title,
      description: ad.description,
      price: ad.price,
      category_id: ad.category_id,
      status: ad.status
    });
    setEditPhotos(ad.photos || []);
    setShowEditModal(true);
    setShowActionMenu(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAd) return;

    try {
      const { error } = await supabase
        .from('ads')
        .update({
          title: editFormData.title,
          description: editFormData.description,
          price: editFormData.price,
          category_id: editFormData.category_id,
          status: editFormData.status,
          photos: editPhotos
        })
        .eq('id', editingAd.id);

      if (error) throw error;
      toast.success('Anúncio atualizado com sucesso!');
      setShowEditModal(false);
      setEditingAd(null);
      fetchAds();
    } catch (error) {
      console.error('Erro ao atualizar anúncio:', error);
      toast.error('Erro ao atualizar anúncio.');
    }
  };

  const handleImageUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    const newPhotos: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `ads/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('ad-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('ad-images')
          .getPublicUrl(filePath);

        newPhotos.push(data.publicUrl);
      }

      setEditPhotos([...editPhotos, ...newPhotos]);
      toast.success('Imagens adicionadas com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload das imagens:', error);
      toast.error('Erro ao fazer upload das imagens.');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setEditPhotos(editPhotos.filter((_, i) => i !== index));
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
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Todas as categorias</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={userFilter}
                onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Todos os usuários</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.email}</option>
                ))}
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
                      <div className="text-sm text-gray-500">{ad.category?.name || 'Sem categoria'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{ad.user?.name || '—'}</div>
                      <div className="text-sm text-gray-500">{ad.user?.email || ''}</div>
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
                              {(ad.user_id === user?.id || user?.role === 'admin') && (
                                <button
                                  onClick={() => handleEditAd(ad)}
                                  className="flex items-center px-4 py-2 text-sm text-blue-700 hover:bg-gray-100 w-full text-left"
                                >
                                  <Edit size={16} className="mr-2" />
                                  Editar anúncio
                                </button>
                              )}
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
            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 text-sm text-gray-600">
              <div>
                Página {page} de {Math.max(1, Math.ceil(total / pageSize))} — {total} registros
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`px-3 py-1 rounded border ${page === 1 ? 'text-gray-300 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => (p < Math.ceil(total / pageSize) ? p + 1 : p))}
                  disabled={page >= Math.ceil(total / pageSize)}
                  className={`px-3 py-1 rounded border ${page >= Math.ceil(total / pageSize) ? 'text-gray-300 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingAd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Editar Anúncio</h2>
            
            <form onSubmit={handleSaveEdit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                  <input 
                    type="text"
                    value={editFormData.title} 
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" 
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$) *</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={editFormData.price} 
                    onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" 
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                  <select 
                    value={editFormData.category_id} 
                    onChange={(e) => setEditFormData({ ...editFormData, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select 
                    value={editFormData.status} 
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="active">Ativo</option>
                    <option value="pending">Pendente</option>
                    <option value="rejected">Rejeitado</option>
                    <option value="expired">Expirado</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
                  <input 
                    type="text"
                    value={editFormData.location} 
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Cidade, Estado"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone de Contato</label>
                  <input 
                    type="tel"
                    value={editFormData.contact_phone} 
                    onChange={(e) => setEditFormData({ ...editFormData, contact_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email de Contato</label>
                  <input 
                    type="email"
                    value={editFormData.contact_email} 
                    onChange={(e) => setEditFormData({ ...editFormData, contact_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="seu@email.com"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                  <textarea 
                    rows={4}
                    value={editFormData.description} 
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" 
                    required
                    placeholder="Descreva detalhadamente o que você está vendendo..."
                  />
                </div>
              </div>

              {/* Seção de Imagens */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Imagens do Anúncio</h3>
                
                {/* Upload de Imagens */}
                <div className="mb-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center justify-center py-4"
                    >
                      <Upload size={32} className="text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        {uploading ? 'Fazendo upload...' : 'Clique para adicionar imagens'}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        PNG, JPG, WEBP até 10MB cada
                      </span>
                    </label>
                  </div>
                </div>

                {/* Preview das Imagens */}
                {editPhotos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {editPhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button 
                  type="button" 
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingAd(null);
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAdsPage;