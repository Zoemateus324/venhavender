import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../hooks/useAuth';
import type { Category } from '../../../types';

interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  photos: string[];
  status: string;
  category_id: string;
  location: string;
  contact_phone: string;
  contact_email: string;
}

const EditAdPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [ad, setAd] = useState<Ad | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const { data, error } = await supabase
          .from('ads')
          .select(`
            id, title, description, price, photos, status, 
            category_id, location, contact_phone, contact_email
          `)
          .eq('id', id)
          .eq('user_id', user?.id)
          .single();

        if (error) throw error;
        setAd(data as Ad);
      } catch (error) {
        console.error('Erro ao carregar anúncio:', error);
        toast.error('Não foi possível carregar o anúncio.');
        navigate('/dashboard/ads');
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
      }
    };

    if (user) {
      fetchAd();
      fetchCategories();
    }
  }, [id, navigate, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!ad) return;
    const { name, value } = e.target;
    setAd({ ...ad, [name]: name === 'price' ? Number(value) : value } as Ad);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ad) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from('ads')
        .update({ 
          title: ad.title, 
          description: ad.description, 
          price: ad.price,
          category_id: ad.category_id,
          location: ad.location,
          contact_phone: ad.contact_phone,
          contact_email: ad.contact_email,
          status: ad.status
        })
        .eq('id', ad.id);
      if (error) throw error;
      toast.success('Anúncio atualizado com sucesso!');
      navigate('/dashboard/ads');
    } catch (error) {
      console.error('Erro ao salvar anúncio:', error);
      toast.error('Erro ao salvar o anúncio.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !ad) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar Anúncio</h1>
        <p className="text-gray-600">Atualize as informações do seu anúncio</p>
      </div>
      
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input 
              name="title" 
              value={ad.title} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" 
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$) *</label>
            <input 
              name="price" 
              type="number" 
              step="0.01" 
              value={ad.price} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" 
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
            <select 
              name="category_id" 
              value={ad.category_id} 
              onChange={handleChange}
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
              name="status" 
              value={ad.status} 
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="active">Ativo</option>
              <option value="paused">Pausado</option>
              <option value="pending">Pendente</option>
              <option value="rejected">Rejeitado</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
            <input 
              name="location" 
              value={ad.location} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Cidade, Estado"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone de Contato</label>
            <input 
              name="contact_phone" 
              value={ad.contact_phone} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="(11) 99999-9999"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email de Contato</label>
            <input 
              name="contact_email" 
              type="email"
              value={ad.contact_email} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="seu@email.com"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
            <textarea 
              name="description" 
              rows={4} 
              value={ad.description} 
              onChange={handleChange} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" 
              required
              placeholder="Descreva detalhadamente o que você está vendendo..."
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button 
            type="button" 
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            onClick={() => navigate('/dashboard/ads')}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={saving} 
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditAdPage;


