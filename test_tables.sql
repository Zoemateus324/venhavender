-- =====================================================
-- SCRIPT DE TESTE PARA VERIFICAR TABELAS CRIADAS
-- =====================================================
-- Execute este script no SQL Editor do Supabase Dashboard para verificar se tudo está funcionando

-- 1. Verificar se as tabelas existem
SELECT 
    table_name,
    'Tabela existe' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ads', 'special_ads', 'categories', 'user_plans', 'payments', 'favorites', 'messages')
ORDER BY table_name;

-- 2. Verificar se as categorias foram inseridas
SELECT 
    name,
    description,
    icon,
    color,
    active
FROM categories 
ORDER BY name;

-- 3. Verificar se as funções foram criadas
SELECT 
    routine_name,
    routine_type,
    'Função existe' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('increment_ad_view', 'count_unique_visitors', 'count_page_views')
ORDER BY routine_name;

-- 4. Testar função de contagem de visitantes únicos
SELECT count_unique_visitors() as visitantes_unicos;

-- 5. Testar função de contagem de visualizações
SELECT count_page_views() as total_visualizacoes;

-- 6. Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('ads', 'special_ads', 'categories', 'user_plans', 'payments', 'favorites', 'messages')
ORDER BY tablename, policyname;
