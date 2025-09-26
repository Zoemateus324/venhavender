import React from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  Key,
  BarChart3,
  Bell,
  LineChart,
  Cog,
  Star
} from 'lucide-react';

const AdminLayout: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin' },
    { icon: <FileText size={20} />, label: 'Anúncios', path: '/admin/ads' },
    { icon: <Star size={20} />, label: 'Anúncios Especiais', path: '/admin/special-ads' },
    { icon: <Users size={20} />, label: 'Usuários', path: '/admin/users' },
    { icon: <BarChart3 size={20} />, label: 'Planos', path: '/admin/plans' },
    { icon: <CreditCard size={20} />, label: 'Pagamentos', path: '/admin/payments' },
    { icon: <LineChart size={20} />, label: 'Relatórios', path: '/admin/reports' },
    { icon: <Key size={20} />, label: 'Chaves API', path: '/admin/api-keys' },
    { icon: <Cog size={20} />, label: 'Configurações', path: '/admin/settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') {
      return true;
    }
    return location.pathname.startsWith(path) && path !== '/admin';
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white shadow-md">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-orange-500">Venha Vender</h2>
          <p className="text-sm text-gray-400">Painel de Administração</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
        <nav className="mt-4">
          <ul>
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm ${isActive(item.path) ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:bg-gray-800"
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

export default AdminLayout;