import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Plan } from '../../types';

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<Plan | null>(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    price: 0,
    duration_days: 15,
    photo_limit: 1,
    direct_contact: false,
    featured: false,
    active: true,
    asaas_payment_link: ''
  });
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .order('price', { ascending: true });

        if (error) throw error;
        setPlans(data || []);
      } catch (err) {
        setError('Falha ao carregar planos');
        console.error('Error fetching plans:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlans();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('plans')
        .update({ active: !currentStatus })
        .eq('id', planId);

      if (error) throw error;

      setPlans(plans.map(plan => 
        plan.id === planId ? ({ ...plan, active: !currentStatus } as Plan) : plan
      ));
    } catch (err) {
      console.error('Error updating plan status:', err);
      alert('Falha ao atualizar status do plano');
    }
  };

  const handleCreatePlan = async () => {
    try {
      // Validate and normalize input before creating the plan
      const nameTrimmed = createForm.name.trim();
      if (!nameTrimmed) {
        alert('O nome do plano é obrigatório');
        return;
      }

      // Normalize optional fields (avoid sending empty strings)
      const normalizedCreateForm = {
        ...createForm,
        name: nameTrimmed,
        asaas_payment_link: createForm.asaas_payment_link?.trim() || null
      };

      // Precompute slug and ensure uniqueness
      const slug = slugify(nameTrimmed);
      const { data: existing, error: existingError } = await supabase
        .from('plans')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (existingError) throw existingError;
      if (existing) {
        alert('Já existe um plano com esse nome');
        return;
      }

      // Use a distinct variable to avoid shadowing React state and TDZ issues
      const normalized = normalizedCreateForm;
      const payload: any = {
        name: normalized.name,
        description: normalized.description,
        price: Number(normalized.price) || 0,
        duration_days: Number(normalized.duration_days) || 15,
        photo_limit: Number(normalized.photo_limit) || 1,
        direct_contact: normalized.direct_contact,
        featured: normalized.featured,
        active: normalized.active,
        slug: slugify(normalized.name)
      };
      if (normalized.asaas_payment_link) {
        payload.asaas_payment_link = normalized.asaas_payment_link;
      }

      const { data, error } = await supabase
        .from('plans')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      setPlans(prev => [...prev, data as Plan]);
      setShowCreate(false);
      setCreateForm({
        name: '', description: '', price: 0, duration_days: 15,
        photo_limit: 1, direct_contact: false, featured: false, active: true,
        asaas_payment_link: ''
      });
    } catch (err) {
      console.error('Error creating plan:', err);
      alert('Falha ao criar plano');
    }
  };

  const handleUpdatePlan = async (plan: Plan) => {
    try {
      const updatePayload: any = {
        name: plan.name,
        description: plan.description,
        price: plan.price,
        duration_days: plan.duration_days,
        photo_limit: plan.photo_limit,
        direct_contact: plan.direct_contact,
        featured: plan.featured,
        active: plan.active
      };
      if (plan.asaas_payment_link) {
        updatePayload.asaas_payment_link = plan.asaas_payment_link;
      }

      const { error } = await supabase
        .from('plans')
        .update(updatePayload)
        .eq('id', plan.id);

      if (error) throw error;

      setPlans(prev => prev.map(p => p.id === plan.id ? plan : p));
      setShowEdit(null);
    } catch (err) {
      console.error('Error updating plan:', err);
      alert('Falha ao atualizar plano');
    }
  };

  const generateAsaasLink = async (plan: Plan) => {
    try {
      setGeneratingId(plan.id);
      const resp = await fetch('/api/asaas-create-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: plan.name,
          description: plan.description || `Checkout do plano ${plan.name}`,
          value: Number(plan.price) || 0,
          planId: plan.id
        })
      });
      const json = await resp.json();
      if (!resp.ok) {
        throw new Error(json?.error || 'Falha ao gerar link Asaas');
      }
      const link = json?.url || json?.paymentLinkUrl || json?.shortUrl || json?.data?.url;
      if (!link) throw new Error('Resposta Asaas sem URL');

      const { error } = await supabase
        .from('plans')
        .update({ asaas_payment_link: link })
        .eq('id', plan.id);
      if (error) throw error;

      setPlans(prev => prev.map(p => p.id === plan.id ? ({ ...p, asaas_payment_link: link } as Plan) : p));
      alert('Link Asaas gerado com sucesso');
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || '';
      if (msg.includes('asaas_payment_link') || msg.includes('schema cache') || msg.includes('PGRST204')) {
        alert('A coluna asaas_payment_link ainda não existe no banco. Aplique a migração para criar a coluna e tente novamente.');
      } else {
        alert('Erro ao gerar link Asaas');
      }
    } finally {
      setGeneratingId(null);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Carregando planos...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Planos</h1>
        <button 
          type="button"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => setShowCreate(true)}
        >
          Adicionar Plano
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duração</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Checkout Asaas</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {plans.length > 0 ? (
              plans.map((plan) => (
                <tr key={plan.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{plan.name}</td>
                  <td className="px-6 py-4">{plan.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatPrice(plan.price)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{plan.duration_days} dias</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${plan.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {plan.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {plan.asaas_payment_link ? (
                      <a 
                        href={plan.asaas_payment_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Abrir Link
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                      onClick={() => setShowEdit(plan)}
                    >
                      Editar
                    </button>
                    <button
                      className="text-blue-600 hover:text-blue-900 mr-4 disabled:opacity-50"
                      disabled={generatingId === plan.id}
                      onClick={() => generateAsaasLink(plan)}
                    >
                      {generatingId === plan.id ? 'Gerando...' : (plan.asaas_payment_link ? 'Atualizar Link Asaas' : 'Gerar Link Asaas')}
                    </button>
                    <button 
                      className={`${plan.active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                      onClick={() => togglePlanStatus(plan.id, plan.active)}
                    >
                      {plan.active ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  Nenhum plano encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Novo Plano</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input className="mt-1 w-full border rounded px-3 py-2" value={createForm.name} onChange={e=>setCreateForm({...createForm, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <textarea className="mt-1 w-full border rounded px-3 py-2" value={createForm.description} onChange={e=>setCreateForm({...createForm, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preço (R$)</label>
                  <input type="number" step="0.01" className="mt-1 w-full border rounded px-3 py-2" value={createForm.price} onChange={e=>setCreateForm({...createForm, price: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duração (dias)</label>
                  <input type="number" className="mt-1 w-full border rounded px-3 py-2" value={createForm.duration_days} onChange={e=>setCreateForm({...createForm, duration_days: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fotos</label>
                  <input type="number" className="mt-1 w-full border rounded px-3 py-2" value={createForm.photo_limit} onChange={e=>setCreateForm({...createForm, photo_limit: Number(e.target.value)})} />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={createForm.direct_contact} onChange={e=>setCreateForm({...createForm, direct_contact: e.target.checked})} />
                  Contato direto
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={createForm.featured} onChange={e=>setCreateForm({...createForm, featured: e.target.checked})} />
                  Destaque
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={createForm.active} onChange={e=>setCreateForm({...createForm, active: e.target.checked})} />
                  Ativo
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Link de Checkout Asaas (opcional)</label>
                <input className="mt-1 w-full border rounded px-3 py-2" value={createForm.asaas_payment_link} onChange={e=>setCreateForm({...createForm, asaas_payment_link: e.target.value})} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="px-4 py-2 rounded border" onClick={()=>setShowCreate(false)}>Cancelar</button>
              <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={handleCreatePlan}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {showEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Editar Plano</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input className="mt-1 w-full border rounded px-3 py-2" value={showEdit.name} onChange={e=>setShowEdit({...showEdit, name: e.target.value}) as any} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <textarea className="mt-1 w-full border rounded px-3 py-2" value={showEdit.description || ''} onChange={e=>setShowEdit({...showEdit, description: e.target.value}) as any} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preço (R$)</label>
                  <input type="number" step="0.01" className="mt-1 w-full border rounded px-3 py-2" value={showEdit.price} onChange={e=>setShowEdit({...showEdit, price: Number(e.target.value)}) as any} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duração (dias)</label>
                  <input type="number" className="mt-1 w-full border rounded px-3 py-2" value={showEdit.duration_days} onChange={e=>setShowEdit({...showEdit, duration_days: Number(e.target.value)}) as any} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fotos</label>
                  <input type="number" className="mt-1 w-full border rounded px-3 py-2" value={showEdit.photo_limit} onChange={e=>setShowEdit({...showEdit, photo_limit: Number(e.target.value)}) as any} />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!showEdit.direct_contact} onChange={e=>setShowEdit({...showEdit, direct_contact: e.target.checked}) as any} />
                  Contato direto
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!showEdit.featured} onChange={e=>setShowEdit({...showEdit, featured: e.target.checked}) as any} />
                  Destaque
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!showEdit.active} onChange={e=>setShowEdit({...showEdit, active: e.target.checked}) as any} />
                  Ativo
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Link de Checkout Asaas</label>
                <input className="mt-1 w-full border rounded px-3 py-2" value={showEdit.asaas_payment_link || ''} onChange={e=>setShowEdit({...showEdit, asaas_payment_link: e.target.value}) as any} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="px-4 py-2 rounded border" onClick={()=>setShowEdit(null)}>Cancelar</button>
              <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={()=>handleUpdatePlan(showEdit as any)}>Salvar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}