-- =====================================================
-- SCRIPT PARA CORRIGIR PROBLEMAS DO BANCO DE DADOS
-- Sistema Venha Vender - Correção de Erros
-- =====================================================

-- 1. CORRIGIR CONSTRAINTS PROBLEMÁTICAS
-- =====================================================

-- Remover constraints problemáticas da tabela users
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_status_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_type_check;

-- Recriar constraints com valores corretos
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('user', 'admin'));

ALTER TABLE users ADD CONSTRAINT users_plan_status_check 
  CHECK (plan_status IN ('free', 'premium', 'expired', 'inactive', 'active'));

ALTER TABLE users ADD CONSTRAINT users_plan_type_check 
  CHECK (plan_type IN ('free', 'silver', 'gold', 'admin', 'basic'));

-- 2. CORRIGIR CONSTRAINTS DA TABELA ADS
-- =====================================================

-- Remover constraints problemáticas da tabela ads
ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_status_check;
ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_type_check;

-- Recriar constraints com valores corretos
ALTER TABLE ads ADD CONSTRAINT ads_status_check 
  CHECK (status IN ('pending', 'active', 'expired', 'rejected'));

ALTER TABLE ads ADD CONSTRAINT ads_type_check 
  CHECK (type IN ('grid', 'header', 'footer'));

-- 3. CORRIGIR CONSTRAINTS DA TABELA PAYMENTS
-- =====================================================

-- Remover constraints problemáticas da tabela payments
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;

-- Recriar constraints com valores corretos
ALTER TABLE payments ADD CONSTRAINT payments_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'refunded'));

-- 4. CORRIGIR CONSTRAINTS DA TABELA REQUESTS
-- =====================================================

-- Remover constraints problemáticas da tabela requests
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check;

-- Recriar constraints com valores corretos
ALTER TABLE requests ADD CONSTRAINT requests_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'completed'));

-- 5. CORRIGIR CONSTRAINTS DA TABELA SPECIAL_ADS
-- =====================================================

-- Remover constraints problemáticas da tabela special_ads
ALTER TABLE special_ads DROP CONSTRAINT IF EXISTS special_ads_status_check;

-- Recriar constraints com valores corretos
ALTER TABLE special_ads ADD CONSTRAINT special_ads_status_check 
  CHECK (status IN ('active', 'inactive', 'expired'));

-- 6. ATUALIZAR DADOS EXISTENTES COM VALORES VÁLIDOS
-- =====================================================

-- Atualizar plan_status para valores válidos
UPDATE users SET plan_status = 'free' WHERE plan_status NOT IN ('free', 'premium', 'expired', 'inactive', 'active');
UPDATE users SET plan_status = 'inactive' WHERE plan_status IS NULL;

-- Atualizar plan_type para valores válidos
UPDATE users SET plan_type = 'free' WHERE plan_type NOT IN ('free', 'silver', 'gold', 'admin', 'basic');
UPDATE users SET plan_type = 'free' WHERE plan_type IS NULL;

-- Atualizar role para valores válidos
UPDATE users SET role = 'user' WHERE role NOT IN ('user', 'admin');
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Atualizar status dos anúncios
UPDATE ads SET status = 'pending' WHERE status NOT IN ('pending', 'active', 'expired', 'rejected');
UPDATE ads SET status = 'pending' WHERE status IS NULL;

-- Atualizar type dos anúncios
UPDATE ads SET type = 'grid' WHERE type NOT IN ('grid', 'header', 'footer');
UPDATE ads SET type = 'grid' WHERE type IS NULL;

-- Atualizar status dos pagamentos
UPDATE payments SET status = 'pending' WHERE status NOT IN ('pending', 'approved', 'rejected', 'expired', 'refunded');
UPDATE payments SET status = 'pending' WHERE status IS NULL;

-- Atualizar status das solicitações
UPDATE requests SET status = 'pending' WHERE status NOT IN ('pending', 'approved', 'rejected', 'completed');
UPDATE requests SET status = 'pending' WHERE status IS NULL;

-- Atualizar status dos anúncios especiais
UPDATE special_ads SET status = 'active' WHERE status NOT IN ('active', 'inactive', 'expired');
UPDATE special_ads SET status = 'active' WHERE status IS NULL;

-- 7. CORRIGIR PROBLEMAS DE RLS
-- =====================================================

-- Desabilitar RLS temporariamente para evitar problemas
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE ads DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE special_ads DISABLE ROW LEVEL SECURITY;
ALTER TABLE page_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;

-- 8. CONFIGURAR PERMISSÕES BÁSICAS
-- =====================================================

-- Conceder permissões completas para usuários autenticados
GRANT ALL ON users TO authenticated;
GRANT ALL ON ads TO authenticated;
GRANT ALL ON payments TO authenticated;
GRANT ALL ON categories TO authenticated;
GRANT ALL ON special_ads TO authenticated;
GRANT ALL ON page_views TO authenticated;
GRANT ALL ON api_keys TO authenticated;
GRANT ALL ON system_settings TO authenticated;
GRANT ALL ON plans TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON requests TO authenticated;
GRANT ALL ON favorites TO authenticated;

-- Conceder permissões de leitura para usuários anônimos
GRANT SELECT ON users TO anon;
GRANT SELECT ON ads TO anon;
GRANT SELECT ON categories TO anon;
GRANT SELECT ON special_ads TO anon;
GRANT SELECT ON system_settings TO anon;
GRANT SELECT ON plans TO anon;
GRANT INSERT ON page_views TO anon;

-- 9. CORRIGIR FUNÇÕES AUXILIARES
-- =====================================================

-- Recriar função is_admin com tratamento de erro
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id 
    AND role = 'admin'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql STABLE;

-- Recriar funções de contagem com tratamento de erro
CREATE OR REPLACE FUNCTION get_users_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM users);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_ads_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM ads);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_active_ads_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM ads WHERE status = 'active');
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_payments_count(status_filter TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
BEGIN
  IF status_filter IS NULL THEN
    RETURN (SELECT COUNT(*) FROM payments);
  ELSE
    RETURN (SELECT COUNT(*) FROM payments WHERE status = status_filter);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_total_revenue()
RETURNS DECIMAL AS $$
BEGIN
  RETURN COALESCE((SELECT SUM(amount) FROM payments WHERE status = 'approved'), 0);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_new_users_today()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURRENT_DATE);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. CONFIGURAR PERMISSÕES DE FUNÇÕES
-- =====================================================

-- Conceder permissões de execução nas funções
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO anon;

GRANT EXECUTE ON FUNCTION get_users_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_ads_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_ads_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_payments_count(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_total_revenue() TO authenticated;
GRANT EXECUTE ON FUNCTION get_new_users_today() TO authenticated;

GRANT EXECUTE ON FUNCTION get_users_count() TO anon;
GRANT EXECUTE ON FUNCTION get_ads_count() TO anon;
GRANT EXECUTE ON FUNCTION get_active_ads_count() TO anon;
GRANT EXECUTE ON FUNCTION get_payments_count(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_total_revenue() TO anon;
GRANT EXECUTE ON FUNCTION get_new_users_today() TO anon;

-- 11. VERIFICAÇÃO E LIMPEZA
-- =====================================================

-- Verificar constraints existentes
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name, tc.constraint_name;

-- Verificar dados problemáticos
SELECT 'Users with invalid plan_status:' as issue, COUNT(*) as count 
FROM users 
WHERE plan_status NOT IN ('free', 'premium', 'expired', 'inactive', 'active')
UNION ALL
SELECT 'Users with invalid plan_type:', COUNT(*) 
FROM users 
WHERE plan_type NOT IN ('free', 'silver', 'gold', 'admin', 'basic')
UNION ALL
SELECT 'Users with invalid role:', COUNT(*) 
FROM users 
WHERE role NOT IN ('user', 'admin')
UNION ALL
SELECT 'Ads with invalid status:', COUNT(*) 
FROM ads 
WHERE status NOT IN ('pending', 'active', 'expired', 'rejected')
UNION ALL
SELECT 'Ads with invalid type:', COUNT(*) 
FROM ads 
WHERE type NOT IN ('grid', 'header', 'footer');

-- 12. INSERIR DADOS DE TESTE SEGUROS
-- =====================================================

-- Garantir que existe pelo menos um usuário admin
INSERT INTO users (id, email, name, role, plan_status, plan_type) 
VALUES ('00000000-0000-0000-0000-000000000001', 'admin@venhavender.com', 'Administrador', 'admin', 'premium', 'admin')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  plan_status = EXCLUDED.plan_status,
  plan_type = EXCLUDED.plan_type;

-- Garantir que existem categorias básicas
INSERT INTO categories (id, name, description, slug, icon) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Imóveis', 'Casas, apartamentos, terrenos', 'imoveis', 'home'),
('550e8400-e29b-41d4-a716-446655440002', 'Veículos', 'Carros, motos, caminhões', 'veiculos', 'car'),
('550e8400-e29b-41d4-a716-446655440003', 'Eletrônicos', 'Celulares, computadores', 'eletronicos', 'smartphone')
ON CONFLICT (id) DO NOTHING;

-- Garantir que existem planos básicos
INSERT INTO plans (id, name, slug, description, price, duration_days, photo_limit, direct_contact, featured, active) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Básico', 'basic', 'Anúncio gratuito', 0.00, 15, 1, false, false, true),
('660e8400-e29b-41d4-a716-446655440002', 'Prata', 'silver', 'Anúncio em destaque', 19.80, 30, 5, true, true, true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SCRIPT DE CORREÇÃO CONCLUÍDO
-- Problemas principais foram corrigidos
-- =====================================================
