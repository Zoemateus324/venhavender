import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Header from './components/Header';
import { Toaster } from 'react-hot-toast';
import AuthModal from './components/AuthModal';
import CreateAdModal from './components/CreateAdModal';
import { supabase } from './lib/supabase';
 

function AppContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateAd, setShowCreateAd] = useState(false);
  

  // Track page views for analytics
  useEffect(() => {
    const deviceKey = 'vv_device_id';
    let deviceId = localStorage.getItem(deviceKey);
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem(deviceKey, deviceId);
    }

    const recordView = async () => {
      try {
        await supabase.from('page_views').insert([
          {
            device_id: deviceId,
            user_id: user?.id || null,
            path: location.pathname + (location.search || ''),
          },
        ]);
      } catch (e) {
        // ignore analytics errors
      }
    };

    recordView();
  }, [location.pathname, location.search, user?.id]);

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