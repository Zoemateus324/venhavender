import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Ad } from '../types';

interface SpecialAdsCarouselProps {
  onAdClick?: (ad: Ad) => void;
}

export default function SpecialAdsCarousel({ onAdClick }: SpecialAdsCarouselProps) {
  const [specialAds, setSpecialAds] = useState<Ad[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  // 🔄 Fetch com debounce (evita chamadas repetidas)
  const fetchSpecialAds = useCallback(async () => {
    setLoading(true);
    try {
      const nowIso = new Date().toISOString();

      const { data, error } = await supabase
        .from('special_ads')
        .select('*')
        .eq('status', 'active')
        .or(`expires_at.is.null,expires_at.gte."${nowIso}"`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSpecialAds(data || []);
    } catch (error) {
      console.error('❌ Erro ao buscar anúncios especiais:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpecialAds();
  }, [fetchSpecialAds]);

  // 🧭 Navegação protegida
  const nextSlide = () => {
    if (specialAds.length > 0)
      setCurrentSlide((prev) => (prev + 1) % specialAds.length);
  };

  const prevSlide = () => {
    if (specialAds.length > 0)
      setCurrentSlide((prev) => (prev - 1 + specialAds.length) % specialAds.length);
  };

  // 💫 Placeholder de loading
  if (loading) {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-lg">
        <div className="h-8 bg-gray-200 rounded w-64 mb-4 animate-pulse" />
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  // 🚫 Sem anúncios
  if (specialAds.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-lg">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Anúncios Especiais</h2>

        {specialAds.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={prevSlide}
              className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition text-gray-600 hover:text-orange-600"
              aria-label="Anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm text-gray-500">
              {currentSlide + 1} / {specialAds.length}
            </span>
            <button
              onClick={nextSlide}
              className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition text-gray-600 hover:text-orange-600"
              aria-label="Próximo"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Carrossel */}
      <div className="relative overflow-hidden rounded-lg">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {specialAds.map((ad) => (
            <div key={ad.id} className="w-full flex-shrink-0">
              <Link
                to={`/ads/${ad.id}?special=1`}
                onClick={() => onAdClick?.(ad)}
                className="relative block group aspect-[1135/350]"
              >
                {ad.large_image_url || ad.image_url ? (
                  <img
                    src={ad.large_image_url || ad.image_url}
                    alt={ad.title}
                    className="w-full h-full object-cover rounded-lg"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">Sem imagem</span>
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-300 rounded-lg flex items-end">
                  <div className="p-6 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-xl font-bold mb-2">{ad.title}</h3>
                    <p className="text-sm opacity-90 line-clamp-2">
                      {ad.description}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Indicadores */}
      {specialAds.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {specialAds.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-orange-600' : 'bg-gray-300'
              }`}
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
