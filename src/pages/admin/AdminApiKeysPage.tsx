import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface ApiKey {
  id: string;
  user_id: string;
  key: string;
  name: string;
  permissions: string[];
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  user_name?: string;
}

export default function AdminApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchApiKeys() {
      try {
        const { data, error } = await supabase
          .from('api_keys')
          .select(`
            *,
            users:user_id (name, email)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Format the data to include user_name
        const formattedData = data?.map(key => ({
          ...key,
          user_name: key.users?.name || 'Usuário desconhecido',
        })) || [];

        setApiKeys(formattedData);
      } catch (err) {
        setError('Falha ao carregar chaves de API');
        console.error('Error fetching API keys:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchApiKeys();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Sem expiração';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const toggleKeyStatus = async (keyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !currentStatus })
        .eq('id', keyId);

      if (error) throw error;

      // Update local state
      setApiKeys(apiKeys.map(key => 
        key.id === keyId ? { ...key, is_active: !currentStatus } : key
      ));
    } catch (err) {
      console.error('Error updating API key status:', err);
      alert('Falha ao atualizar status da chave de API');
    }
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
  };

  if (isLoading) return <div className="p-8 text-center">Carregando chaves de API...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Chaves de API</h1>
        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => alert('Funcionalidade para gerar nova chave de API')}
        >
          Gerar Nova Chave
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chave</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissões</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criada em</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expira em</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {apiKeys.length > 0 ? (
              apiKeys.map((apiKey) => (
                <tr key={apiKey.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{apiKey.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{apiKey.user_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{maskApiKey(apiKey.key)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {apiKey.permissions.map((permission, index) => (
                        <span 
                          key={index} 
                          className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(apiKey.created_at)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(apiKey.expires_at)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${apiKey.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {apiKey.is_active ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                      onClick={() => alert(`Visualizar detalhes da chave ${apiKey.id}`)}
                    >
                      Detalhes
                    </button>
                    <button 
                      className={`${apiKey.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                      onClick={() => toggleKeyStatus(apiKey.id, apiKey.is_active)}
                    >
                      {apiKey.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                  Nenhuma chave de API encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}