import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';

interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  photos: string[];
  status: string;
}

const EditAdPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [ad, setAd] = useState<Ad | null>(null);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const { data, error } = await supabase
          .from('ads')
          .select('id, title, description, price, photos, status')
          .eq('id', id)
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

    fetchAd();
  }, [id, navigate]);

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
        .update({ title: ad.title, description: ad.description, price: ad.price })
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
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Editar Anúncio</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <input name="title" value={ad.title} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea name="description" rows={4} value={ad.description} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preço</label>
          <input name="price" type="number" step="0.01" value={ad.price} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50">Salvar</button>
          <button type="button" className="px-4 py-2 border rounded-md" onClick={() => navigate('/dashboard/ads')}>Cancelar</button>
        </div>
      </form>
    </div>
  );
};

export default EditAdPage;


