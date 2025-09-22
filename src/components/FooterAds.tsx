import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Ad } from '../types';

interface FooterAdsProps {
  onContactAd?: (ad: Ad) => void;
}

export default function FooterAds({ onContactAd }: FooterAdsProps) {
  const [currentAd, setCurrentAd] = useState<Ad | null>(null);
  const [footerAds, setFooterAds] = useState<Ad[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    fetchFooterAds();
  }, []);

  useEffect(() => {
    if (footerAds.length === 0) return;

    const showNextAd = () => {
      const ad = footerAds[currentIndex];
      if (ad.exposures < ad.max_exposures) {
        setCurrentAd(ad);
        setIsVisible(true);
        setTimeLeft(30);
        
        // Update exposure count
        updateExposureCount(ad.id);
      }
      
      // Move to next ad
      setCurrentIndex((prev) => (prev + 1) % footerAds.length);
    };

    // Show first ad after 5 seconds
    const initialTimer = setTimeout(showNextAd, 5000);

    return () => clearTimeout(initialTimer);
  }, [footerAds, currentIndex]);

  useEffect(() => {
    if (!isVisible || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsVisible(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, timeLeft]);

  const fetchFooterAds = async () => {
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('ads')
        .select(`
          *,
          category:categories(name, icon)
        `)
        .eq('status', 'active')
        .eq('type', 'footer')
        .eq('admin_approved', true)
        .or(`end_date.is.null,end_date.gte.${nowIso}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter ads that still have exposures left
      const activeAds = (data || []).filter(ad => ad.exposures < ad.max_exposures);
      setFooterAds(activeAds);
    } catch (error) {
      console.error('Error fetching footer ads:', error);
    }
  };

  const updateExposureCount = async (adId: string) => {
    try {
      const { error } = await supabase.rpc('increment_exposures', {
        ad_id: adId
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating exposure count:', error);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleContact = () => {
    if (currentAd && onContactAd) {
      onContactAd(currentAd);
      setIsVisible(false);
    }
  };

  if (!isVisible || !currentAd) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white shadow-lg border-t">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-600">
            Anúncio Patrocinado • {timeLeft}s
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Ad Image */}
          {currentAd.photos.length > 0 && (
            <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={currentAd.photos[0]}
                alt={currentAd.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Ad Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 truncate">
              {currentAd.title}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2">
              {currentAd.description}
            </p>
            <div className="text-lg font-bold text-orange-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(currentAd.price)}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleContact}
            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors flex-shrink-0"
          >
            Ver Mais
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 bg-gray-200 rounded-full h-1">
          <div
            className="bg-orange-600 h-1 rounded-full transition-all duration-1000"
            style={{ width: `${((30 - timeLeft) / 30) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}