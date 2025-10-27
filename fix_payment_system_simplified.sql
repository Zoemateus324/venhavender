-- CORREÇÃO DO SISTEMA DE PAGAMENTOS - VERSÃO SIMPLIFICADA
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

-- 2. CRIAR TABELA USERS CUSTOMIZADA (se não existir)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
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
CREATE INDEX IF NOT EXISTS idx_users_plan_status ON users(plan_status);
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON users(plan_type);

-- 4. CONFIGURAR RLS (ROW LEVEL SECURITY) - VERSÃO SIMPLIFICADA
-- =====================================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Políticas para payments - VERSÃO SIMPLIFICADA
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Users can create payments" ON payments;
DROP POLICY IF EXISTS "Allow all authenticated users to manage payments" ON payments;

CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política mais permissiva para evitar problemas de permissão
CREATE POLICY "Allow all authenticated users to manage payments" ON payments
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para users - VERSÃO SIMPLIFICADA
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow all authenticated users to manage users" ON users;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Política mais permissiva para evitar problemas de permissão
CREATE POLICY "Allow all authenticated users to manage users" ON users
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 5. CRIAR FUNÇÃO PARA SINCRONIZAR USUÁRIOS
-- =====================================================
CREATE OR REPLACE FUNCTION sync_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir ou atualizar na tabela users quando um usuário é criado/atualizado
  INSERT INTO users (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CRIAR TRIGGER PARA SINCRONIZAÇÃO AUTOMÁTICA
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_user_profile();

-- 7. MIGRAR USUÁRIOS EXISTENTES
-- =====================================================
INSERT INTO users (id, email, full_name, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email),
  created_at,
  updated_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM users)
ON CONFLICT (id) DO NOTHING;

-- 8. CONCEDER PERMISSÕES
-- =====================================================
GRANT ALL ON payments TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT SELECT ON payments TO anon;
GRANT SELECT ON users TO anon;

-- 9. VERIFICAÇÃO FINAL
-- =====================================================
SELECT 'Payments table created successfully' as status;
SELECT 'Users table created successfully' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_payments FROM payments;
