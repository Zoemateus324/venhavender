import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { SettingsProvider } from './lib/settings';
import App from './App';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import MyAdsPage from './pages/ads/MyAdsPage';
import MessagesPage from './pages/dashboard/messages/MessagesPage';
import PlansPage from './pages/dashboard/PlansPage';
import RequestAdPage from './pages/dashboard/RequestAdPage';
import CreateAdPage from './pages/ads/CreateAdPage';
import AdDetailsPage from './pages/ads/AdDetailsPage';
import AdsGridPage from './pages/ads/AdsGridPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminAdsPage from './pages/admin/AdminAdsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminPlansPage from './pages/admin/AdminPlansPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminApiKeysPage from './pages/admin/AdminApiKeysPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminSpecialAdsPage from './pages/admin/AdminSpecialAdsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminAsaasValidationPage from './pages/admin/AdminAsaasValidationPage';
import PaymentPage from './pages/payment/PaymentPage';
import RenewPlanPage from './pages/payment/RenewPlanPage';
import SupportPage from './pages/support/SupportPage';
import TermsPage from './pages/support/TermsPage';
import PrivacyPage from './pages/support/PrivacyPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import AdminLayout from './pages/admin/AdminLayout';
import AdsListPage from './pages/dashboard/ads/AdsListPage';
import EditAdPage from './pages/dashboard/ads/EditAdPage';
import MessageDetailPage from './pages/dashboard/messages/MessageDetailPage';
import SettingsPage from './pages/dashboard/settings/SettingsPage';
import PaymentsPage from './pages/dashboard/payments/PaymentsPage';

function RouteError() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold mb-2">Página não encontrada</h1>
      <p className="text-gray-600 mb-4">O recurso solicitado não existe.</p>
      <a href="/" className="text-orange-600 hover:underline">Voltar para a página inicial</a>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
      // Alias para usuários que acessam /home
      { path: 'home', element: <HomePage /> },
      {
        path: 'auth',
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> }
        ]
      },
      { path: 'ads', element: <AdsGridPage /> },
      { path: 'ads/:id', element: <AdDetailsPage /> },
      { path: 'support', element: <SupportPage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: 'privacy', element: <PrivacyPage /> },
      {
        path: 'dashboard',
        element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'my-ads', element: <MyAdsPage /> },
          { path: 'ads', element: <AdsListPage /> },
          { path: 'ads/create', element: <CreateAdPage /> },
          { path: 'ads/:id/edit', element: <EditAdPage /> },
          { path: 'messages', element: <MessagesPage /> },
          { path: 'messages/:messageId', element: <MessageDetailPage /> },
          { path: 'plans', element: <PlansPage /> },
          { path: 'request-ad', element: <RequestAdPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'payments', element: <PaymentsPage /> }
        ],
      },
      {
        path: 'create-ad',
        element: <ProtectedRoute><CreateAdPage /></ProtectedRoute>,
      },
      {
        path: 'payment',
        element: <ProtectedRoute><PaymentPage /></ProtectedRoute>,
      },
      {
        path: 'renew-plan/:id',
        element: <ProtectedRoute><RenewPlanPage /></ProtectedRoute>,
      },
      {
        path: 'admin',
        element: <AdminRoute><AdminLayout /></AdminRoute>,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'ads', element: <AdminAdsPage /> },
          { path: 'special-ads', element: <AdminSpecialAdsPage /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'categories', element: <AdminCategoriesPage /> },
          { path: 'plans', element: <AdminPlansPage /> },
          { path: 'payments', element: <AdminPaymentsPage /> },
          { path: 'asaas-validation', element: <AdminAsaasValidationPage /> },
          { path: 'api-keys', element: <AdminApiKeysPage /> },
          { path: 'reports', element: <AdminReportsPage /> },
          { path: 'settings', element: <AdminSettingsPage /> },
        ],
      },
    ],
  },
  // Rota coringa para qualquer caminho desconhecido
  { path: '*', element: <RouteError /> },
]);

export default function Routes() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <RouterProvider router={router} />
      </SettingsProvider>
    </AuthProvider>
  );
}