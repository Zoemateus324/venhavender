-- =====================================================
-- MIGRAÇÃO: CORRIGIR POLÍTICAS SEM DEPENDÊNCIA DE PROFILES
-- =====================================================

-- Remover políticas que dependem da tabela profiles
DROP POLICY IF EXISTS "Categories are manageable by admins" ON categories;
DROP POLICY IF EXISTS "Admins can manage all ads" ON ads;
DROP POLICY IF EXISTS "Admins can manage all special ads" ON special_ads;
DROP POLICY IF EXISTS "Admins can manage all user plans" ON user_plans;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;

-- Criar políticas simplificadas que não dependem de profiles
-- Políticas para categories (todos podem ler, apenas usuários autenticados podem gerenciar)
CREATE POLICY "Categories are manageable by authenticated users" ON categories
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para ads (simplificadas)
CREATE POLICY "Admins can manage all ads" ON ads
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para special_ads (simplificadas)
CREATE POLICY "Admins can manage all special ads" ON special_ads
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para user_plans (simplificadas)
CREATE POLICY "Admins can manage all user plans" ON user_plans
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para payments (simplificadas)
CREATE POLICY "Admins can view all payments" ON payments
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- =====================================================
-- VERIFICAR SE AS FUNÇÕES FORAM CRIADAS
-- =====================================================

-- Recriar função para incrementar visualizações de anúncios
CREATE OR REPLACE FUNCTION increment_ad_view(ad_id UUID, is_special BOOLEAN DEFAULT false)
RETURNS void AS $$
BEGIN
    IF is_special THEN
        UPDATE special_ads SET views = views + 1 WHERE id = ad_id;
    ELSE
        UPDATE ads SET views = views + 1 WHERE id = ad_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar função para contar visitantes únicos
CREATE OR REPLACE FUNCTION count_unique_visitors()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(DISTINCT user_id) 
        FROM (
            SELECT user_id FROM ads WHERE created_at >= NOW() - INTERVAL '30 days'
            UNION
            SELECT user_id FROM special_ads WHERE created_at >= NOW() - INTERVAL '30 days'
        ) AS unique_users
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar função para contar visualizações de páginas
CREATE OR REPLACE FUNCTION count_page_views()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(views), 0) 
        FROM (
            SELECT views FROM ads
            UNION ALL
            SELECT views FROM special_ads
        ) AS all_views
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

