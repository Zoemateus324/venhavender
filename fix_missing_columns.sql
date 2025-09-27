-- =====================================================
-- SCRIPT PARA CORRIGIR COLUNAS FALTANTES
-- Sistema Venha Vender - Adicionar Colunas Faltantes
-- =====================================================

-- 1. ADICIONAR COLUNAS FALTANTES NA TABELA ADS
-- =====================================================

-- Verificar se as colunas existem antes de adicionar
DO $$ 
BEGIN
    -- Adicionar coluna expires_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ads' AND column_name = 'expires_at') THEN
        ALTER TABLE ads ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Adicionar coluna location se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ads' AND column_name = 'location') THEN
        ALTER TABLE ads ADD COLUMN location TEXT;
    END IF;
    
    -- Adicionar coluna contact_info se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ads' AND column_name = 'contact_info') THEN
        ALTER TABLE ads ADD COLUMN contact_info JSONB DEFAULT '{}';
    END IF;
    
    -- Adicionar coluna exposures se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ads' AND column_name = 'exposures') THEN
        ALTER TABLE ads ADD COLUMN exposures INTEGER DEFAULT 0;
    END IF;
    
    -- Adicionar coluna max_exposures se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ads' AND column_name = 'max_exposures') THEN
        ALTER TABLE ads ADD COLUMN max_exposures INTEGER DEFAULT 0;
    END IF;
    
    -- Adicionar coluna admin_approved se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ads' AND column_name = 'admin_approved') THEN
        ALTER TABLE ads ADD COLUMN admin_approved BOOLEAN DEFAULT false;
    END IF;
    
    -- Adicionar coluna start_date se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ads' AND column_name = 'start_date') THEN
        ALTER TABLE ads ADD COLUMN start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Adicionar coluna end_date se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ads' AND column_name = 'end_date') THEN
        ALTER TABLE ads ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Adicionar coluna plan_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ads' AND column_name = 'plan_id') THEN
        ALTER TABLE ads ADD COLUMN plan_id UUID REFERENCES plans(id);
    END IF;
    
    -- Adicionar coluna type se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ads' AND column_name = 'type') THEN
        ALTER TABLE ads ADD COLUMN type VARCHAR(20) DEFAULT 'grid' CHECK (type IN ('grid', 'header', 'footer'));
    END IF;
END $$;

-- 2. ATUALIZAR DADOS EXISTENTES COM VALORES PADRÃO
-- =====================================================

-- Atualizar end_date baseado na duração do plano
UPDATE ads 
SET end_date = start_date + INTERVAL '15 days'
WHERE end_date IS NULL 
  AND plan_id IS NULL;

UPDATE ads 
SET end_date = start_date + INTERVAL '30 days'
WHERE end_date IS NULL 
  AND plan_id = (SELECT id FROM plans WHERE slug = 'silver');

UPDATE ads 
SET end_date = start_date + INTERVAL '90 days'
WHERE end_date IS NULL 
  AND plan_id = (SELECT id FROM plans WHERE slug = 'gold');

-- Atualizar expires_at com o mesmo valor de end_date
UPDATE ads 
SET expires_at = end_date
WHERE expires_at IS NULL;

-- Atualizar type para 'grid' se estiver NULL
UPDATE ads 
SET type = 'grid'
WHERE type IS NULL;

-- Atualizar admin_approved para true para anúncios ativos
UPDATE ads 
SET admin_approved = true
WHERE status = 'active' AND admin_approved = false;

-- 3. ADICIONAR COLUNAS FALTANTES NA TABELA USERS
-- =====================================================

DO $$ 
BEGIN
    -- Adicionar coluna phone se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'phone') THEN
        ALTER TABLE users ADD COLUMN phone VARCHAR(20);
    END IF;
    
    -- Adicionar coluna avatar_url se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
    END IF;
    
    -- Adicionar coluna plan_start_date se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'plan_start_date') THEN
        ALTER TABLE users ADD COLUMN plan_start_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Adicionar coluna plan_end_date se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'plan_end_date') THEN
        ALTER TABLE users ADD COLUMN plan_end_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 4. ADICIONAR COLUNAS FALTANTES NA TABELA CATEGORIES
-- =====================================================

DO $$ 
BEGIN
    -- Adicionar coluna slug se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'categories' AND column_name = 'slug') THEN
        ALTER TABLE categories ADD COLUMN slug VARCHAR(255) UNIQUE;
    END IF;
    
    -- Adicionar coluna icon se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'categories' AND column_name = 'icon') THEN
        ALTER TABLE categories ADD COLUMN icon VARCHAR(255);
    END IF;
END $$;

-- 5. ATUALIZAR DADOS DAS CATEGORIAS COM SLUGS
-- =====================================================

UPDATE categories 
SET slug = 'imoveis'
WHERE name = 'Imóveis' AND (slug IS NULL OR slug = '');

UPDATE categories 
SET slug = 'veiculos'
WHERE name = 'Veículos' AND (slug IS NULL OR slug = '');

UPDATE categories 
SET slug = 'eletronicos'
WHERE name = 'Eletrônicos' AND (slug IS NULL OR slug = '');

UPDATE categories 
SET slug = 'roupas'
WHERE name = 'Roupas' AND (slug IS NULL OR slug = '');

UPDATE categories 
SET slug = 'casa-jardim'
WHERE name = 'Casa e Jardim' AND (slug IS NULL OR slug = '');

-- 6. CRIAR ÍNDICES PARA AS NOVAS COLUNAS
-- =====================================================

-- Índices para tabela ads
CREATE INDEX IF NOT EXISTS idx_ads_expires_at ON ads(expires_at);
CREATE INDEX IF NOT EXISTS idx_ads_end_date ON ads(end_date);
CREATE INDEX IF NOT EXISTS idx_ads_start_date ON ads(start_date);
CREATE INDEX IF NOT EXISTS idx_ads_location ON ads(location);
CREATE INDEX IF NOT EXISTS idx_ads_admin_approved ON ads(admin_approved);

-- Índices para tabela users
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_plan_start_date ON users(plan_start_date);
CREATE INDEX IF NOT EXISTS idx_users_plan_end_date ON users(plan_end_date);

-- Índices para tabela categories
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- 7. CRIAR FUNÇÕES AUXILIARES PARA DASHBOARD
-- =====================================================

-- Função para contar anúncios ativos
CREATE OR REPLACE FUNCTION get_active_ads_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM ads WHERE status = 'active');
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para contar visualizações totais
CREATE OR REPLACE FUNCTION get_total_views()
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE((SELECT SUM(views) FROM ads), 0);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter plano do usuário
CREATE OR REPLACE FUNCTION get_user_plan(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT plan_type FROM users WHERE id = user_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'free';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para contar anúncios do usuário
CREATE OR REPLACE FUNCTION get_user_ads_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM ads WHERE ads.user_id = user_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. CONFIGURAR PERMISSÕES DAS NOVAS FUNÇÕES
-- =====================================================

GRANT EXECUTE ON FUNCTION get_active_ads_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_total_views() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_plan(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_ads_count(UUID) TO authenticated;

GRANT EXECUTE ON FUNCTION get_active_ads_count() TO anon;
GRANT EXECUTE ON FUNCTION get_total_views() TO anon;
GRANT EXECUTE ON FUNCTION get_user_plan(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_user_ads_count(UUID) TO anon;

-- 9. INSERIR DADOS DE TESTE PARA DASHBOARD
-- =====================================================

-- Inserir alguns anúncios de teste se não existirem
INSERT INTO ads (title, description, price, status, user_id, category_id, type, start_date, end_date, expires_at, views, admin_approved)
SELECT 
  'Anúncio de Teste ' || generate_series,
  'Descrição do anúncio de teste',
  100.00 + (generate_series * 50),
  'active',
  '00000000-0000-0000-0000-000000000001',
  '550e8400-e29b-41d4-a716-446655440001',
  'grid',
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '14 days',
  NOW() + INTERVAL '14 days',
  generate_series * 10,
  true
FROM generate_series(1, 3)
WHERE NOT EXISTS (SELECT 1 FROM ads WHERE title LIKE 'Anúncio de Teste%');

-- 10. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se todas as colunas foram adicionadas
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('ads', 'users', 'categories')
  AND column_name IN ('expires_at', 'end_date', 'start_date', 'location', 'contact_info', 'exposures', 'max_exposures', 'admin_approved', 'type', 'plan_id', 'phone', 'avatar_url', 'plan_start_date', 'plan_end_date', 'slug', 'icon')
ORDER BY table_name, column_name;

-- Verificar dados do dashboard
SELECT 
  'Active Ads:' as metric,
  get_active_ads_count() as value
UNION ALL
SELECT 
  'Total Views:',
  get_total_views()
UNION ALL
SELECT 
  'User Plan:',
  get_user_plan('00000000-0000-0000-0000-000000000001')::TEXT;

-- =====================================================
-- SCRIPT DE CORREÇÃO DE COLUNAS CONCLUÍDO
-- Todas as colunas faltantes foram adicionadas
-- =====================================================
