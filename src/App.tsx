import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Header from './components/Header';
import { Toaster } from 'react-hot-toast';
import AuthModal from './components/AuthModal';
import CreateAdModal from './components/CreateAdModal';
import { supabase } from './lib/supabase';
import { Favorite, Ad } from './types';
import { Search } from 'lucide-react';

function AppContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateAd, setShowCreateAd] = useState(false);
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  const handleSearch = (query: string) => {
    navigate(`/ads?search=${encodeURIComponent(query)}`);
  };

  const handleShowFavorites = () => {
    if (user) {
      navigate('/dashboard?tab=favorites');
    } else {
      setShowAuthModal(true);
    }
  };

  const handleShowMessages = () => {
    if (user) {
      navigate('/dashboard/messages');
    } else {
      setShowAuthModal(true);
    }
  };

  const handleShowProfile = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      setShowAuthModal(true);
    }
  };

  const handleCreateAd = () => {
    if (user) {
      navigate('/create-ad');
    } else {
      setShowAuthModal(true);
    }
  };



  const handleContactAd = (ad: Ad) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    console.log('Contact ad:', ad);
  };

  const handleFavoriteAd = async (ad: Ad) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      const existingFavorite = favorites.find(f => f.ad_id === ad.id);

      if (existingFavorite) {
        // Remove favorite
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('id', existingFavorite.id);

        if (error) throw error;
        setFavorites(prev => prev.filter(f => f.id !== existingFavorite.id));
      } else {
        // Add favorite
        const { data, error } = await supabase
          .from('favorites')
          .insert([{ user_id: user.id, ad_id: ad.id }])
          .select()
          .single();

        if (error) throw error;
        setFavorites(prev => [...prev, data]);
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const favoriteIds = favorites.map(f => f.ad_id);

  return (
    <>
      <Header
        onSearch={handleSearch}
        onShowFavorites={handleShowFavorites}
        onShowMessages={handleShowMessages}
        onShowProfile={handleShowProfile}
        onCreateAd={handleCreateAd}
      />
      
      <main className="min-h-screen bg-gray-50 pt-16 pb-12">
        <Outlet />
      </main>
      
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
      
      {showCreateAd && (
        <CreateAdModal 
          onClose={() => setShowCreateAd(false)} 
          onSuccess={() => {
            setShowCreateAd(false);
            navigate('/dashboard');
          }} 
        />
      )}
      
      <Toaster position="top-center" />
      
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Venha Vender</h3>
              <p className="text-gray-300">A melhor plataforma para seus anúncios!</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Links Úteis</h4>
              <ul className="space-y-2">
                <li><a href="/support" className="text-gray-300 hover:text-white">Suporte</a></li>
                <li><a href="/terms" className="text-gray-300 hover:text-white">Termos de Uso</a></li>
                <li><a href="/privacy" className="text-gray-300 hover:text-white">Política de Privacidade</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contato</h4>
              <p className="text-gray-300">contato@venhavender.com.br</p>
            
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Venha Vender. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}