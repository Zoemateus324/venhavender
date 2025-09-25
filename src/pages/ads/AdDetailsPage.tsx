import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Eye, Heart, MessageCircle, Share2, Flag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import AuthModal from '../../components/AuthModal';
import { toast } from 'react-hot-toast';

interface AdDetails {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  created_at: string;
  views: number;
  images: string[];
  user_id: string;
  user: {
    name: string;
    avatar_url?: string;
    phone?: string;
  };
  category: {
    id: string;
    name: string;
  };
}

const AdDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ad, setAd] = useState<AdDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (id) {
      fetchAdDetails();
      incrementViewCount();
      if (user) {
        checkIfFavorite();
      }
    }
  }, [id, user]);

  const fetchAdDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ads')
        .select(`
          *,
          user:user_id (name, avatar_url, phone),
          category:category_id (id, name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setAd(data);
    } catch (error) {
      console.error('Error fetching ad details:', error);
      toast.error('Erro ao carregar detalhes do anúncio');
      navigate('/ads');
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    try {
      await supabase.rpc('increment_ad_view', { ad_id: id });
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const checkIfFavorite = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('ad_id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      if (isFavorite) {
        // Remove from favorites
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('ad_id', id);

        setIsFavorite(false);
        toast.success('Removido dos favoritos');
      } else {
        // Add to favorites
        await supabase
          .from('favorites')
          .insert([{ user_id: user.id, ad_id: id }]);

        setIsFavorite(true);
        toast.success('Adicionado aos favoritos');
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
      toast.error('Erro ao atualizar favoritos');
    }
  };

  const handleContact = () => {
    // Se houver telefone do vendedor, mostramos sem exigir login
    if (ad?.user?.phone) {
      setShowContactInfo(true);
      return;
    }
    // Caso contrário, abrir chat exige autenticação
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowContactInfo(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!message.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          receiver_id: ad?.user_id,
          ad_id: id,
          content: message,
          is_read: false
        }]);

      if (error) throw error;

      toast.success('Mensagem enviada com sucesso!');
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: ad?.title,
        text: `Confira este anúncio: ${ad?.title}`,
        url: window.location.href
      });
    } catch (error) {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado para a área de transferência');
    }
  };

  const handleReport = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    toast.success('Anúncio reportado. Obrigado por ajudar a manter a plataforma segura.');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="h-96 bg-gray-200 rounded-lg mb-4"></div>
              <div className="flex gap-2 mb-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 w-20 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="space-y-2 mb-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
                ))}
              </div>
            </div>
            <div>
              <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-60 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Anúncio não encontrado</h2>
        <p className="text-gray-600 mb-6">O anúncio que você está procurando não existe ou foi removido.</p>
        <button
          onClick={() => navigate('/ads')}
          className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
        >
          Ver Outros Anúncios
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} className="mr-2" />
          Voltar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - Images and Description */}
        <div className="md:col-span-2">
          {/* Main Image */}
          <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4">
            <img 
              src={(Array.isArray((ad as any).photos) ? (ad as any).photos[activeImage] : (ad as any).images?.[activeImage])}
              alt={ad.title}
              className="w-full h-96 object-contain"
            />
          </div>

          {/* Thumbnail Images */}
          {((ad as any).photos?.length || ad.images?.length || 0) > 1 && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {(Array.isArray((ad as any).photos) ? (ad as any).photos : (ad as any).images || []).map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`h-20 w-20 rounded overflow-hidden flex-shrink-0 border-2 ${activeImage === index ? 'border-orange-500' : 'border-transparent'}`}
                >
                  <img 
                    src={image} 
                    alt={`${ad.title} - imagem ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Ad Title and Meta */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{ad.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-gray-500 mb-6">
            <div className="flex items-center gap-1">
              <MapPin size={16} />
              <span>{ad.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={16} />
              <span>Publicado em {formatDate(ad.created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye size={16} />
              <span>{ad.views} visualizações</span>
            </div>
          </div>

          {/* Price */}
          <div className="text-3xl font-bold text-orange-600 mb-6">
            {formatPrice(ad.price)}
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Descrição</h2>
            <div className="text-gray-700 whitespace-pre-line">
              {ad.description}
            </div>
          </div>

          {/* Category */}
          {ad.category?.name && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Categoria</h2>
              <div className="inline-block bg-gray-100 px-4 py-2 rounded-full text-gray-700">
                {ad.category.name}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={handleToggleFavorite}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${isFavorite ? 'bg-red-50 border-red-200 text-red-600' : 'border-gray-300 hover:bg-gray-50'}`}
            >
              <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
              {isFavorite ? 'Salvo' : 'Salvar'}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              <Share2 size={18} />
              Compartilhar
            </button>
            <button
              onClick={handleReport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              <Flag size={18} />
              Reportar
            </button>
          </div>
        </div>

        {/* Right Column - Contact and Seller Info */}
        <div>
          {/* Price Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="text-2xl font-bold text-orange-600 mb-4">
              {formatPrice(ad.price)}
            </div>
            <button
              onClick={handleContact}
              className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 mb-4 flex items-center justify-center gap-2"
            >
              <MessageCircle size={18} />
              Contatar Vendedor
            </button>

            {showContactInfo && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                {ad.user.phone ? (
                  <div>
                    <p className="font-medium mb-2">Telefone:</p>
                    <a 
                      href={`tel:${ad.user.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {ad.user.phone}
                    </a>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium mb-2">Enviar mensagem:</p>
                    <form onSubmit={handleSendMessage}>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Olá, tenho interesse neste anúncio..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 mb-2"
                        rows={3}
                      />
                      <button
                        type="submit"
                        className="w-full bg-orange-600 text-white py-2 rounded-lg font-medium hover:bg-orange-700"
                      >
                        Enviar
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Seller Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações do Vendedor</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                {ad.user?.avatar_url ? (
                  <img 
                    src={ad.user.avatar_url} 
                    alt={ad.user?.name || 'Vendedor'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-600 font-bold text-xl">
                    {(ad.user?.name?.charAt(0)?.toUpperCase() || 'V')}
                  </div>
                )}
              </div>
              <div>
                <div className="font-medium">{ad.user?.name || 'Vendedor'}</div>
                <div className="text-sm text-gray-500">Membro desde {formatDate(ad.created_at)}</div>
              </div>
            </div>
            {/* Seller contact/location */}
            <div className="space-y-2 text-sm text-gray-700">
              {ad.user?.phone && (
                <div>
                  <span className="font-medium">Telefone: </span>
                  <a href={`tel:${ad.user.phone}`} className="text-blue-600 hover:underline">{ad.user.phone}</a>
                </div>
              )}
              {ad.location && (
                <div>
                  <span className="font-medium">Cidade/Estado: </span>
                  <span>{ad.location}</span>
                </div>
              )}
            </div>
            <div className="border-t pt-4">
              <button
                onClick={() => navigate(`/ads?seller=${ad.user_id}`)}
                className="w-full bg-gray-100 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} />
                Ver Todos os Anúncios
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          defaultTab="login"
        />
      )}
    </div>
  );
};

export default AdDetailsPage;