import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useSettings } from './lib/settings';
import Header from './components/Header';
import { Toaster } from 'react-hot-toast';
import AuthModal from './components/AuthModal';
import CreateAdModal from './components/CreateAdModal';
import { supabase } from './lib/supabase';
 

function AppContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateAd, setShowCreateAd] = useState(false);
  

  // Track page views for analytics
  useEffect(() => {
    const deviceKey = 'vv_device_id';
    let deviceId = localStorage.getItem(deviceKey);
    if (!deviceId) {
      try {
        deviceId = crypto.randomUUID();
      } catch (_) {
        deviceId = Math.random().toString(36).slice(2) + Date.now().toString(36);
      }
      localStorage.setItem(deviceKey, deviceId);
    }

    const recordView = async () => {
      try {
        const pathname = location.pathname + (location.search || '');
        // Tenta inserir apenas uma vez, verificando qual coluna existe
        // Primeiro tenta page_path (legacy)
        const { error: errPagePath } = await supabase.from('page_views').insert([
          {
            device_id: deviceId,
            user_id: user?.id || null,
            page_path: pathname,
          },
        ]);
        
        // Se falhar com 400 (coluna não existe) ou 409 (conflito), tenta path
        if (errPagePath && (errPagePath.code === 'PGRST116' || errPagePath.code === '23505' || errPagePath.message?.includes('column') || errPagePath.message?.includes('does not exist'))) {
          const { error: errPath } = await supabase.from('page_views').insert([
            {
              device_id: deviceId,
              user_id: user?.id || null,
              path: pathname,
            },
          ]);
          // Se ainda falhar, apenas loga em debug (não é crítico)
          if (errPath && errPath.code !== '23505') { // Ignora conflitos (duplicatas)
            console.debug('page_views insert failed (both columns)', { errPagePath, errPath });
          }
        } else if (errPagePath && errPagePath.code !== '23505') {
          // Se não for erro de coluna inexistente nem conflito, loga
          console.debug('page_views insert failed', errPagePath);
        }
      } catch (e) {
        // Erros não críticos - apenas loga em debug
        console.debug('page_views unexpected error', e);
      }
    };

    recordView();
  }, [location.pathname, location.search, user?.id]);

  // Apply dynamic SEO title
  useEffect(() => {
    if (settings.meta_title) {
      document.title = settings.meta_title;
    }
  }, [settings.meta_title]);

  // Apply meta description
  useEffect(() => {
    if (settings.meta_description) {
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.content = settings.meta_description;
    }
  }, [settings.meta_description]);

  // Apply primary color CSS variable
  useEffect(() => {
    if (settings.primary_color) {
      const root = document.documentElement;
      root.style.setProperty('--vv-primary', settings.primary_color);
    }
  }, [settings.primary_color]);

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
      
      <main className="min-h-screen bg-gray-50 pt-0">
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
      
      <Toaster position="top-center" gutter={12} />
      
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
              <p className="text-gray-300">suporte@venhavender.com.br</p>
              <div className="mt-2">
                <a 
                  href="https://instagram.com/venhavender_oficial" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white flex items-center gap-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  @venhavender_oficial
                </a>
              </div>
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
  return <AppContent />;
}