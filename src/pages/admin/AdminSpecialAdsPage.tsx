import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, Eye, Calendar, DollarSign, Users, Upload, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SpecialAd {
  id: string;
  title: string;
  description: string;
  price: number;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  expires_at: string;
  image_url: string;
  created_by: string;
  created_by_user?: {
    name: string;
    email: string;
  };
  views: number;
  clicks: number;
}

const AdminSpecialAdsPage: React.FC = () => {
  const { user } = useAuth();
  const [specialAds, setSpecialAds] = useState<SpecialAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAd, setEditingAd] = useState<SpecialAd | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    status: 'active' as 'active' | 'inactive' | 'pending',
    expires_at: ''
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSpecialAds();
  }, []);

  const fetchSpecialAds = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('special_ads')
        .select(`
          *,
          created_by_user:created_by(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSpecialAds(data || []);
    } catch (error) {
      console.error('Erro ao carregar anúncios especiais:', error);
      toast.error('Erro ao carregar anúncios especiais.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const file = files[0]; // Apenas uma imagem para anúncios especiais
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `ads_especiais/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('ads_especiais')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('ads_especiais')
        .getPublicUrl(filePath);

      setPhotos([data.publicUrl]); // Apenas uma imagem
      toast.success('Imagem carregada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast.error('Erro ao fazer upload da imagem.');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAd) {
        // Update existing ad
        const { error } = await supabase
          .from('special_ads')
          .update({
            title: formData.title,
            description: formData.description,
            price: formData.price,
            status: formData.status,
            expires_at: formData.expires_at,
            image_url: photos[0] || null
          })
          .eq('id', editingAd.id);

        if (error) throw error;
        toast.success('Anúncio especial atualizado com sucesso!');
      } else {
        // Create new ad
        const { error } = await supabase
          .from('special_ads')
          .insert([{
            title: formData.title,
            description: formData.description,
            price: formData.price,
            status: formData.status,
            expires_at: formData.expires_at,
            image_url: photos[0] || null,
            created_by: user?.id
          }]);

        if (error) throw error;
        toast.success('Anúncio especial criado com sucesso!');
      }

      setShowCreateModal(false);
      setEditingAd(null);
      setFormData({ title: '', description: '', price: 0, status: 'active', expires_at: '' });
      setPhotos([]);
      fetchSpecialAds();
    } catch (error) {
      console.error('Erro ao salvar anúncio especial:', error);
      toast.error('Erro ao salvar anúncio especial.');
    }
  };

  const handleEdit = (ad: SpecialAd) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description,
      price: ad.price,
      status: ad.status,
      expires_at: ad.expires_at ? ad.expires_at.split('T')[0] : ''
    });
    setPhotos(ad.image_url ? [ad.image_url] : []);
    setShowCreateModal(true);
  };

  const handleDelete = async (adId: string) => {
    if (!confirm('Tem certeza que deseja excluir este anúncio especial?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('special_ads')
        .delete()
        .eq('id', adId);

      if (error) throw error;
      toast.success('Anúncio especial excluído com sucesso!');
      fetchSpecialAds();
    } catch (error) {
      console.error('Erro ao excluir anúncio especial:', error);
      toast.error('Erro ao excluir anúncio especial.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
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
      case 'inactive':
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">Inativo</span>;
      case 'pending':
        return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Pendente</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Anúncios Especiais</h1>
          <p className="text-gray-600">Gerencie anúncios de rodapé e outros anúncios especiais</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Criar Anúncio Especial
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <Eye size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de Anúncios</p>
              <h3 className="text-2xl font-bold">{specialAds.length}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Anúncios Ativos</p>
              <h3 className="text-2xl font-bold">{specialAds.filter(ad => ad.status === 'active').length}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Receita Total</p>
              <h3 className="text-2xl font-bold">
                {formatCurrency(specialAds.reduce((sum, ad) => sum + ad.price, 0))}
              </h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Visualizações</p>
              <h3 className="text-2xl font-bold">
                {specialAds.reduce((sum, ad) => sum + (ad.views || 0), 0)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Ads Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Anúncio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Imagem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visualizações
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expira em
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {specialAds.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{ad.title}</div>
                        <div className="text-sm text-gray-500">{ad.description}</div>
                        {ad.created_by_user && (
                          <div className="text-xs text-gray-400">Criado por: {ad.created_by_user.name}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ad.image_url ? (
                        <img
                          src={ad.image_url}
                          alt={ad.title}
                          className="w-12 h-12 object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                          <span className="text-xs text-gray-400">Sem imagem</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(ad.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(ad.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ad.views || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ad.expires_at ? formatDate(ad.expires_at) : 'Sem expiração'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(ad)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(ad.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">
              {editingAd ? 'Editar Anúncio Especial' : 'Criar Anúncio Especial'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={3}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="pending">Pendente</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Expiração
                  </label>
                  <input
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imagem do Anúncio Especial
                  </label>
                  <div className="mb-2">
                    <span className="text-xs text-gray-500">
                      Dimensões recomendadas: 807x376 pixels (formato carrossel)
                    </span>
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      accept="image/*"
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
                        {uploading ? 'Fazendo upload...' : 'Clique para adicionar imagem'}
                      </span>
                    </label>
                  </div>
                  
                  {photos.length > 0 && (
                    <div className="mt-4">
                      <div className="relative inline-block">
                        <img
                          src={photos[0]}
                          alt="Preview do anúncio"
                          className="w-full max-w-md h-48 object-cover rounded-md border"
                          style={{ aspectRatio: '807/376' }}
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(0)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Preview do anúncio no carrossel
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingAd(null);
                    setFormData({ title: '', description: '', price: 0, status: 'active', expires_at: '' });
                    setPhotos([]);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                  {editingAd ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSpecialAdsPage;
