import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import StripePaymentForm from '../../components/StripePaymentForm';
import type { Coupon } from '../../types';


interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  max_images: number;
  duration_days: number;
}

interface PendingAdPayload {
  adData: Record<string, any>;
  highlight_plan_id?: string | null;
}

const PaymentPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [, setProcessingPayment] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState<boolean>(false);
  
  // Get plan ID from URL or query params
  const params = new URLSearchParams(window.location.search);
  const planId = params.get('plan_id');
  const specialAdId = params.get('special_ad_id');
  const isSpecialAdFlow = params.get('special_ad') === '1' || !!specialAdId;
  const customAmountParam = params.get('amount');
  const customAmount = customAmountParam ? parseFloat(customAmountParam) : null;
  const exposuresParam = params.get('exposures');
  const footerExposures = exposuresParam ? parseInt(exposuresParam) : 720;
  const highlightPlanId = params.get('highlight_plan_id');
  const adId = params.get('ad_id');

  useEffect(() => {
    if (planId) {
      fetchPlanDetails(planId);
    } else if (highlightPlanId) {
      fetchHighlightPlanDetails(highlightPlanId);
    } else if (isSpecialAdFlow && customAmount && !isNaN(customAmount)) {
      // Configurar pagamento customizado para anúncio de rodapé
      setSelectedPlan({
        id: 'footer-ad',
        name: 'Anúncio de Rodapé',
        price: customAmount,
        description: 'Exibição no rodapé do site',
        features: [],
        max_images: 0,
        duration_days: 30
      });
      setLoading(false);
    } else {
      setLoading(false);
      toast.error('Nenhum item selecionado para pagamento.');
      navigate('/dashboard');
    }
  }, [planId, highlightPlanId]);

  const fetchPlanDetails = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        toast.error('Plano não encontrado.');
        navigate('/dashboard/plans');
        return;
      }

      setSelectedPlan(data);
    } catch (error) {
      console.error('Erro ao carregar detalhes do plano:', error);
      toast.error('Erro ao carregar detalhes do plano.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHighlightPlanDetails = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('highlight_plans')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        toast.error('Plano de destaque não encontrado.');
        navigate('/');
        return;
      }

      setSelectedPlan({
        id: data.id,
        name: `Destaque: ${data.name}`,
        price: data.price,
        description: data.description || 'Plano de destaque de anúncio',
        features: [],
        max_images: 0,
        duration_days: data.duration_days,
      } as any);
    } catch (error) {
      console.error('Erro ao carregar detalhes do plano de destaque:', error);
      toast.error('Erro ao carregar detalhes do destaque.');
    } finally {
      setLoading(false);
    }
  };


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getDiscountedAmount = () => {
    const base = selectedPlan?.price || 0;
    if (!appliedCoupon) return base;
    const discount = Math.min(100, Math.max(0, Number(appliedCoupon.discount_percent) || 0));
    return Math.max(0, base * (1 - discount / 100));
  };

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    try {
      setCouponLoading(true);
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .ilike('code', code)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('Cupom não encontrado.');
        setAppliedCoupon(null);
        return;
      }

      if (!data.active) {
        toast.error('Este cupom está inativo.');
        setAppliedCoupon(null);
        return;
      }

      if (data.expires_at) {
        const expires = new Date(data.expires_at);
        if (!Number.isNaN(expires.getTime()) && expires < new Date()) {
          toast.error('Este cupom já expirou.');
          setAppliedCoupon(null);
          return;
        }
      }

      if (data.max_uses != null && data.usage_count != null && data.usage_count >= data.max_uses) {
        toast.error('Limite de uso do cupom atingido.');
        setAppliedCoupon(null);
        return;
      }

      setAppliedCoupon(data as Coupon);
      setCouponCode(code);
      toast.success('Cupom aplicado com sucesso!');
    } catch (e) {
      console.error('Erro ao validar cupom:', e);
      toast.error('Não foi possível validar o cupom.');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntent: any) => {
    if (!selectedPlan || !user) return;

    let pendingAdData: PendingAdPayload | null = null;
    if (typeof window !== 'undefined') {
      try {
        const rawPendingAd = sessionStorage.getItem('pending_ad_creation');
        if (rawPendingAd) {
          pendingAdData = JSON.parse(rawPendingAd);
        }
      } catch (error) {
        console.error('Erro ao recuperar anúncio pendente:', error);
      }
    }

    let effectiveAdId = adId;

    try {
      setProcessingPayment(true);

      // Create payment record (plano, destaque ou anúncio de rodapé)
      const paymentPayload: any = {
        user_id: user.id,
        amount: selectedPlan.price,
        status: 'completed',
        payment_method: 'stripe',
        stripe_payment_intent_id: paymentIntent.id,
        invoice_url: `https://dashboard.stripe.com/payments/${paymentIntent.id}`,
      };
      if (planId) {
        paymentPayload.plan_id = selectedPlan.id;
      }
      if (isSpecialAdFlow) {
        paymentPayload.metadata = { type: 'footer_ad' };
      }
      if (highlightPlanId) {
        paymentPayload.metadata = { ...(paymentPayload.metadata || {}), type: 'highlight', highlight_plan_id: highlightPlanId, ad_id: adId || null };
      }
      if (appliedCoupon) {
        paymentPayload.coupon_id = appliedCoupon.id;
        paymentPayload.coupon_code = appliedCoupon.code;
        paymentPayload.coupon_discount_percent = String(appliedCoupon.discount_percent);
      }

      const { error: paymentError } = await supabase
        .from('payments')
        .insert([paymentPayload]);

      if (appliedCoupon) {
        const { error: usageError } = await supabase.rpc('increment_coupon_usage', { coupon: appliedCoupon.id });
        if (usageError) {
          console.error('Erro ao incrementar uso do cupom:', usageError);
        }
      }

      if (paymentError) throw paymentError;

      if (!effectiveAdId && pendingAdData?.adData) {
        const adPayload = {
          ...pendingAdData.adData,
          status: 'active',
          admin_approved: true,
          start_date: pendingAdData.adData.start_date || new Date().toISOString()
        };

        const { data: createdAd, error: adInsertError } = await supabase
          .from('ads')
          .insert([adPayload])
          .select('id')
          .single();

        if (adInsertError) throw adInsertError;

        effectiveAdId = createdAd?.id || null;

        if (effectiveAdId) {
          try {
            await supabase
              .from('payments')
              .update({ ad_id: effectiveAdId })
              .eq('stripe_payment_intent_id', paymentIntent.id);
          } catch (updateError) {
            console.warn('Não foi possível vincular pagamento ao anúncio:', updateError);
          }
        }
      }

      // Se for anúncio de rodapé, criar registro apenas conforme necessidade de arte
      if (isSpecialAdFlow) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        let payload: any = null;
        try {
          const raw = sessionStorage.getItem('pending_special_ad');
          if (raw) payload = JSON.parse(raw);
        } catch {}

        if (payload?.footer_art_needed) {
          // Criar solicitação para o admin produzir a arte e não publicar ainda
          const { error: requestError } = await supabase
            .from('requests')
            .insert([
              {
                user_id: user.id,
                ad_type: 'footer',
                duration_days: 30,
                materials: 'Arte necessária',
                observations: `${footerExposures} exposições — aguardando confecção de arte`,
                proposed_value: selectedPlan.price,
                status: 'pending'
              }
            ]);

          if (requestError) throw requestError;
        } else {
          // Sem confecção: publicar direto em special_ads
          const toInsert = {
            title: payload?.title || 'Anúncio de Rodapé',
            description: payload?.description || '',
            price: selectedPlan.price,
            status: 'active',
            expires_at: endDate.toISOString(),
            image_url: payload?.image_url || null,
            small_image_url: payload?.small_image_url || payload?.image_url || null,
            large_image_url: payload?.large_image_url || null
          };

          const { error: specialInsertError } = await supabase
            .from('special_ads')
            .insert([toInsert]);

          if (specialInsertError) throw specialInsertError;
        }

        try { sessionStorage.removeItem('pending_special_ad'); } catch {}
      }

      // Atualizar plano do usuário apenas quando for compra de plano
      if (planId) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + selectedPlan.duration_days);

        const { error: userError } = await supabase
          .from('user_plans')
          .upsert({
            user_id: user.id,
            plan_type: selectedPlan.name,
            plan_status: 'active',
            plan_expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (userError) throw userError;

        // Se houver ad_id, ativar o anúncio após pagamento aprovado
        if (effectiveAdId) {
          const { error: adUpdateError } = await supabase
            .from('ads')
            .update({
              status: 'active',
              admin_approved: true,
            })
            .eq('id', effectiveAdId);
          if (adUpdateError) throw adUpdateError;
        }
      }

      // Se for destaque, atualizar o anúncio com expiracão de destaque
      if (highlightPlanId && effectiveAdId) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (selectedPlan.duration_days || 0));
        const { error: adUpdateError } = await supabase
          .from('ads')
          .update({
            highlight_plan_id: highlightPlanId,
            highlight_expires_at: expiresAt.toISOString(),
            // Ativar anúncio se estiver pendente
            status: 'active',
            admin_approved: true,
          })
          .eq('id', effectiveAdId);
        if (adUpdateError) throw adUpdateError;
      } else if (!highlightPlanId && pendingAdData?.highlight_plan_id && effectiveAdId) {
        const { data: highlightPlan, error: highlightFetchError } = await supabase
          .from('highlight_plans')
          .select('*')
          .eq('id', pendingAdData.highlight_plan_id)
          .single();

        if (!highlightFetchError && highlightPlan) {
          if (Number(highlightPlan.price) > 0) {
            try { sessionStorage.removeItem('pending_ad_creation'); } catch {}
            navigate(`/payment?highlight_plan_id=${encodeURIComponent(highlightPlan.id)}&ad_id=${encodeURIComponent(effectiveAdId)}`);
            return;
          }

          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + (highlightPlan.duration_days || 0));
          const { error: highlightUpdateError } = await supabase
            .from('ads')
            .update({
              highlight_plan_id: highlightPlan.id,
              highlight_expires_at: expiresAt.toISOString(),
              status: 'active',
              admin_approved: true,
            })
            .eq('id', effectiveAdId);

          if (highlightUpdateError) throw highlightUpdateError;
        }
      }

      if (pendingAdData) {
        try { sessionStorage.removeItem('pending_ad_creation'); } catch {}
      }

      toast.success('Pagamento processado com sucesso!');
      navigate('/');
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePaymentError = (error: string) => {
    toast.error(error);
    setProcessingPayment(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!selectedPlan) {
    return (
      <div className="text-center py-8">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Item de pagamento não encontrado</h2>
        <p className="text-gray-600 mb-4">O item selecionado não está disponível.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Payment Form */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Método de Pagamento</h2>
            
            
            <StripePaymentForm
              amount={getDiscountedAmount()}
              currency="brl"
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              metadata={{
                ...(planId
                  ? { plan_id: selectedPlan.id, plan_name: selectedPlan.name }
                  : { special_ad_id: specialAdId || '', item_name: 'Anúncio de Rodapé' }),
                user_id: user?.id || '',
                ...(couponCode.trim() ? { coupon_code: couponCode.trim().toUpperCase() } : {}),
                ...(discountPercent ? { coupon_discount_percent: String(discountPercent) } : {}),
              }}
            />
          </div>
        </div>
        
        {/* Order Summary */}
        <div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Resumo do Pedido</h2>
            {/* Cupom */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cupom de desconto</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Digite seu cupom"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  type="button"
                >
                  Aplicar
                </button>
              </div>
              {discountPercent > 0 && (
                <p className="text-xs text-green-700 mt-1">Desconto de {discountPercent}% aplicado.</p>
              )}
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Item</span>
                <span className="font-medium">{selectedPlan.name}</span>
              </div>
              
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Duração</span>
                <span>{selectedPlan.duration_days} dias</span>
              </div>
              
              <div className="flex justify-between">
                {planId && (
                  <>
                    <span className="text-gray-600">Imagens</span>
                    <span>Até {selectedPlan.max_images}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-4 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(selectedPlan.price)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Desconto ({discountPercent}%)</span>
                  <span>-{formatCurrency(selectedPlan.price - getDiscountedAmount())}</span>
                </div>
              )}
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span className="text-lg">{formatCurrency(getDiscountedAmount())}</span>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-start">
                <CheckCircle size={20} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-600">
                  {planId
                    ? 'Seu plano será ativado imediatamente após a confirmação do pagamento.'
                    : 'Seu anúncio de rodapé será exibido conforme a política após o pagamento.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;