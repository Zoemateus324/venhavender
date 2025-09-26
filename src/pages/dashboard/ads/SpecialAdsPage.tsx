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
  image_url?: string;
  small_image_url?: string;
  large_image_url?: string;
  created_by: string;
  views: number;
  clicks: number;
  can_edit?: boolean;
}

const SpecialAdsPage: React.FC = () => {
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
  const [smallPhotos, setSmallPhotos] = useState<string[]>([]);
  const [largePhotos, setLargePhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSpecialAds();
  }, []);

  const fetchSpecialAds = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_special_ads_with_permissions');

      if (error) throw error;
      // Filter only ads created by current user
      const userAds = (data || []).filter(ad => ad.created_by === user?.id);
      setSpecialAds(userAds);
    } catch (error) {
      console.error('Erro ao carregar anúncios especiais:', error);
      toast.error('Erro ao carregar anúncios especiais.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (files: FileList, type: 'small' | 'large') => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const file = files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `ads_especiais/${type}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('ads_especiais')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('ads_especiais')
        .getPublicUrl(filePath);

      if (type === 'small') {
        setSmallPhotos([data.publicUrl]);
      } else {
        setLargePhotos([data.publicUrl]);
      }
      
      toast.success(`Imagem ${type === 'small' ? 'pequena' : 'grande'} carregada com sucesso!`);
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast.error('Erro ao fazer upload da imagem.');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number, type: 'small' | 'large') => {
    if (type === 'small') {
      setSmallPhotos(prev => prev.filter((_, i) => i !== index));
    } else {
      setLargePhotos(prev => prev.filter((_, i) => i !== index));
    }
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
            small_image_url: smallPhotos[0] || null,
            large_image_url: largePhotos[0] || null
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
            small_image_url: smallPhotos[0] || null,
            large_image_url: largePhotos[0] || null,
            created_by: user?.id
          }]);

        if (error) throw error;
        toast.success('Anúncio especial criado com sucesso!');
      }

      setShowCreateModal(false);
      setEditingAd(null);
      setFormData({ title: '', description: '', price: 0, status: 'active', expires_at: '' });
      setSmallPhotos([]);
      setLargePhotos([]);
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
    setSmallPhotos(ad.small_image_url ? [ad.small_image_url] : []);
    setLargePhotos(ad.large_image_url ? [ad.large_image_url] : []);
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

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    
    const labels = {
      active: 'Ativo',
      inactive: 'Inativo',
      pending: 'Pendente'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Anúncios Especiais</h1>
          <p className="text-gray-600">Gerencie seus anúncios especiais para o carrossel</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Criar Anúncio Especial
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                    Imagens
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
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {/* Imagem Pequena */}
                        <div className="flex flex-col items-center">
                          <div className="text-xs text-gray-500 mb-1">Pequena</div>
                          {ad.small_image_url ? (
                            <img
                              src={ad.small_image_url}
                              alt={`${ad.title} - pequena`}
                              className="w-12 h-8 object-cover rounded-md"
                            />
                          ) : (
                            <div className="w-12 h-8 bg-gray-200 rounded-md flex items-center justify-center">
                              <span className="text-xs text-gray-400">-</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Imagem Grande */}
                        <div className="flex flex-col items-center">
                          <div className="text-xs text-gray-500 mb-1">Grande</div>
                          {ad.large_image_url ? (
                            <img
                              src={ad.large_image_url}
                              alt={`${ad.title} - grande`}
                              className="w-12 h-8 object-cover rounded-md"
                            />
                          ) : (
                            <div className="w-12 h-8 bg-gray-200 rounded-md flex items-center justify-center">
                              <span className="text-xs text-gray-400">-</span>
                            </div>
                          )}
                        </div>
                      </div>
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
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingAd ? 'Editar Anúncio Especial' : 'Criar Anúncio Especial'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                
                <div className="lg:col-span-2">
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
                
                {/* Imagem Pequena */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imagem Pequena
                  </label>
                  <div className="mb-2">
                    <span className="text-xs text-gray-500">
                      Dimensões máximas: 400x200 pixels
                    </span>
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files && handleImageUpload(e.target.files, 'small')}
                      className="hidden"
                      id="small-image-upload"
                    />
                    <label
                      htmlFor="small-image-upload"
                      className="cursor-pointer flex flex-col items-center justify-center py-4"
                    >
                      <Upload size={32} className="text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        {uploading ? 'Fazendo upload...' : 'Clique para adicionar imagem pequena'}
                      </span>
                    </label>
                  </div>
                  
                  {smallPhotos.length > 0 && (
                    <div className="mt-4">
                      <div className="relative inline-block">
                        <img
                          src={smallPhotos[0]}
                          alt="Preview da imagem pequena"
                          className="w-full max-w-md h-32 object-cover rounded-md border"
                          style={{ aspectRatio: '400/200' }}
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(0, 'small')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Preview da imagem pequena
                      </p>
                    </div>
                  )}
                </div>

                {/* Imagem Grande */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imagem Grande
                  </label>
                  <div className="mb-2">
                    <span className="text-xs text-gray-500">
                      Dimensões máximas: 1135x350 pixels (formato carrossel)
                    </span>
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files && handleImageUpload(e.target.files, 'large')}
                      className="hidden"
                      id="large-image-upload"
                    />
                    <label
                      htmlFor="large-image-upload"
                      className="cursor-pointer flex flex-col items-center justify-center py-4"
                    >
                      <Upload size={32} className="text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        {uploading ? 'Fazendo upload...' : 'Clique para adicionar imagem grande'}
                      </span>
                    </label>
                  </div>
                  
                  {largePhotos.length > 0 && (
                    <div className="mt-4">
                      <div className="relative inline-block">
                        <img
                          src={largePhotos[0]}
                          alt="Preview da imagem grande"
                          className="w-full max-w-md h-48 object-cover rounded-md border"
                          style={{ aspectRatio: '1135/350' }}
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(0, 'large')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Preview da imagem grande no carrossel
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingAd(null);
                    setFormData({ title: '', description: '', price: 0, status: 'active', expires_at: '' });
                    setSmallPhotos([]);
                    setLargePhotos([]);
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

export default SpecialAdsPage;
