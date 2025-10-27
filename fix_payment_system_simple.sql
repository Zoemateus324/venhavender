-- CORREÇÃO SIMPLES DO SISTEMA DE PAGAMENTOS
-- =====================================================

-- 1. CRIAR TABELA PAYMENTS (se não existir)
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

-- 2. ADICIONAR COLUNAS DE PLANO NA TABELA PROFILES (se não existirem)
-- =====================================================
DO $$ 
BEGIN
    -- Adicionar plan_type se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'plan_type') THEN
        ALTER TABLE profiles ADD COLUMN plan_type TEXT DEFAULT 'free';
    END IF;
    
    -- Adicionar plan_status se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'plan_status') THEN
        ALTER TABLE profiles ADD COLUMN plan_status TEXT DEFAULT 'inactive';
    END IF;
    
    -- Adicionar plan_expires_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'plan_expires_at') THEN
        ALTER TABLE profiles ADD COLUMN plan_expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 3. CRIAR ÍNDICES PARA PERFORMANCE (se não existirem)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_checkout_session_id ON payments(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_profiles_plan_status ON profiles(plan_status);
CREATE INDEX IF NOT EXISTS idx_profiles_plan_type ON profiles(plan_type);

-- 4. CONFIGURAR RLS PARA PAYMENTS (se não estiver habilitado)
-- =====================================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se existirem
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Users can create payments" ON payments;
DROP POLICY IF EXISTS "Allow all authenticated users to manage payments" ON payments;

-- Criar políticas para payments
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow all authenticated users to manage payments" ON payments
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 5. CONCEDER PERMISSÕES BÁSICAS
-- =====================================================
GRANT ALL ON payments TO authenticated;
GRANT SELECT ON payments TO anon;

-- 6. VERIFICAÇÃO FINAL
-- =====================================================
SELECT 'Payments table created successfully' as status;
SELECT 'Plan columns added to profiles table' as status;
SELECT COUNT(*) as total_profiles FROM profiles;
SELECT COUNT(*) as total_payments FROM payments;
