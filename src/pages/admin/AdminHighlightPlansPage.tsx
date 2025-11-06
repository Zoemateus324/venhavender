import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface HighlightPlan {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  duration_days: number;
  badge_label?: string | null;
  badge_color?: string | null;
  active: boolean;
}

const emptyForm: Omit<HighlightPlan, 'id'> = {
  name: '',
  description: '',
  price: 0,
  duration_days: 7,
  badge_label: 'DESTAQUE',
  badge_color: '#f97316',
  active: true,
};

const AdminHighlightPlansPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [plans, setPlans] = useState<HighlightPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<HighlightPlan, 'id'>>(emptyForm);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setPlans([]);
      setLoading(false);
      return;
    }
    fetchPlans();
  }, [authLoading, user]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const { data, error } = await supabase
        .from('highlight_plans')
        .select('*')
        .order('price');
      if (error) throw error;
      setPlans((data || []) as HighlightPlan[]);
    } catch (e: any) {
      console.error('Erro ao carregar planos de destaque:', e);
      setErrorMsg('Não foi possível carregar os planos de destaque.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEdit = (plan: HighlightPlan) => {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      duration_days: plan.duration_days,
      badge_label: plan.badge_label || 'DESTAQUE',
      badge_color: plan.badge_color || '#f97316',
      active: plan.active,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setSaving(true);
      setErrorMsg('');
      if (editingId) {
        const { error } = await supabase
          .from('highlight_plans')
          .update(form)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('highlight_plans')
          .insert([{ ...form }]);
        if (error) throw error;
      }
      await fetchPlans();
      resetForm();
    } catch (e: any) {
      console.error('Erro ao salvar plano de destaque:', e);
      setErrorMsg('Erro ao salvar plano. Verifique as permissões/políticas no Supabase.');
      alert('Erro ao salvar plano. Verifique os dados e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const removePlan = async (id: string) => {
    if (!user) return;
    if (!confirm('Tem certeza que deseja remover este plano?')) return;
    try {
      const { error } = await supabase
        .from('highlight_plans')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchPlans();
      if (editingId === id) resetForm();
    } catch (e: any) {
      console.error('Erro ao remover plano:', e);
      alert('Não foi possível remover o plano.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Planos de Destaque</h1>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">{errorMsg}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">Lista</h2>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {plans.length === 0 && (
                <div className="text-gray-500 text-sm">Nenhum plano cadastrado.</div>
              )}
              {plans.map((p) => (
                <div key={p.id} className="flex items-center justify-between border rounded-lg p-4">
                  <div>
                    <div className="font-semibold text-gray-900">{p.name}</div>
                    <div className="text-sm text-gray-600">
                      {p.duration_days} dias • R$ {p.price.toFixed(2)}
                    </div>
                    {p.badge_label && (
                      <div className="text-xs mt-1" style={{ color: p.badge_color || '#f97316' }}>
                        Selo: {p.badge_label}
                      </div>
                    )}
                    {p.description && (
                      <div className="text-sm text-gray-500 mt-1">{p.description}</div>
                    )}
                    {!p.active && (
                      <div className="text-xs text-red-600 mt-1">Inativo</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200" onClick={() => startEdit(p)}>Editar</button>
                    <button className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100" onClick={() => removePlan(p.id)}>Remover</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">{editingId ? 'Editar Plano' : 'Novo Plano'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input className="w-full border rounded px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea className="w-full border rounded px-3 py-2" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                <input type="number" step="0.01" className="w-full border rounded px-3 py-2" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duração (dias)</label>
                <input type="number" className="w-full border rounded px-3 py-2" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: parseInt(e.target.value || '0', 10) })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Selo</label>
                <input className="w-full border rounded px-3 py-2" value={form.badge_label || ''} onChange={(e) => setForm({ ...form, badge_label: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cor do Selo</label>
                <input type="color" className="w-full border rounded px-3 py-2" value={form.badge_color || '#f97316'} onChange={(e) => setForm({ ...form, badge_color: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input id="active" type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              <label htmlFor="active" className="text-sm text-gray-700">Ativo</label>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-60">
                {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar plano'}
              </button>
              {editingId && (
                <button type="button" className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200" onClick={resetForm}>Cancelar</button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminHighlightPlansPage;


