-- =====================================================
-- SCRIPT DE POLÍTICAS RLS (ROW LEVEL SECURITY)
-- Sistema Venha Vender - Classificados Online
-- =====================================================

-- 1. HABILITAR RLS EM TODAS AS TABELAS
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 2. CRIAR FUNÇÃO AUXILIAR PARA VERIFICAR ADMIN
-- =====================================================
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = user_id AND role = 'admin');
$$ LANGUAGE sql STABLE;

-- 3. POLÍTICAS PARA TABELA USERS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Public can read users" ON users;

-- Políticas para usuários
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Políticas para administradores
CREATE POLICY "Admins can manage all users" ON users
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

-- Políticas públicas (para leitura de dados básicos)
CREATE POLICY "Public can read users" ON users
  FOR SELECT TO anon
  USING (true);

-- 4. POLÍTICAS PARA TABELA ADS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Anyone can read active ads" ON ads;
DROP POLICY IF EXISTS "Users can manage own ads" ON ads;
DROP POLICY IF EXISTS "Admins can manage all ads" ON ads;
DROP POLICY IF EXISTS "Users can create ads" ON ads;
DROP POLICY IF EXISTS "Public can read active ads" ON ads;

-- Políticas para anúncios
CREATE POLICY "Anyone can read active ads" ON ads
  FOR SELECT TO authenticated
  USING (status = 'active' OR user_id = auth.uid());

CREATE POLICY "Public can read active ads" ON ads
  FOR SELECT TO anon
  USING (status = 'active');

CREATE POLICY "Users can manage own ads" ON ads
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create ads" ON ads
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Políticas para administradores
CREATE POLICY "Admins can manage all ads" ON ads
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

-- 5. POLÍTICAS PARA TABELA CATEGORIES
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

-- Políticas para categorias
CREATE POLICY "Anyone can read categories" ON categories
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Public can read categories" ON categories
  FOR SELECT TO anon
  USING (true);

-- Políticas para administradores
CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

-- 6. POLÍTICAS PARA TABELA PLANS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Anyone can read active plans" ON plans;
DROP POLICY IF EXISTS "Admins can manage plans" ON plans;

-- Políticas para planos
CREATE POLICY "Anyone can read active plans" ON plans
  FOR SELECT TO authenticated
  USING (active = true);

CREATE POLICY "Public can read active plans" ON plans
  FOR SELECT TO anon
  USING (active = true);

-- Políticas para administradores
CREATE POLICY "Admins can manage plans" ON plans
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

-- 7. POLÍTICAS PARA TABELA PAYMENTS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can read own payments" ON payments;
DROP POLICY IF EXISTS "Users can create payments" ON payments;
DROP POLICY IF EXISTS "Admins can manage all payments" ON payments;

-- Políticas para pagamentos
CREATE POLICY "Users can read own payments" ON payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create payments" ON payments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Políticas para administradores
CREATE POLICY "Admins can manage all payments" ON payments
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

-- 8. POLÍTICAS PARA TABELA MESSAGES
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can read own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON messages;

-- Políticas para mensagens
CREATE POLICY "Users can read own messages" ON messages
  FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Políticas para administradores
CREATE POLICY "Admins can manage all messages" ON messages
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

-- 9. POLÍTICAS PARA TABELA REQUESTS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can read own requests" ON requests;
DROP POLICY IF EXISTS "Users can create requests" ON requests;
DROP POLICY IF EXISTS "Users can update own requests" ON requests;
DROP POLICY IF EXISTS "Admins can manage all requests" ON requests;

-- Políticas para solicitações
CREATE POLICY "Users can read own requests" ON requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create requests" ON requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own requests" ON requests
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Políticas para administradores
CREATE POLICY "Admins can manage all requests" ON requests
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

-- 10. POLÍTICAS PARA TABELA FAVORITES
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;
DROP POLICY IF EXISTS "Admins can manage all favorites" ON favorites;

-- Políticas para favoritos
CREATE POLICY "Users can manage own favorites" ON favorites
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Políticas para administradores
CREATE POLICY "Admins can manage all favorites" ON favorites
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

-- 11. POLÍTICAS PARA TABELA SPECIAL_ADS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Anyone can read special ads" ON special_ads;
DROP POLICY IF EXISTS "Users can manage own special ads" ON special_ads;
DROP POLICY IF EXISTS "Admins can manage all special ads" ON special_ads;

-- Políticas para anúncios especiais
CREATE POLICY "Anyone can read special ads" ON special_ads
  FOR SELECT TO authenticated
  USING (status = 'active');

CREATE POLICY "Public can read special ads" ON special_ads
  FOR SELECT TO anon
  USING (status = 'active');

CREATE POLICY "Users can manage own special ads" ON special_ads
  FOR ALL TO authenticated
  USING (created_by = auth.uid());

-- Políticas para administradores
CREATE POLICY "Admins can manage all special ads" ON special_ads
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

-- 12. POLÍTICAS PARA TABELA PAGE_VIEWS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Anyone can insert page views" ON page_views;
DROP POLICY IF EXISTS "Admins can read all page views" ON page_views;
DROP POLICY IF EXISTS "Users can read own page views" ON page_views;

-- Políticas para visualizações de página
CREATE POLICY "Anyone can insert page views" ON page_views
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Public can insert page views" ON page_views
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Users can read own page views" ON page_views
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Políticas para administradores
CREATE POLICY "Admins can read all page views" ON page_views
  FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

-- 13. POLÍTICAS PARA TABELA API_KEYS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can manage own api keys" ON api_keys;
DROP POLICY IF EXISTS "Admins can manage all api keys" ON api_keys;

-- Políticas para chaves API
CREATE POLICY "Users can manage own api keys" ON api_keys
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Políticas para administradores
CREATE POLICY "Admins can manage all api keys" ON api_keys
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

-- 14. POLÍTICAS PARA TABELA SYSTEM_SETTINGS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Anyone can read public settings" ON system_settings;
DROP POLICY IF EXISTS "Admins can manage all settings" ON system_settings;

-- Políticas para configurações do sistema
CREATE POLICY "Anyone can read public settings" ON system_settings
  FOR SELECT TO authenticated
  USING (is_public = true);

CREATE POLICY "Public can read public settings" ON system_settings
  FOR SELECT TO anon
  USING (is_public = true);

-- Políticas para administradores
CREATE POLICY "Admins can manage all settings" ON system_settings
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

-- 15. CONFIGURAR PERMISSÕES DE GRUPO
-- =====================================================

-- Conceder permissões para usuários autenticados
GRANT ALL ON users TO authenticated;
GRANT ALL ON ads TO authenticated;
GRANT ALL ON categories TO authenticated;
GRANT ALL ON plans TO authenticated;
GRANT ALL ON payments TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON requests TO authenticated;
GRANT ALL ON favorites TO authenticated;
GRANT ALL ON special_ads TO authenticated;
GRANT ALL ON page_views TO authenticated;
GRANT ALL ON api_keys TO authenticated;
GRANT ALL ON system_settings TO authenticated;

-- Conceder permissões para usuários anônimos
GRANT SELECT ON users TO anon;
GRANT SELECT ON ads TO anon;
GRANT SELECT ON categories TO anon;
GRANT SELECT ON plans TO anon;
GRANT SELECT ON special_ads TO anon;
GRANT SELECT ON system_settings TO anon;
GRANT INSERT ON page_views TO anon;

-- 16. CONFIGURAR PERMISSÕES DE FUNÇÕES
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

-- 17. VERIFICAÇÃO DAS POLÍTICAS
-- =====================================================

-- Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'users', 'ads', 'categories', 'plans', 'payments', 
    'messages', 'requests', 'favorites', 'special_ads', 
    'page_views', 'api_keys', 'system_settings'
  )
ORDER BY tablename;

-- Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- SCRIPT DE POLÍTICAS RLS CONCLUÍDO
-- Todas as políticas foram configuradas com segurança
-- =====================================================
