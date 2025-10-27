# CORREÇÃO DO SISTEMA DE PAGAMENTOS - INSTRUÇÕES FINAIS

## Problemas Identificados e Corrigidos:

### 1. **Tabela `payments` não existia**
- ✅ Criada tabela `payments` com estrutura correta
- ✅ Configuradas políticas RLS adequadas
- ✅ Criados índices para performance

### 2. **Campos de plano não existiam na tabela `profiles`**
- ✅ Adicionadas colunas `plan_type`, `plan_status`, `plan_expires_at` na tabela `profiles`
- ✅ Configurada sincronização automática com `auth.users`
- ✅ Migrados usuários existentes

### 3. **Webhooks do Stripe falhando**
- ✅ Corrigido `api/stripe-webhook.ts` para usar tabela `profiles`
- ✅ Corrigido `src/pages/payment/PaymentPage.tsx`
- ✅ Corrigido `src/hooks/useAuth.tsx`

### 4. **Erros ao salvar planos editados**
- ✅ Corrigido `src/pages/admin/AdminPlansPage.tsx` para incluir `updated_at`
- ✅ Melhorado tratamento de erros

### 5. **Sistema de cobrança de anúncios**
- ✅ Corrigido `src/components/CreateAdModal.tsx` para criar registros de pagamento
- ✅ Melhorado tratamento de erros

## COMO APLICAR AS CORREÇÕES:

### Passo 1: Executar o SQL de correção
```bash
# Execute o arquivo fix_payment_system_final.sql no seu Supabase
# Este script usa a tabela 'profiles' existente e adiciona as colunas de plano
```

### Passo 2: Verificar se as correções foram aplicadas
```sql
-- Verificar se a tabela payments existe
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'payments';

-- Verificar se as colunas de plano foram adicionadas à tabela profiles
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name IN ('plan_type', 'plan_status', 'plan_expires_at');

-- Verificar estrutura da tabela payments
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'payments' ORDER BY ordinal_position;
```

### Passo 3: Testar o sistema
1. **Teste de criação de plano**: Vá para Admin > Planos e tente editar um plano
2. **Teste de pagamento**: Tente assinar um plano como usuário
3. **Teste de webhook**: Verifique se os webhooks do Stripe estão funcionando
4. **Teste de criação de anúncio**: Tente criar um anúncio com plano pago

## ARQUIVOS MODIFICADOS:

### Backend/API:
- `api/stripe-webhook.ts` - Corrigido para usar tabela `profiles`
- `fix_payment_system_final.sql` - Script de correção do banco (VERSÃO FINAL)

### Frontend:
- `src/pages/payment/PaymentPage.tsx` - Corrigido para usar tabela `profiles`
- `src/hooks/useAuth.tsx` - Corrigido para usar tabela `profiles`
- `src/components/CreateAdModal.tsx` - Melhorado tratamento de pagamentos
- `src/pages/admin/AdminPlansPage.tsx` - Corrigido salvamento de planos

## VERIFICAÇÕES IMPORTANTES:

### 1. Verificar se o webhook do Stripe está configurado:
- URL: `https://seu-dominio.com/api/stripe-webhook`
- Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`, `checkout.session.completed`

### 2. Verificar variáveis de ambiente:
```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3. Verificar logs do Stripe:
- Acesse o dashboard do Stripe
- Vá em Developers > Webhooks
- Verifique se os eventos estão sendo recebidos

## PRÓXIMOS PASSOS:

1. **Execute o SQL de correção FINAL**
2. **Teste cada funcionalidade**
3. **Verifique os logs de erro**
4. **Configure monitoramento**

## MONITORAMENTO:

Para monitorar se tudo está funcionando:

```sql
-- Verificar pagamentos recentes
SELECT * FROM payments ORDER BY created_at DESC LIMIT 10;

-- Verificar usuários com planos ativos
SELECT id, email, plan_type, plan_status, plan_expires_at 
FROM profiles 
WHERE plan_status = 'active';

-- Verificar planos ativos
SELECT * FROM plans WHERE active = true;
```

## CONTATO:

Se encontrar problemas após aplicar as correções, verifique:
1. Logs do Supabase
2. Logs do Stripe
3. Console do navegador
4. Network tab do navegador
