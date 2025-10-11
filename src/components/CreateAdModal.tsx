import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Category, Plan, FOOTER_AD_CONTRACTS } from '../types';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';

interface CreateAdModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateAdModal({ onClose, onSuccess }: CreateAdModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [ownerId, setOwnerId] = useState<string>('');
  const [allUsers, setAllUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
    location: '',
    photos: [] as string[],
    plan_id: '',
    type: 'grid' as 'grid' | 'header' | 'footer',
    ad_type: 'sale' as 'sale' | 'rent',
    contact_info: {},
    footer_exposures: 720,
    footer_art_needed: false
  });

  useEffect(() => {
    fetchCategories();
    fetchPlans();
    // Se for admin, carregar usuários para poder criar anúncio em nome de alguém
    fetchUsersForAdmin();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('active', true)
        .order('price');

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchUsersForAdmin = async () => {
    try {
      // evita erro se não autenticado ainda
      if (!user || user.role !== 'admin') return;
      const { data } = await supabase
        .from('users')
        .select('id, name, email')
        .order('created_at', { ascending: false });
      setAllUsers(data || []);
    } catch (error) {
      // ignore
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUploadImages = async (files: FileList | null) => {
    if (!files) return;
    const limit = getCurrentPhotoLimit();
    const remaining = limit - formData.photos.length;
    const filesToUpload = Array.from(files).slice(0, Math.max(0, remaining));

    if (filesToUpload.length === 0) {
      toast.error('Limite de fotos atingido para o plano selecionado.');
      return;
    }

    try {
      setLoading(true);
      const uploadedUrls: string[] = [];
      for (const file of filesToUpload) {
        const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `image-ads/${ownerId || user?.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('ads').upload(filePath, file, { upsert: false });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('ads').getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
      }
      setFormData(prev => ({ ...prev, photos: [...prev.photos, ...uploadedUrls] }));
      toast.success('Imagem(ns) enviada(s) com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast.error('Falha no upload da imagem.');
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const getCurrentPhotoLimit = () => {
    if (formData.type === 'footer') return 999;
    
    const selectedPlan = plans.find(p => p.id === formData.plan_id);
    return selectedPlan?.photo_limit || 1;
  };

  const getAdDuration = () => {
    if (formData.type === 'footer') return 30;
    
    const selectedPlan = plans.find(p => p.id === formData.plan_id);
    return selectedPlan?.duration_days || 15;
  };

  const getAdPrice = () => {
    if (formData.type === 'footer') {
      const contract = FOOTER_AD_CONTRACTS.find(c => c.exposures === formData.footer_exposures);
      const basePrice = contract?.price || 0;
      return basePrice + (formData.footer_art_needed ? 50 : 0);
    }
    
    const selectedPlan = plans.find(p => p.id === formData.plan_id);
    return selectedPlan?.price || 0;
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + getAdDuration());

      const adData = {
        user_id: ownerId || user.id,
        category_id: formData.category_id,
        type: formData.type,
        // ad_type: formData.ad_type, // Temporarily commented out until migration is applied
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        photos: formData.photos,
        location: formData.location,
        contact_info: formData.contact_info,
        plan_id: formData.plan_id || null,
        end_date: endDate.toISOString(),
        status: formData.type === 'footer' ? 'pending' : 'active',
        max_exposures: formData.type === 'footer' ? formData.footer_exposures : 0,
        admin_approved: formData.type !== 'footer'
      };

      const { error } = await supabase
        .from('ads')
        .insert([adData]);

      if (error) throw error;

      // If it's a paid plan, create payment record
      const planPrice = getAdPrice();
      if (planPrice > 0) {
        const paymentData = {
          user_id: ownerId || user.id,
          plan_id: formData.plan_id || null,
          amount: planPrice,
          payment_method: 'pending',
          status: 'pending'
        };

        await supabase.from('payments').insert([paymentData]);
      }

      // Create request for footer ads
      if (formData.type === 'footer') {
        const requestData = {
          user_id: ownerId || user.id,
          ad_type: 'footer',
          duration_days: 30,
          materials: formData.footer_art_needed ? 'Arte necessária' : 'Arte própria',
          observations: `${formData.footer_exposures} exposições`,
          proposed_value: getAdPrice(),
          status: 'pending'
        };

        await supabase.from('requests').insert([requestData]);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating ad:', error);
      alert('Erro ao criar anúncio. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = plans.find(p => p.id === formData.plan_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Criar Anúncio
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          {/* Steps */}
          <div className="mb-8">
            <div className="flex items-center gap-4">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= stepNum
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div
                      className={`w-16 h-1 mx-2 ${
                        step > stepNum ? 'bg-orange-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              {step === 1 && 'Informações básicas'}
              {step === 2 && 'Escolha do plano'}
              {step === 3 && 'Confirmação'}
            </div>
          </div>

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-6">
              {user?.role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vendedor (criar em nome de)</label>
                  <select
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Selecionar usuário… (padrão: meu usuário)</option>
                    {allUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name || u.email} — {u.email}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo do Anúncio *
                  </label>
                  <select
                    name="ad_type"
                    value={formData.ad_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  >
                    <option value="sale">Venda</option>
                    <option value="rent">Locação</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Localização *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fotos
                </label>
                <div className="space-y-3">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <img
                        src={photo}
                        alt={`Foto ${index + 1}`}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/64?text=Erro';
                        }}
                      />
                      <input
                        type="text"
                        readOnly
                        value={photo}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  
                  {formData.photos.length < getCurrentPhotoLimit() && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Enviar imagens</label>
                      <input type="file" multiple accept="image/*" onChange={(e) => handleUploadImages(e.target.files)} />
                      <p className="text-xs text-gray-500 mt-1">Limite: {getCurrentPhotoLimit()} imagem(ns)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!formData.title || !formData.category_id || !formData.description || !formData.price || !formData.location}
                  className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Plan Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Escolha seu plano</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`border rounded-lg p-6 cursor-pointer transition-all ${
                      formData.plan_id === plan.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setFormData(prev => ({ 
                        ...prev, 
                        plan_id: plan.id,
                        type: plan.slug === 'basic' ? 'grid' : 'header'
                      }));
                    }}
                  >
                    <div className="text-center">
                      <h4 className="font-semibold text-lg">{plan.name}</h4>
                      <div className="text-2xl font-bold text-orange-600 my-2">
                        {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2)}`}
                      </div>
                      <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                      
                      <div className="space-y-2 text-sm text-left">
                        <div>• {plan.duration_days} dias de exibição</div>
                        <div>• Até {plan.photo_limit === 999 ? 'ilimitadas' : plan.photo_limit} foto{plan.photo_limit !== 1 ? 's' : ''}</div>
                        <div>• {plan.direct_contact ? 'Contato direto' : 'Chat interno'}</div>
                        {plan.featured && <div>• Anúncio em destaque</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Ad Option */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-lg mb-4">Anúncio de Rodapé</h4>
                <div
                  className={`border rounded-lg p-6 cursor-pointer transition-all ${
                    formData.type === 'footer'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setFormData(prev => ({ 
                      ...prev, 
                      type: 'footer',
                      plan_id: ''
                    }));
                  }}
                >
                  <div className="mb-4">
                    <h5 className="font-medium">Anúncio de Rodapé Rotativo</h5>
                    <p className="text-sm text-gray-600">Seu anúncio aparece no rodapé do site por 30 segundos</p>
                  </div>

                  {formData.type === 'footer' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantidade de exposições
                        </label>
                        <select
                          value={formData.footer_exposures}
                          onChange={(e) => setFormData(prev => ({ ...prev, footer_exposures: parseInt(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        >
                          {FOOTER_AD_CONTRACTS.map((contract) => (
                            <option key={contract.exposures} value={contract.exposures}>
                              {contract.exposures} exposições - R$ {contract.price.toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.footer_art_needed}
                            onChange={(e) => setFormData(prev => ({ ...prev, footer_art_needed: e.target.checked }))}
                            className="rounded"
                          />
                          <span className="text-sm">Preciso de confecção de arte (+R$ 50,00)</span>
                        </label>
                      </div>

                      <div className="text-lg font-bold text-orange-600">
                        Total: R$ {getAdPrice().toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Voltar
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!formData.plan_id && formData.type !== 'footer'}
                  className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Confirmar Anúncio</h3>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Informações do Anúncio</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Título:</strong> {formData.title}</div>
                      <div><strong>Tipo:</strong> {formData.ad_type === 'sale' ? 'Venda' : 'Locação'}</div>
                      <div><strong>Preço:</strong> R$ {parseFloat(formData.price || '0').toFixed(2)}</div>
                      <div><strong>Localização:</strong> {formData.location}</div>
                      <div><strong>Fotos:</strong> {formData.photos.length}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Plano Selecionado</h4>
                    <div className="space-y-1 text-sm">
                      {formData.type === 'footer' ? (
                        <>
                          <div><strong>Tipo:</strong> Anúncio de Rodapé</div>
                          <div><strong>Exposições:</strong> {formData.footer_exposures}</div>
                          <div><strong>Duração:</strong> 30 dias</div>
                          <div><strong>Valor:</strong> R$ {getAdPrice().toFixed(2)}</div>
                        </>
                      ) : (
                        <>
                          <div><strong>Plano:</strong> {selectedPlan?.name}</div>
                          <div><strong>Duração:</strong> {getAdDuration()} dias</div>
                          <div><strong>Valor:</strong> R$ {getAdPrice().toFixed(2)}</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {formData.type === 'footer' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-yellow-800">
                    <strong>Atenção:</strong> Anúncios de rodapé precisam ser aprovados pelo administrador antes de serem exibidos.
                    {formData.footer_art_needed && ' A arte será confeccionada pela nossa equipe.'}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Voltar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Criando...' : 'Criar Anúncio'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}