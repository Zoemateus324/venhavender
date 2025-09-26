import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Ad } from '../types';
import AdCard from './AdCard';

interface FeaturedAdsProps {
  onContactAd?: (ad: Ad) => void;
  onFavoriteAd?: (ad: Ad) => void;
  favoriteIds?: string[];
}

export default function FeaturedAds({ onContactAd, onFavoriteAd, favoriteIds = [] }: FeaturedAdsProps) {
  const [featuredAds, setFeaturedAds] = useState<Ad[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedAds();
  }, []);

  const fetchFeaturedAds = async () => {
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('ads')
        .select(`
          *,
          category:categories(name, icon)
        `)
        .eq('status', 'active')
        .eq('type', 'header')
        .or(`end_date.is.null,end_date.gte.${nowIso}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setFeaturedAds(data || []);
    } catch (error) {
      console.error('Error fetching featured ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(featuredAds.length / 3));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(featuredAds.length / 3)) % Math.ceil(featuredAds.length / 3));
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-lg">
        <div className="h-8 bg-gray-200 rounded w-64 mb-4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-gray-200 rounded-lg h-80 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (featuredAds.length === 0) {
    return null;
  }

  const adsPerSlide = 3;
  const totalSlides = Math.ceil(featuredAds.length / adsPerSlide);
  const currentAds = featuredAds.slice(
    currentSlide * adsPerSlide,
    (currentSlide + 1) * adsPerSlide
  );

  return (
    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Anúncios em Destaque</h2>
        
        {totalSlides > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={prevSlide}
              className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow text-gray-600 hover:text-orange-600 active:text-orange-600 focus:text-orange-600"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm text-gray-500">
              {currentSlide + 1} / {totalSlides}
            </span>
            <button
              onClick={nextSlide}
              className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow text-gray-600 hover:text-orange-600 active:text-orange-600 focus:text-orange-600"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentAds.map((ad) => (
          <AdCard
            key={ad.id}
            ad={ad}
            onContact={() => onContactAd?.(ad)}
            onFavorite={() => onFavoriteAd?.(ad)}
            isFavorited={favoriteIds.includes(ad.id)}
          />
        ))}
      </div>

      {/* Slide indicators */}
      {totalSlides > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          {[...Array(totalSlides)].map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-orange-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}