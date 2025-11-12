import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Coupon } from '../../types';

type CouponFormState = {
  code: string;
  description: string;
  discount_percent: number;
  max_uses: string;
  expires_at: string;
  active: boolean;
};

const emptyForm: CouponFormState = {
  code: '',
  description: '',
  discount_percent: 10,
  max_uses: '',
  expires_at: '',
  active: true
};

function formatPercent(value: number) {
  return `${value.toFixed(2).replace('.', ',')}%`;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
}

function toInputDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponFormState>(emptyForm);

  const hasCoupons = useMemo(() => coupons.length > 0, [coupons.length]);

  const loadCoupons = async () => {
    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setCoupons(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching coupons:', err);
      setError('Falha ao carregar cupons.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discount_percent: coupon.discount_percent,
      max_uses: coupon.max_uses != null ? String(coupon.max_uses) : '',
      expires_at: toInputDate(coupon.expires_at),
      active: coupon.active
    });
    setShowForm(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setShowForm(false);
    setEditingCoupon(null);
    setForm(emptyForm);
  };

  const handleChange = (field: keyof CouponFormState, value: string | boolean | number) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const normalizedCode = form.code.trim().toUpperCase();
    if (!normalizedCode) {
      alert('O código do cupom é obrigatório.');
      return null;
    }

    const discount = Number(form.discount_percent);
    if (Number.isNaN(discount) || discount <= 0 || discount > 100) {
      alert('Informe um percentual de desconto entre 0 e 100.');
      return null;
    }

    let maxUses: number | null = null;
    if (form.max_uses.trim()) {
      const parsed = Number(form.max_uses);
      if (Number.isNaN(parsed) || parsed < 0) {
        alert('O limite de uso deve ser um número maior ou igual a zero.');
        return null;
      }
      maxUses = parsed;
    }

    let expiresAt: string | null = null;
    if (form.expires_at) {
      const parsed = new Date(form.expires_at);
      if (Number.isNaN(parsed.getTime())) {
        alert('Data de expiração inválida.');
        return null;
      }
      expiresAt = parsed.toISOString();
    }

    return {
      code: normalizedCode,
      description: form.description.trim() || null,
      discount_percent: Number(discount),
      max_uses: maxUses,
      expires_at: expiresAt,
      active: form.active
    };
  };

  const handleSubmit = async () => {
    const payload = validateForm();
    if (!payload) return;

    setIsSaving(true);
    try {
      if (editingCoupon) {
        const { data, error: updateError } = await supabase
          .from('coupons')
          .update({
            ...payload,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCoupon.id)
          .select()
          .single();

        if (updateError) throw updateError;

        setCoupons(prev =>
          prev.map(c => (c.id === editingCoupon.id ? (data as Coupon) : c))
        );
        alert('Cupom atualizado com sucesso.');
      } else {
        const { data, error: insertError } = await supabase
          .from('coupons')
          .insert([{ ...payload }])
          .select()
          .single();

        if (insertError) throw insertError;

        setCoupons(prev => [data as Coupon, ...prev]);
        alert('Cupom criado com sucesso.');
      }

      closeModal();
    } catch (err: any) {
      console.error('Error saving coupon:', err);
      const message = err?.message || '';
      if (message.includes('coupons_code_unique_idx')) {
        alert('Já existe um cupom com esse código.');
      } else {
        alert('Não foi possível salvar o cupom.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const { data, error: toggleError } = await supabase
        .from('coupons')
        .update({
          active: !coupon.active,
          updated_at: new Date().toISOString()
        })
        .eq('id', coupon.id)
        .select()
        .single();

      if (toggleError) throw toggleError;

      setCoupons(prev =>
        prev.map(c => (c.id === coupon.id ? (data as Coupon) : c))
      );
    } catch (err) {
      console.error('Error toggling coupon:', err);
      alert('Não foi possível atualizar o status do cupom.');
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Deseja realmente excluir o cupom "${coupon.code}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setIsDeleting(coupon.id);
      const { error: deleteError } = await supabase
        .from('coupons')
        .delete()
        .eq('id', coupon.id);

      if (deleteError) throw deleteError;

      setCoupons(prev => prev.filter(c => c.id !== coupon.id));
      alert('Cupom excluído com sucesso.');
    } catch (err) {
      console.error('Error deleting coupon:', err);
      alert('Não foi possível excluir o cupom.');
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Carregando cupons...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl lg:text-2xl font-bold">Cupons de Desconto</h1>
        <button
          type="button"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto"
          onClick={openCreateModal}
        >
          Criar Cupom
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desconto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expira em</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hasCoupons ? (
                coupons.map(coupon => (
                  <tr key={coupon.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{coupon.code}</td>
                    <td className="px-6 py-4 max-w-xs text-sm text-gray-600 truncate">{coupon.description || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatPercent(Number(coupon.discount_percent || 0))}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {coupon.usage_count}
                      {coupon.max_uses != null ? ` / ${coupon.max_uses}` : ' / ∞'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(coupon.expires_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${coupon.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {coupon.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 text-xs"
                          onClick={() => openEditModal(coupon)}
                        >
                          Editar
                        </button>
                        <button
                          className={`${coupon.active ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-600 hover:bg-green-700'} text-white px-3 py-1.5 rounded text-xs`}
                          onClick={() => handleToggleActive(coupon)}
                        >
                          {coupon.active ? 'Desativar' : 'Ativar'}
                        </button>
                        <button
                          className="bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 text-xs disabled:opacity-50"
                          disabled={isDeleting === coupon.id}
                          onClick={() => handleDelete(coupon)}
                        >
                          {isDeleting === coupon.id ? 'Excluindo...' : 'Excluir'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    Nenhum cupom cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-xl rounded-lg shadow-lg p-4 lg:p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg lg:text-xl font-semibold mb-4">
              {editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Código *</label>
                <input
                  className="mt-1 w-full border rounded px-3 py-2 uppercase"
                  value={form.code}
                  onChange={e => handleChange('code', e.target.value.toUpperCase())}
                  maxLength={32}
                  placeholder="EXEMPLO10"
                  disabled={isSaving && !!editingCoupon}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <textarea
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={form.description}
                  onChange={e => handleChange('description', e.target.value)}
                  rows={3}
                  placeholder="Detalhes do benefício ou público alvo"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">% de desconto *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.01"
                    className="mt-1 w-full border rounded px-3 py-2"
                    value={form.discount_percent}
                    onChange={e => handleChange('discount_percent', Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Limite de uso</label>
                  <input
                    type="number"
                    min="0"
                    className="mt-1 w-full border rounded px-3 py-2"
                    value={form.max_uses}
                    onChange={e => handleChange('max_uses', e.target.value)}
                    placeholder="Ilimitado se vazio"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    className="mt-1 w-full border rounded px-3 py-2"
                    value={form.active ? 'active' : 'inactive'}
                    onChange={e => handleChange('active', e.target.value === 'active')}
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Expira em</label>
                <input
                  type="datetime-local"
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={form.expires_at}
                  onChange={e => handleChange('expires_at', e.target.value)}
                />
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
              <button
                className="px-4 py-2 rounded border w-full sm:w-auto"
                type="button"
                disabled={isSaving}
                onClick={closeModal}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white w-full sm:w-auto disabled:opacity-60"
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

