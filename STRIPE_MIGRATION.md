# Migração do Asaas para Stripe

Este documento descreve o processo de migração do sistema de pagamentos do Asaas para o Stripe.

## 🎯 Objetivo

Substituir completamente a integração com o Asaas pela integração com o Stripe, mantendo a funcionalidade existente e melhorando a experiência do usuário.

## 📋 Checklist de Migração

### ✅ Concluído

- [x] **Configuração do Stripe**
  - [x] Instalação das dependências (`@stripe/stripe-js`, `@stripe/react-stripe-js`, `stripe`)
  - [x] Configuração da biblioteca Stripe (`src/lib/stripe.ts`)
  - [x] Endpoints de API criados:
    - [x] `api/stripe-create-payment-intent.ts`
    - [x] `api/stripe-create-checkout-session.ts`
    - [x] `api/stripe-confirm-payment.ts`
    - [x] `api/stripe-webhook.ts`

- [x] **Componentes React**
  - [x] `StripePaymentForm.tsx` - Componente de pagamento com Stripe
  - [x] Atualização da `PaymentPage.tsx` para usar Stripe
  - [x] Remoção de código legado do Asaas

- [x] **Banco de Dados**
  - [x] Migração SQL para adicionar colunas do Stripe
  - [x] Script de migração de dados (`scripts/migrate-to-stripe.js`)

### 🔄 Em Andamento

- [ ] **Configuração de Ambiente**
  - [ ] Configurar variáveis de ambiente do Stripe
  - [ ] Configurar webhook do Stripe
  - [ ] Testar integração em desenvolvimento

### ⏳ Pendente

- [ ] **Testes**
  - [ ] Testes de pagamento em ambiente de desenvolvimento
  - [ ] Testes de webhook
  - [ ] Testes de diferentes métodos de pagamento

- [ ] **Deploy**
  - [ ] Deploy em ambiente de produção
  - [ ] Configuração de webhook em produção
  - [ ] Monitoramento de pagamentos

- [ ] **Limpeza**
  - [ ] Remover código do Asaas
  - [ ] Remover endpoints do Asaas
  - [ ] Atualizar documentação

## 🔧 Configuração Necessária

### Variáveis de Ambiente

```env
# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase (já configurado)
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Webhook do Stripe

1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com/webhooks)
2. Crie um novo webhook com a URL: `https://seu-dominio.com/api/stripe-webhook`
3. Selecione os eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
4. Copie o webhook secret e configure a variável `STRIPE_WEBHOOK_SECRET`

## 🚀 Como Executar a Migração

### 1. Instalar Dependências

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js stripe
```

### 2. Executar Migração do Banco

```bash
# Aplicar migração SQL
supabase db push

# Executar script de migração (opcional)
node scripts/migrate-to-stripe.js
```

### 3. Configurar Variáveis de Ambiente

Adicione as variáveis do Stripe no seu arquivo `.env`:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Testar Integração

1. Acesse `/payment?plan_id=ID_DO_PLANO`
2. Teste o pagamento com cartão de teste
3. Verifique se o webhook está funcionando
4. Confirme se o usuário foi atualizado corretamente

## 🧪 Dados de Teste

### Cartões de Teste do Stripe

```
Visa: 4242 4242 4242 4242
Visa (débito): 4000 0566 5566 5556
Mastercard: 5555 5555 5555 4444
American Express: 3782 822463 10005
```

### Códigos de Teste

- **Sucesso**: Use qualquer CVC
- **Falha**: Use CVC `999`
- **3D Secure**: Use CVC `999`

## 📊 Comparação: Asaas vs Stripe

| Aspecto | Asaas | Stripe |
|---------|-------|--------|
| **Métodos de Pagamento** | PIX, Boleto, Cartão | Cartão, PIX, Boleto |
| **Internacional** | ❌ Apenas Brasil | ✅ Global |
| **Documentação** | ⚠️ Limitada | ✅ Excelente |
| **Suporte** | ⚠️ Básico | ✅ 24/7 |
| **Taxas** | 2.9% + R$ 0,39 | 2.9% + R$ 0,39 |
| **Webhooks** | ✅ Sim | ✅ Sim |
| **Dashboard** | ⚠️ Básico | ✅ Avançado |

## 🔍 Monitoramento

### Logs Importantes

- **Pagamentos bem-sucedidos**: `payment_intent.succeeded`
- **Pagamentos falhados**: `payment_intent.payment_failed`
- **Checkout completado**: `checkout.session.completed`

### Métricas a Acompanhar

- Taxa de conversão de pagamentos
- Tempo de processamento
- Erros de webhook
- Disputas e chargebacks

## 🆘 Troubleshooting

### Problemas Comuns

1. **Webhook não recebido**
   - Verificar URL do webhook
   - Verificar assinatura do webhook
   - Verificar logs do servidor

2. **Pagamento não processado**
   - Verificar logs do Stripe
   - Verificar webhook
   - Verificar banco de dados

3. **Erro de CORS**
   - Verificar configuração do Stripe
   - Verificar headers da API

### Contatos de Suporte

- **Stripe**: [support.stripe.com](https://support.stripe.com)
- **Documentação**: [stripe.com/docs](https://stripe.com/docs)

## 📚 Recursos Adicionais

- [Documentação do Stripe](https://stripe.com/docs)
- [Stripe Elements](https://stripe.com/docs/elements)
- [Webhooks do Stripe](https://stripe.com/docs/webhooks)
- [Testes do Stripe](https://stripe.com/docs/testing)
