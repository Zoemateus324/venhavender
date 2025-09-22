import React from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LayoutDashboard, MessageSquare, FileText, CreditCard, Settings, LogOut, PlusCircle } from 'lucide-react';

const DashboardLayout: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <FileText size={20} />, label: 'Meus Anúncios', path: '/dashboard/ads' },
    { icon: <PlusCircle size={20} />, label: 'Criar Anúncio', path: '/dashboard/ads/create' },
    { icon: <MessageSquare size={20} />, label: 'Mensagens', path: '/dashboard/messages' },
    { icon: <CreditCard size={20} />, label: 'Planos e Pagamentos', path: '/dashboard/payments' },
    { icon: <Settings size={20} />, label: 'Configurações', path: '/dashboard/settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') {
      return true;
    }
    return location.pathname.startsWith(path) && path !== '/dashboard';
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-primary">Venha Vender</h2>
          <p className="text-sm text-gray-500">{user.name}</p>
          <p className="text-xs text-gray-400">{user.email}</p>
        </div>
        <nav className="mt-4">
          <ul>
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm ${isActive(item.path) ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-3 text-sm text-gray-600 hover:bg-gray-100"
              >
                <span className="mr-3"><LogOut size={20} /></span>
                Sair
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;