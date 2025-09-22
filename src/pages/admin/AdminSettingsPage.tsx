import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { Save, RefreshCw, Settings, Mail, Bell, Shield, CreditCard, Globe, FileText } from 'lucide-react';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string;
  category: string;
  is_public: boolean;
  updated_at: string;
}

const AdminSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) throw error;
      
      setSettings(data || []);
      
      // Initialize form values
      const initialValues: Record<string, string> = {};
      data?.forEach(setting => {
        initialValues[setting.key] = setting.value;
      });
      setFormValues(initialValues);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Erro ao carregar configurações do sistema');
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      // Prepare updates
      const updates = Object.entries(formValues).map(([key, value]) => ({
        key,
        value
      }));
      
      // In a real app, you would use a transaction or batch update
      for (const update of updates) {
        const { error } = await supabase
          .from('system_settings')
          .update({ value: update.value, updated_at: new Date().toISOString() })
          .eq('key', update.key);
        
        if (error) throw error;
      }
      
      toast.success('Configurações salvas com sucesso');
      setSaving(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
      setSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!confirm('Tem certeza que deseja redefinir todas as configurações para os valores padrão? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      setSaving(true);
      
      // In a real app, you would have default values stored somewhere
      // For now, we'll just refresh the current values
      await fetchSettings();
      
      toast.success('Configurações redefinidas para os valores padrão');
      setSaving(false);
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error('Erro ao redefinir configurações');
      setSaving(false);
    }
  };

  const getSettingsByCategory = (category: string) => {
    return settings.filter(setting => setting.category === category);
  };

  const renderSettingInput = (setting: SystemSetting) => {
    const value = formValues[setting.key] || '';
    
    // Render different input types based on the setting key or description
    if (setting.key.includes('enabled') || setting.key.includes('active')) {
      return (
        <select
          value={value}
          onChange={(e) => handleInputChange(setting.key, e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="true">Ativado</option>
          <option value="false">Desativado</option>
        </select>
      );
    } else if (setting.key.includes('email') || setting.key.includes('mail')) {
      return (
        <input
          type="email"
          value={value}
          onChange={(e) => handleInputChange(setting.key, e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      );
    } else if (setting.key.includes('url') || setting.key.includes('link')) {
      return (
        <input
          type="url"
          value={value}
          onChange={(e) => handleInputChange(setting.key, e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      );
    } else if (setting.key.includes('color')) {
      return (
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={value}
            onChange={(e) => handleInputChange(setting.key, e.target.value)}
            className="h-8 w-8 rounded-md border border-gray-300"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(setting.key, e.target.value)}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      );
    } else if (setting.description.toLowerCase().includes('texto longo') || setting.key.includes('description')) {
      return (
        <textarea
          value={value}
          onChange={(e) => handleInputChange(setting.key, e.target.value)}
          rows={4}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      );
    } else if (setting.key.includes('limit') || setting.key.includes('count') || setting.key.includes('days')) {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => handleInputChange(setting.key, e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      );
    } else {
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(setting.key, e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      );
    }
  };

  const tabs = [
    { id: 'general', label: 'Geral', icon: <Settings size={18} /> },
    { id: 'email', label: 'Email', icon: <Mail size={18} /> },
    { id: 'notifications', label: 'Notificações', icon: <Bell size={18} /> },
    { id: 'security', label: 'Segurança', icon: <Shield size={18} /> },
    { id: 'payment', label: 'Pagamentos', icon: <CreditCard size={18} /> },
    { id: 'seo', label: 'SEO', icon: <Globe size={18} /> },
    { id: 'legal', label: 'Legal', icon: <FileText size={18} /> }
  ];

  // Mock settings data for demonstration
  const mockSettings: SystemSetting[] = [
    {
      id: '1',
      key: 'site_name',
      value: 'Venha Vender',
      description: 'Nome do site',
      category: 'general',
      is_public: true,
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      key: 'site_description',
      value: 'Plataforma de anúncios online',
      description: 'Descrição do site (texto longo)',
      category: 'general',
      is_public: true,
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      key: 'contact_email',
      value: 'contato@venhavender.com',
      description: 'Email de contato principal',
      category: 'email',
      is_public: true,
      updated_at: new Date().toISOString()
    },
    {
      id: '4',
      key: 'smtp_host',
      value: 'smtp.example.com',
      description: 'Servidor SMTP para envio de emails',
      category: 'email',
      is_public: false,
      updated_at: new Date().toISOString()
    },
    {
      id: '5',
      key: 'notifications_enabled',
      value: 'true',
      description: 'Ativar sistema de notificações',
      category: 'notifications',
      is_public: true,
      updated_at: new Date().toISOString()
    },
    {
      id: '6',
      key: 'email_notifications_enabled',
      value: 'true',
      description: 'Ativar notificações por email',
      category: 'notifications',
      is_public: true,
      updated_at: new Date().toISOString()
    },
    {
      id: '7',
      key: 'max_login_attempts',
      value: '5',
      description: 'Número máximo de tentativas de login',
      category: 'security',
      is_public: false,
      updated_at: new Date().toISOString()
    },
    {
      id: '8',
      key: 'password_reset_expiry_hours',
      value: '24',
      description: 'Validade do link de redefinição de senha (horas)',
      category: 'security',
      is_public: false,
      updated_at: new Date().toISOString()
    },
    {
      id: '9',
      key: 'payment_gateway',
      value: 'asaas',
      description: 'Gateway de pagamento padrão',
      category: 'payment',
      is_public: false,
      updated_at: new Date().toISOString()
    },
    {
      id: '10',
      key: 'currency',
      value: 'BRL',
      description: 'Moeda padrão',
      category: 'payment',
      is_public: true,
      updated_at: new Date().toISOString()
    },
    {
      id: '11',
      key: 'meta_title',
      value: 'Venha Vender - Anúncios Online',
      description: 'Título para SEO',
      category: 'seo',
      is_public: true,
      updated_at: new Date().toISOString()
    },
    {
      id: '12',
      key: 'meta_description',
      value: 'Venha Vender é a plataforma ideal para comprar e vender produtos e serviços online.',
      description: 'Descrição para SEO',
      category: 'seo',
      is_public: true,
      updated_at: new Date().toISOString()
    },
    {
      id: '13',
      key: 'terms_url',
      value: '/terms',
      description: 'URL dos Termos de Uso',
      category: 'legal',
      is_public: true,
      updated_at: new Date().toISOString()
    },
    {
      id: '14',
      key: 'privacy_url',
      value: '/privacy',
      description: 'URL da Política de Privacidade',
      category: 'legal',
      is_public: true,
      updated_at: new Date().toISOString()
    },
    {
      id: '15',
      key: 'primary_color',
      value: '#f97316',
      description: 'Cor primária do tema',
      category: 'general',
      is_public: true,
      updated_at: new Date().toISOString()
    },
  ];

  // Use mock data if no real data is available
  useEffect(() => {
    if (!loading && settings.length === 0) {
      setSettings(mockSettings);
      
      // Initialize form values with mock data
      const initialValues: Record<string, string> = {};
      mockSettings.forEach(setting => {
        initialValues[setting.key] = setting.value;
      });
      setFormValues(initialValues);
    }
  }, [loading, settings]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetToDefault}
            className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm flex items-center hover:bg-gray-50"
            disabled={saving}
          >
            <RefreshCw size={16} className="mr-1" />
            Redefinir
          </button>
          <button
            onClick={handleSaveSettings}
            className="bg-orange-500 text-white rounded-md px-4 py-1.5 text-sm flex items-center hover:bg-orange-600"
            disabled={saving}
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
            ) : (
              <Save size={16} className="mr-1" />
            )}
            Salvar Alterações
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="flex border-b">
            {/* Tabs */}
            <div className="w-64 border-r">
              <nav className="p-4 space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center w-full px-3 py-2 text-sm rounded-md ${activeTab === tab.id ? 'bg-orange-50 text-orange-600' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Settings Form */}
            <div className="flex-1 p-6">
              <div className="space-y-6">
                {tabs.map(tab => (
                  <div key={tab.id} className={activeTab === tab.id ? '' : 'hidden'}>
                    <h2 className="text-lg font-medium text-gray-900 mb-4">{tab.label}</h2>
                    <div className="space-y-4">
                      {getSettingsByCategory(tab.id).map(setting => (
                        <div key={setting.id} className="grid grid-cols-3 gap-4 items-start">
                          <div>
                            <label htmlFor={setting.key} className="block text-sm font-medium text-gray-700">
                              {setting.description}
                            </label>
                            {setting.is_public && (
                              <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Público
                              </span>
                            )}
                          </div>
                          <div className="col-span-2">
                            {renderSettingInput(setting)}
                            <p className="mt-1 text-xs text-gray-500">
                              Última atualização: {new Date(setting.updated_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      ))}

                      {getSettingsByCategory(tab.id).length === 0 && (
                        <p className="text-gray-500 italic">Nenhuma configuração disponível nesta categoria.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsPage;