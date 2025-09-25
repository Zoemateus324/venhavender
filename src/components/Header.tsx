import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, MessageCircle, User, Plus, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import AuthModal from './AuthModal';

interface HeaderProps {
  onSearch: (query: string) => void;
  onShowFavorites: () => void;
  onShowMessages: () => void;
  onShowProfile: () => void;
  onCreateAd: () => void;
}

export default function Header({ 
  onSearch, 
  onShowFavorites, 
  onShowMessages, 
  onShowProfile,
  onCreateAd 
}: HeaderProps) {
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowMobileMenu(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="inline-block">
                <h1 className="text-2xl font-bold text-orange-600">
                  Venha Vender
                </h1>
              </Link>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:block flex-1 max-w-2xl mx-4 lg:mx-8">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="O que você está procurando?"
                  className="w-full pl-4 pr-12 py-2.5 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-600"
                >
                  <Search size={20} />
                </button>
              </form>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
              {user ? (
                <>
                  <button
                    onClick={onCreateAd}
                    className="bg-orange-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2 transition-colors"
                  >
                    <Plus size={20} />
                    Anunciar
                  </button>
                  
                  <button
                    onClick={onShowFavorites}
                    className="p-2 text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    <Heart size={24} />
                  </button>
                  
                  <button
                    onClick={onShowMessages}
                    className="p-2 text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    <MessageCircle size={24} />
                  </button>
                  
                  <div className="relative group">
                    <button
                      onClick={onShowProfile}
                      className="flex items-center gap-2 p-2 text-gray-600 hover:text-orange-600 transition-colors"
                    >
                      <User size={24} />
                      <span className="text-sm">{user.name}</span>
                    </button>
                    
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <button
                        onClick={onShowProfile}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-t-lg"
                      >
                        Meu Perfil
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600 rounded-b-lg"
                      >
                        Sair
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Entrar
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-gray-600"
              >
                {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="O que você está procurando?"
                className="w-full pl-4 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-600"
              >
                <Search size={20} />
              </button>
            </form>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-2 space-y-2">
              {user ? (
                <>
                  <button
                    onClick={() => {
                      onCreateAd();
                      setShowMobileMenu(false);
                    }}
                    className="w-full bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2"
                  >
                    <Plus size={20} />
                    Anunciar
                  </button>
                  
                  <button
                    onClick={() => {
                      onShowFavorites();
                      setShowMobileMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                  >
                    <Heart size={20} />
                    Favoritos
                  </button>
                  
                  <button
                    onClick={() => {
                      onShowMessages();
                      setShowMobileMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                  >
                    <MessageCircle size={20} />
                    Mensagens
                  </button>
                  
                  <button
                    onClick={() => {
                      onShowProfile();
                      setShowMobileMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                  >
                    <User size={20} />
                    Meu Perfil
                  </button>
                  
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-3 text-red-600 hover:bg-gray-50 rounded-lg"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setShowAuthModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-full bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700"
                >
                  Entrar
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </>
  );
}