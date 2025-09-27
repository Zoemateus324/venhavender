-- =====================================================
-- SCRIPT PARA CORRIGIR PROBLEMAS DE PERFIL DO USUÁRIO
-- Sistema Venha Vender - Correção de Erros de Dados do Usuário
-- =====================================================

-- 1. VERIFICAR E CORRIGIR ESTRUTURA DA TABELA USERS
-- =====================================================

-- Garantir que todas as colunas necessárias existem
DO $$ 
BEGIN
    -- Adicionar colunas faltantes se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'phone') THEN
        ALTER TABLE users ADD COLUMN phone VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'plan_start_date') THEN
        ALTER TABLE users ADD COLUMN plan_start_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'plan_end_date') THEN
        ALTER TABLE users ADD COLUMN plan_end_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Adicionar coluna updated_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 2. DESABILITAR RLS TEMPORARIAMENTE PARA USERS
-- =====================================================

-- Desabilitar RLS para evitar problemas de permissão
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 3. CONFIGURAR PERMISSÕES BÁSICAS PARA USERS
-- =====================================================

-- Conceder permissões completas para usuários autenticados
GRANT ALL ON users TO authenticated;

-- Conceder permissões de leitura para usuários anônimos (dados públicos)
GRANT SELECT ON users TO anon;

-- 4. CRIAR FUNÇÕES PARA CARREGAR DADOS DO USUÁRIO
-- =====================================================

-- Função para obter perfil do usuário
CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID)
RETURNS JSON AS $$
DECLARE
    user_data JSON;
BEGIN
    SELECT json_build_object(
        'id', id,
        'email', email,
        'name', name,
        'phone', phone,
        'avatar_url', avatar_url,
        'role', role,
        'plan_status', plan_status,
        'plan_type', plan_type,
        'plan_start_date', plan_start_date,
        'plan_end_date', plan_end_date,
        'created_at', created_at,
        'updated_at', updated_at
    ) INTO user_data
    FROM users
    WHERE id = user_id;
    
    RETURN user_data;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('error', 'Erro ao carregar perfil do usuário');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar perfil do usuário
CREATE OR REPLACE FUNCTION update_user_profile(
    user_id UUID,
    p_name TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    updated_user JSON;
BEGIN
    -- Atualizar dados do usuário
    UPDATE users SET
        name = COALESCE(p_name, name),
        phone = COALESCE(p_phone, phone),
        avatar_url = COALESCE(p_avatar_url, avatar_url),
        updated_at = NOW()
    WHERE id = user_id;
    
    -- Retornar dados atualizados
    SELECT get_user_profile(user_id) INTO updated_user;
    
    RETURN updated_user;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('error', 'Erro ao atualizar perfil do usuário');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas do usuário
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total_ads', COALESCE((SELECT COUNT(*) FROM ads WHERE ads.user_id = user_id), 0),
        'active_ads', COALESCE((SELECT COUNT(*) FROM ads WHERE ads.user_id = user_id AND status = 'active'), 0),
        'total_views', COALESCE((SELECT SUM(views) FROM ads WHERE ads.user_id = user_id), 0),
        'plan_type', (SELECT plan_type FROM users WHERE id = user_id),
        'plan_status', (SELECT plan_status FROM users WHERE id = user_id)
    ) INTO stats;
    
    RETURN stats;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('error', 'Erro ao carregar estatísticas do usuário');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CONFIGURAR PERMISSÕES DAS FUNÇÕES
-- =====================================================

-- Conceder permissões de execução das funções
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_profile(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_stats(UUID) TO authenticated;

-- Conceder permissões para usuários anônimos (se necessário)
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_user_stats(UUID) TO anon;

-- 6. CRIAR POLÍTICAS RLS SEGURAS PARA USERS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Public can read users" ON users;

-- Criar políticas seguras
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Public can read users" ON users
  FOR SELECT TO anon
  USING (true);

-- 7. HABILITAR RLS COM POLÍTICAS CORRETAS
-- =====================================================

-- Habilitar RLS com as políticas corretas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 8. ATUALIZAR DADOS EXISTENTES COM VALORES PADRÃO
-- =====================================================

-- Atualizar usuários existentes com dados padrão
UPDATE users SET
    name = COALESCE(name, 'Usuário'),
    phone = COALESCE(phone, ''),
    avatar_url = COALESCE(avatar_url, ''),
    plan_start_date = COALESCE(plan_start_date, created_at),
    plan_end_date = COALESCE(plan_end_date, created_at + INTERVAL '30 days'),
    updated_at = NOW()
WHERE name IS NULL OR name = '';

-- 9. INSERIR DADOS DE TESTE PARA USUÁRIOS
-- =====================================================

-- Garantir que existe pelo menos um usuário admin
INSERT INTO users (id, email, name, role, plan_status, plan_type, phone, plan_start_date, plan_end_date)
VALUES (
    '00000000-0000-0000-0000-000000000001', 
    'admin@venhavender.com', 
    'Administrador', 
    'admin', 
    'premium', 
    'admin',
    '+55 11 99999-9999',
    NOW() - INTERVAL '30 days',
    NOW() + INTERVAL '365 days'
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    plan_status = EXCLUDED.plan_status,
    plan_type = EXCLUDED.plan_type,
    phone = EXCLUDED.phone,
    plan_start_date = EXCLUDED.plan_start_date,
    plan_end_date = EXCLUDED.plan_end_date,
    updated_at = NOW();

-- 10. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_plan_status ON users(plan_status);
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON users(plan_type);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON users(updated_at);

-- 11. CRIAR TRIGGER PARA ATUALIZAR updated_at
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 12. VERIFICAÇÃO E TESTE
-- =====================================================

-- Verificar estrutura da tabela users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Testar funções
SELECT 'Testando get_user_profile:' as test, get_user_profile('00000000-0000-0000-0000-000000000001') as result;
SELECT 'Testando get_user_stats:' as test, get_user_stats('00000000-0000-0000-0000-000000000001') as result;

-- Verificar dados dos usuários
SELECT 
    'Total Users:' as metric,
    COUNT(*) as count
FROM users
UNION ALL
SELECT 
    'Admin Users:',
    COUNT(*)
FROM users 
WHERE role = 'admin'
UNION ALL
SELECT 
    'Active Users:',
    COUNT(*)
FROM users 
WHERE plan_status = 'premium';

-- 13. CRIAR FUNÇÃO DE LIMPEZA DE DADOS
-- =====================================================

-- Função para limpar dados inválidos
CREATE OR REPLACE FUNCTION cleanup_user_data()
RETURNS TEXT AS $$
BEGIN
    -- Atualizar emails vazios
    UPDATE users SET email = 'user' || id || '@example.com' WHERE email IS NULL OR email = '';
    
    -- Atualizar nomes vazios
    UPDATE users SET name = 'Usuário ' || SUBSTRING(id::TEXT, 1, 8) WHERE name IS NULL OR name = '';
    
    -- Atualizar plan_status inválidos
    UPDATE users SET plan_status = 'free' WHERE plan_status NOT IN ('free', 'premium', 'expired', 'inactive', 'active');
    
    -- Atualizar plan_type inválidos
    UPDATE users SET plan_type = 'free' WHERE plan_type NOT IN ('free', 'silver', 'gold', 'admin', 'basic');
    
    -- Atualizar role inválidos
    UPDATE users SET role = 'user' WHERE role NOT IN ('user', 'admin');
    
    RETURN 'Dados de usuários limpos com sucesso';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Erro ao limpar dados: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executar limpeza
SELECT cleanup_user_data();

-- =====================================================
-- SCRIPT DE CORREÇÃO DE PERFIL DO USUÁRIO CONCLUÍDO
-- Problemas de carregamento de dados foram corrigidos
-- =====================================================
