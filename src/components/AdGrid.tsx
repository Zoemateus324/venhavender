import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Ad, Category } from '../types';
import AdCard from './AdCard';
import { Filter } from 'lucide-react';

interface AdGridProps {
  searchQuery?: string;
  categoryFilter?: string;
  sellerFilter?: string;
  locationFilter?: string;
  adTypeFilter?: 'sale' | 'rent' | '';
  onContactAd?: (ad: Ad) => void;
  onFavoriteAd?: (ad: Ad) => void;
  favoriteIds?: string[];
}

export default function AdGrid({ 
  searchQuery, 
  categoryFilter, 
  sellerFilter,
  locationFilter,
  adTypeFilter,
  onContactAd, 
  onFavoriteAd,
  favoriteIds = []
}: AdGridProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || '');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high'>('newest');
  const [stateFilter, setStateFilter] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [externalLocationFilter, setExternalLocationFilter] = useState<string>(locationFilter || '');
  const [selectedAdType, setSelectedAdType] = useState<'sale' | 'rent' | ''>(adTypeFilter || '');

  const clearFilters = () => {
    setSelectedCategory('');
    setSortBy('newest');
    setStateFilter('');
    setCityFilter('');
    setExternalLocationFilter('');
    setSelectedAdType('');
  };

  useEffect(() => {
    fetchCategories();
    fetchAds();
  }, [searchQuery, selectedCategory, sortBy, sellerFilter, stateFilter, cityFilter, externalLocationFilter, selectedAdType]);

  // Update external location filter when prop changes
  useEffect(() => {
    setExternalLocationFilter(locationFilter || '');
  }, [locationFilter]);

  // Atualiza categorias em tempo real quando houver mudanças na tabela
  useEffect(() => {
    const channel = supabase
      .channel('categories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  const fetchAds = async () => {
    setLoading(true);
    try {
      const nowIso = new Date().toISOString();
      let query = supabase
        .from('ads')
        .select(`
          *,
          category:categories(name, icon)
        `)
        .eq('status', 'active')
        .in('type', ['grid', 'header'])
        .or(`end_date.is.null,end_date.gte.${nowIso}`);

      // Apply search filter
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Apply category filter
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      // Apply seller filter
      if (sellerFilter) {
        query = query.eq('user_id', sellerFilter);
      }

      // Apply ad type filter (only if the field exists in the database)
      if (selectedAdType) {
        // Temporarily comment out until migration is applied
        // query = query.eq('ad_type', selectedAdType);
        console.log('Ad type filter temporarily disabled until database migration is applied');
      }

      // Apply location filters by chaining conditions (AND semantics)
      if (stateFilter) {
        const uf = stateFilter.toUpperCase();
        // Evita falsos positivos sem usar regex/"," no valor (que quebra o or())
        // Cobre casos comuns: "... UF" | "UF ..." | "... UF ..." | "... - UF" | "UF - ..."
        const orParts = [
          `location.ilike.% ${uf}`,
          `location.ilike.% ${uf} %`,
          `location.ilike.% - ${uf}`,
          `location.ilike.${uf} %`,
          `location.ilike.${uf} - %`,
        ];
        query = query.or(orParts.join(','));
      }
      if (cityFilter) {
        query = query.ilike('location', `%${cityFilter}%`);
      }
      if (externalLocationFilter) {
        query = query.ilike('location', `%${externalLocationFilter}%`);
      }

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'price_low':
          query = query.order('price', { ascending: true });
          break;
        case 'price_high':
          query = query.order('price', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;
      setAds(data || []);

      // Se a tabela de categorias estiver vazia ou a query falhar em retornar itens,
      // derivamos as categorias a partir dos anúncios carregados para popular o filtro.
      if ((data?.length || 0) > 0) {
        const derivedMap = new Map<string, { id: string; name: string; slug: string; icon: string; created_at: string }>();
        for (const ad of data as any[]) {
          const id = ad.category_id as string | undefined;
          const name = ad.category?.name as string | undefined;
          if (id && name && !derivedMap.has(id)) {
            derivedMap.set(id, {
              id,
              name,
              slug: '',
              icon: ad.category?.icon || '',
              created_at: ''
            });
          }
        }
        const derived = Array.from(derivedMap.values());
        if (derived.length > 0 && categories.length === 0) {
          setCategories(derived as any);
        }
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-gray-200 rounded-lg h-56 sm:h-64 md:h-72 lg:h-80 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-500" />
            <span className="font-medium text-gray-700">Filtros:</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1 w-full">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-full sm:w-auto"
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            
            <select
              value={selectedAdType}
              onChange={(e) => setSelectedAdType(e.target.value as 'sale' | 'rent' | '')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-full sm:w-auto"
            >
              <option value="">Todos os tipos</option>
              <option value="sale">Venda</option>
              <option value="rent">Locação</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-full sm:w-auto"
            >
              <option value="newest">Mais recentes</option>
              <option value="price_low">Menor preço</option>
              <option value="price_high">Maior preço</option>
            </select>

            {/* Estado (UF) */}
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-full sm:w-auto"
            >
              <option value="">Todos os estados</option>
              {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>

            {/* Cidade */}
            <input
              type="text"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="Cidade"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 w-full sm:w-auto"
            />

            {/* Limpar filtros */}
            <button
              type="button"
              onClick={clearFilters}
              disabled={!selectedCategory && sortBy === 'newest' && !stateFilter && !cityFilter && !externalLocationFilter && !selectedAdType}
              className={`px-3 py-2 rounded-lg border transition-colors w-full sm:w-auto ${
                !selectedCategory && sortBy === 'newest' && !stateFilter && !cityFilter && !externalLocationFilter && !selectedAdType
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 hover:text-orange-600 hover:border-orange-500'
              }`}
            >
              Limpar filtros
            </button>

            {/* Aplicar filtros */}
            <button
              type="button"
              onClick={fetchAds}
              className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 w-full sm:w-auto"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-gray-600">
        {ads.length} anúncio{ads.length !== 1 ? 's' : ''} encontrado{ads.length !== 1 ? 's' : ''}
      </div>

      {/* Ads Grid */}
      {ads.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">Nenhum anúncio encontrado</div>
          <div className="text-gray-500">Tente ajustar os filtros de busca</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {ads.map((ad) => (
            <AdCard
              key={ad.id}
              ad={ad}
              onContact={() => onContactAd?.(ad)}
              onFavorite={() => onFavoriteAd?.(ad)}
              isFavorited={favoriteIds.includes(ad.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}