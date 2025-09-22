import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Ad, Category } from '../types';
import AdCard from './AdCard';
import { Filter } from 'lucide-react';

interface AdGridProps {
  searchQuery?: string;
  categoryFilter?: string;
  onContactAd?: (ad: Ad) => void;
  onFavoriteAd?: (ad: Ad) => void;
  favoriteIds?: string[];
}

export default function AdGrid({ 
  searchQuery, 
  categoryFilter, 
  onContactAd, 
  onFavoriteAd,
  favoriteIds = []
}: AdGridProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || '');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high'>('newest');

  useEffect(() => {
    fetchCategories();
    fetchAds();
  }, [searchQuery, selectedCategory, sortBy]);

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
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-gray-200 rounded-lg h-80 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-500" />
            <span className="font-medium text-gray-700">Filtros:</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="newest">Mais recentes</option>
              <option value="price_low">Menor preço</option>
              <option value="price_high">Maior preço</option>
            </select>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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