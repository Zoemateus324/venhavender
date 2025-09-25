
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Filter, Search, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Category } from '../../types';
import AdGrid from '../../components/AdGrid';
import { useAuth } from '../../hooks/useAuth';
import AuthModal from '../../components/AuthModal';
import { toast } from 'react-hot-toast';

const AdsGridPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || '');
  const sellerParam = searchParams.get('seller') || '';
  const [showFilters, setShowFilters] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{min: string, max: string}>({min: '', max: ''});
  const [location, setLocation] = useState<string>(searchParams.get('location') || '');

  useEffect(() => {
    fetchCategories();
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('ad_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setFavoriteIds((data || []).map(fav => fav.ad_id));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParams();
  };

  const updateSearchParams = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (sellerParam) params.set('seller', sellerParam);
    if (location) params.set('location', location);
    if (priceRange.min) params.set('min_price', priceRange.min);
    if (priceRange.max) params.set('max_price', priceRange.max);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setLocation('');
    setPriceRange({min: '', max: ''});
    setSearchParams({});
  };

  const handleContactAd = async (ad: any) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      // Evita mensagem para si mesmo
      if (ad.user_id === user.id) {
        toast('Este é o seu anúncio.', { icon: 'ℹ️' });
        return;
      }

      // Procura conversa existente entre comprador e vendedor sobre este anúncio
      const { data: existing, error: findError } = await supabase
        .from('messages')
        .select('id, sender_id, receiver_id')
        .eq('ad_id', ad.id)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${ad.user_id}),and(sender_id.eq.${ad.user_id},receiver_id.eq.${user.id})`)
        .limit(1);

      if (findError) throw findError;

      if (existing && existing.length > 0) {
        navigate(`/dashboard/messages/${existing[0].id}`);
        return;
      }

      // Cria primeira mensagem e vai para o detalhe
      const { data: inserted, error: insertError } = await supabase
        .from('messages')
        .insert([
          {
            message: 'Olá! Tenho interesse no seu anúncio.',
            sender_id: user.id,
            receiver_id: ad.user_id,
            ad_id: ad.id,
            read: false,
          },
        ])
        .select('id')
        .single();

      if (insertError) throw insertError;

      toast.success('Conversa iniciada');
      navigate(`/dashboard/messages/${inserted.id}`);
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error);
      toast.error('Não foi possível iniciar a conversa.');
    }
  };

  const handleFavoriteAd = async (ad: any) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      const isFavorite = favoriteIds.includes(ad.id);

      if (isFavorite) {
        // Remove from favorites
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('ad_id', ad.id);

        setFavoriteIds(favoriteIds.filter(id => id !== ad.id));
        toast.success('Removido dos favoritos');
      } else {
        // Add to favorites
        await supabase
          .from('favorites')
          .insert([{ user_id: user.id, ad_id: ad.id }]);

        setFavoriteIds([...favoriteIds, ad.id]);
        toast.success('Adicionado aos favoritos');
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
      toast.error('Erro ao atualizar favoritos');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">Anúncios</h1>

        <div className="flex items-center justify-center gap-4">
          <form onSubmit={handleSearch} className="relative w-full max-w-2xl">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar anúncios..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </form>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter size={18} />
            <span className="hidden md:inline">Filtros</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Filtros</h2>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localização
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Cidade, estado..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Faixa de Preço
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                  placeholder="Min"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                  placeholder="Max"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Limpar
            </button>
            <button
              onClick={updateSearchParams}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}

      <AdGrid 
        searchQuery={searchQuery}
        categoryFilter={selectedCategory}
        sellerFilter={sellerParam}
        onContactAd={handleContactAd}
        onFavoriteAd={handleFavoriteAd}
        favoriteIds={favoriteIds}
      />

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          defaultTab="login"
        />
      )}
    </div>
  );
};

export default AdsGridPage;