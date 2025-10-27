-- CORREÇÃO ULTRA-SIMPLES DO SISTEMA DE PAGAMENTOS
-- =====================================================

-- 1. CRIAR TABELA PAYMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50) NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  stripe_checkout_session_id VARCHAR(255),
  invoice_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CRIAR TABELA USER_PLANS PARA GERENCIAR PLANOS DOS USUÁRIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS user_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan_type TEXT DEFAULT 'free',
  plan_status TEXT DEFAULT 'inactive' CHECK (plan_status IN ('active', 'inactive', 'expired')),
  plan_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_checkout_session_id ON payments(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_status ON user_plans(plan_status);

-- 4. CONFIGURAR RLS
-- =====================================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

-- Políticas para payments
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Users can create payments" ON payments;
DROP POLICY IF EXISTS "Allow all authenticated users to manage payments" ON payments;

CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow all authenticated users to manage payments" ON payments
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para user_plans
DROP POLICY IF EXISTS "Users can view own plan" ON user_plans;
DROP POLICY IF EXISTS "Users can update own plan" ON user_plans;
DROP POLICY IF EXISTS "Allow all authenticated users to manage user_plans" ON user_plans;

CREATE POLICY "Users can view own plan" ON user_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own plan" ON user_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow all authenticated users to manage user_plans" ON user_plans
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 5. CONCEDER PERMISSÕES
-- =====================================================
GRANT ALL ON payments TO authenticated;
GRANT ALL ON user_plans TO authenticated;
GRANT SELECT ON payments TO anon;
GRANT SELECT ON user_plans TO anon;

-- 6. VERIFICAÇÃO FINAL
-- =====================================================
SELECT 'Payments table created successfully' as status;
SELECT 'User_plans table created successfully' as status;
SELECT COUNT(*) as total_user_plans FROM user_plans;
SELECT COUNT(*) as total_payments FROM payments;
