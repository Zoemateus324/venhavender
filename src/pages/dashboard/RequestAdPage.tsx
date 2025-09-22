import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Send, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const RequestAdPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    adType: 'standard',
    category: '',
    duration: '7',
    contactPreference: 'email'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Você precisa estar logado para solicitar um anúncio');
      return;
    }

    try {
      setLoading(true);
      
      // Create ad request in database
      const { data, error } = await supabase
        .from('ad_requests')
        .insert([
          {
            user_id: user.id,
            title: formData.title,
            description: formData.description,
            ad_type: formData.adType,
            category: formData.category,
            duration_days: parseInt(formData.duration),
            contact_preference: formData.contactPreference,
            status: 'pending'
          }
        ]);

      if (error) throw error;

      toast.success('Solicitação de anúncio enviada com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      toast.error('Erro ao enviar solicitação de anúncio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Solicitar Anúncio Especial</h1>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-blue-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Anúncios especiais são destacados em áreas premium do site. Nossa equipe analisará sua solicitação e entrará em contato em até 24 horas úteis.
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Título do Anúncio *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: Apartamento de luxo no centro"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descrição do Anúncio *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Descreva seu anúncio em detalhes..."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="adType" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Anúncio *
              </label>
              <select
                id="adType"
                name="adType"
                value={formData.adType}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="standard">Padrão</option>
                <option value="featured">Destaque</option>
                <option value="premium">Premium</option>
                <option value="banner">Banner</option>
                <option value="footer">Rodapé</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Categoria *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecione uma categoria</option>
                <option value="imoveis">Imóveis</option>
                <option value="veiculos">Veículos</option>
                <option value="eletronicos">Eletrônicos</option>
                <option value="moveis">Móveis</option>
                <option value="servicos">Serviços</option>
                <option value="outros">Outros</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                Duração (dias) *
              </label>
              <select
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="7">7 dias</option>
                <option value="15">15 dias</option>
                <option value="30">30 dias</option>
                <option value="60">60 dias</option>
                <option value="90">90 dias</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="contactPreference" className="block text-sm font-medium text-gray-700 mb-1">
                Preferência de Contato *
              </label>
              <select
                id="contactPreference"
                name="contactPreference"
                value={formData.contactPreference}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="email">Email</option>
                <option value="phone">Telefone</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Send size={18} className="mr-2" />
                  Enviar Solicitação
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Informações Adicionais</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-800">Tipos de Anúncios Especiais</h3>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li><span className="font-medium">Destaque:</span> Seu anúncio aparece no topo dos resultados de busca.</li>
              <li><span className="font-medium">Premium:</span> Seu anúncio aparece na página inicial e tem um selo especial.</li>
              <li><span className="font-medium">Banner:</span> Seu anúncio aparece como um banner no topo do site.</li>
              <li><span className="font-medium">Rodapé:</span> Seu anúncio aparece no rodapé de todas as páginas.</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-800">Processo de Aprovação</h3>
            <p className="mt-1 text-sm text-gray-600">
              Após o envio da solicitação, nossa equipe analisará o conteúdo e entrará em contato para discutir valores e detalhes. O tempo médio de aprovação é de 24 horas úteis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestAdPage;