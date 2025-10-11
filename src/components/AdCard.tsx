import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Clock, Eye, MessageCircle } from 'lucide-react';
import { Ad } from '../types';

interface AdCardProps {
  ad: Ad;
  onFavorite?: () => void;
  onContact?: () => void;
  isFavorited?: boolean;
}

export default function AdCard({ ad, onFavorite, onContact, isFavorited }: AdCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getExpirationDate = () => {
    const anyAd = ad as any;
    const raw = anyAd.end_date || anyAd.expires_at;
    return raw ? new Date(raw) : null;
  };

  const getDaysUntilExpiration = () => {
    const exp = getExpirationDate();
    if (!exp) return null;
    const now = new Date();
    const diffMs = exp.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const isExpiringSoon = () => {
    const days = getDaysUntilExpiration();
    return days !== null && days >= 0 && days <= 3;
  };

  const nextImage = () => {
    if (ad.photos.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % ad.photos.length);
    }
  };

  const prevImage = () => {
    if (ad.photos.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + ad.photos.length) % ad.photos.length);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden h-full flex flex-col">
      {/* Image Container */}
      <Link to={`/ads/${ad.id}`} className="block relative h-44 sm:h-48 md:h-52 bg-gray-200">
        {ad.photos.length > 0 ? (
          <>
            <img
              src={ad.photos[currentImageIndex]}
              alt={ad.title}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onError={() => {
                // tenta próxima imagem ou mostra fallback visual
                if (ad.photos.length > 1) {
                  setCurrentImageIndex((prev) => (prev + 1) % ad.photos.length);
                }
              }}
            />
            
            {/* Image Navigation */}
            {ad.photos.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70"
                >
                  ‹
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70"
                >
                  ›
                </button>
                
                {/* Image Dots */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {ad.photos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Sem imagem
          </div>
        )}

        {/* Expiration Badge */}
        {isExpiringSoon() && (
          <div className="absolute bottom-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold shadow">
            {(() => {
              const days = getDaysUntilExpiration();
              if (days === null) return null;
              if (days === 0) return 'Expira hoje';
              if (days === 1) return 'Expira amanhã';
              return `Expira em ${days} dias`;
            })()}
          </div>
        )}
        
        {/* Favorite Button */}
        {onFavorite && (
          <button
            onClick={onFavorite}
            className={`absolute top-3 right-3 p-2 rounded-full shadow-lg transition-colors ${
              isFavorited 
                ? 'bg-red-500 text-white' 
                : 'bg-white text-gray-600 hover:text-red-500'
            }`}
          >
            <Heart size={16} fill={isFavorited ? 'currentColor' : 'none'} />
          </button>
        )}

        {/* Plan Badge */}
        {ad.type === 'header' && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-2 py-1 rounded text-xs font-medium">
            DESTAQUE
          </div>
        )}

        {/* Ad Type Badge */}
        <div className={`absolute top-3 ${ad.type === 'header' ? 'left-20' : 'left-3'} bg-gradient-to-r ${
          (ad.ad_type || 'sale') === 'sale' 
            ? 'from-green-500 to-green-600' 
            : 'from-blue-500 to-blue-600'
        } text-white px-2 py-1 rounded text-xs font-medium`}>
          {(ad.ad_type || 'sale') === 'sale' ? 'VENDA' : 'LOCAÇÃO'}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <Link to={`/ads/${ad.id}`} className="block">
          <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-2 line-clamp-2">
            {ad.title}
          </h3>
        </Link>
        
        <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2">
          {ad.description}
        </p>

        {/* Price */}
        <div className="text-xl sm:text-2xl font-bold text-orange-600 mb-3">
          {formatPrice(ad.price)}
        </div>

        {/* Location and Date */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <MapPin size={14} />
            <span>{ad.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{formatDate(ad.created_at)}</span>
          </div>
        </div>

        {/* Stats and Actions */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Eye size={14} />
              <span>{ad.views}</span>
            </div>
          </div>
          
          {(
            <button
              onClick={() => {
                navigate(`/ads/${ad.id}`);
              }}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 text-sm"
            >
              <MessageCircle size={16} />
              Conversar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}