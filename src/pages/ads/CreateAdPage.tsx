import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import CreateAdModal from '../../components/CreateAdModal';

const CreateAdPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleCreateAdSuccess = () => {
    // Redirect to dashboard ads page after successful creation
    navigate('/dashboard/ads');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} className="mr-2" />
          Voltar
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Criar Anúncio</h1>
        
        <p className="text-gray-600 mb-8">
          Crie seu anúncio preenchendo as informações necessárias. Anúncios com fotos de qualidade e descrições detalhadas têm mais chances de sucesso.
        </p>

        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <Plus size={48} className="text-gray-400 mb-4" />
          <h2 className="text-xl font-medium text-gray-700 mb-2">Criar Novo Anúncio</h2>
          <p className="text-gray-500 mb-6 text-center max-w-md">
            Clique no botão abaixo para começar a criar seu anúncio com fotos, descrição e detalhes.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Abrir Criador no Dashboard
          </button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Dicas para um bom anúncio:</h3>
          <ul className="list-disc pl-5 text-blue-700 space-y-1">
            <li>Use fotos nítidas e bem iluminadas</li>
            <li>Seja detalhado na descrição do produto ou serviço</li>
            <li>Informe o preço correto ou faixa de preço</li>
            <li>Mencione a localização exata ou região</li>
            <li>Responda rapidamente às mensagens dos interessados</li>
          </ul>
        </div>
      </div>

      {showModal && (
        <CreateAdModal 
          onClose={() => setShowModal(false)} 
          onSuccess={handleCreateAdSuccess} 
        />
      )}
    </div>
  );
};

export default CreateAdPage;