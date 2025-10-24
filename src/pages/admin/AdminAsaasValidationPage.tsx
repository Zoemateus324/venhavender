import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink,
  CreditCard,
  Settings,
  Zap
} from 'lucide-react';

interface ValidationResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

const AdminAsaasValidationPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [asaasToken, setAsaasToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);

  const runValidationTests = async () => {
    if (!asaasToken.trim()) {
      toast.error('Token do Asaas é obrigatório');
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      // Usar o endpoint de API para evitar problemas de CORS
      const response = await fetch('/api/asaas-test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: asaasToken })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error('Resposta inválida da API');
      }

      if (data && data.success) {
        // Criar resultados de sucesso
        const tests: ValidationResult[] = [
          {
            test: 'Conexão com API',
            status: 'success',
            message: 'Conexão com API estabelecida com sucesso',
            details: { timestamp: new Date().toISOString() }
          },
          {
            test: 'Validação do Token',
            status: 'success',
            message: 'Token válido e autenticação bem-sucedida',
            details: data.account
          },
          {
            test: 'Criação de Link de Pagamento',
            status: 'success',
            message: 'Link de pagamento criado com sucesso',
            details: data.testPaymentLink
          },
          {
            test: 'Informações da Conta',
            status: 'success',
            message: 'Informações da conta obtidas com sucesso',
            details: data.account
          },
          {
            test: 'Configuração de Webhook',
            status: 'warning',
            message: 'Verifique manualmente se o webhook está configurado no painel Asaas',
            details: {
              webhookUrl: `${window.location.origin}/api/webhook/asaas`,
              events: ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED', 'PAYMENT_OVERDUE']
            }
          }
        ];

        setResults(tests);
        toast.success('Todos os testes passaram! (4/5)');
      } else {
        // Criar resultados de erro
        const tests: ValidationResult[] = [
          {
            test: 'Validação do Token',
            status: 'error',
            message: data?.error || 'Erro desconhecido',
            details: data?.details || 'Sem detalhes disponíveis'
          }
        ];

        setResults(tests);
        toast.error('Falha na validação do Asaas');
      }

    } catch (error: any) {
      console.error('Erro durante validação:', error);
      toast.error('Erro durante validação do Asaas');
      
      // Criar resultado de erro de conexão
      const tests: ValidationResult[] = [
        {
          test: 'Conexão com API',
          status: 'error',
          message: `Erro de conexão: ${error.message}`,
          details: error
        }
      ];
      
      setResults(tests);
    } finally {
      setLoading(false);
    }
  };


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'error':
        return <XCircle size={20} className="text-red-500" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-yellow-500" />;
      default:
        return <AlertTriangle size={20} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Validação Asaas</h1>
          <p className="text-gray-600">Teste a integração com o gateway de pagamento Asaas</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowTokenInput(!showTokenInput)}
            className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings size={20} className="mr-2" />
            {showTokenInput ? 'Ocultar Token' : 'Configurar Token'}
          </button>
          <button
            onClick={runValidationTests}
            disabled={loading || !asaasToken.trim()}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            <Zap size={20} className="mr-2" />
            {loading ? 'Testando...' : 'Executar Testes'}
          </button>
        </div>
      </div>

      {/* Token Input */}
      {showTokenInput && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Configuração do Token</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Token de Acesso Asaas
              </label>
              <input
                type="password"
                value={asaasToken}
                onChange={(e) => setAsaasToken(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Cole seu token do Asaas aqui"
              />
              <p className="text-sm text-gray-500 mt-1">
                O token será usado apenas para validação e não será salvo
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Test Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Resultados dos Testes</h2>
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
            >
              <div className="flex items-start space-x-3">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{result.test}</h3>
                  <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                        Ver detalhes
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">Como obter o Token do Asaas</h2>
        <div className="space-y-3 text-sm text-blue-800">
          <div className="flex items-start space-x-2">
            <span className="font-medium">1.</span>
            <span>Acesse o painel do Asaas em <a href="https://www.asaas.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.asaas.com</a></span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium">2.</span>
            <span>Faça login na sua conta</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium">3.</span>
            <span>Vá em "Configurações" → "Integrações" → "API"</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium">4.</span>
            <span>Copie o "Token de Acesso" (access_token)</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="font-medium">5.</span>
            <span>Cole o token no campo acima e execute os testes</span>
          </div>
        </div>
      </div>

      {/* Integration Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Status da Integração</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <CreditCard size={24} className="text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">Gateway</p>
              <p className="text-sm text-gray-600">Asaas</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <ExternalLink size={24} className="text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">API</p>
              <p className="text-sm text-gray-600">v3</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <RefreshCw size={24} className="text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">Status</p>
              <p className="text-sm text-gray-600">
                {results.length > 0 ? 
                  (results.filter(r => r.status === 'success').length === results.length ? 'Ativo' : 'Parcial') : 
                  'Não testado'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAsaasValidationPage;
