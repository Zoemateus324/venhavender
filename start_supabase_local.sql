-- =====================================================
-- SCRIPT PARA INICIAR SUPABASE LOCAL
-- Sistema Venha Vender - Configuração Local
-- =====================================================

-- Este script deve ser executado após iniciar o Supabase local
-- Execute: supabase start
-- Depois execute este script no Supabase Studio local

-- 1. VERIFICAR SE O SUPABASE LOCAL ESTÁ RODANDO
-- =====================================================
-- Verifique se você pode acessar: http://127.0.0.1:54323

-- 2. EXECUTAR TODOS OS SCRIPTS DE CORREÇÃO EM ORDEM
-- =====================================================

-- Primeiro: Recriar todas as tabelas
-- Execute: recreate_database.sql

-- Segundo: Corrigir problemas de constraints
-- Execute: fix_database_issues.sql

-- Terceiro: Adicionar colunas faltantes
-- Execute: fix_missing_columns.sql

-- Quarto: Corrigir problemas de page_views
-- Execute: fix_page_views_errors.sql

-- Quinto: Corrigir problemas de perfil do usuário
-- Execute: fix_user_profile_errors.sql

-- Sexto: Configurar políticas RLS (opcional)
-- Execute: rls_policies.sql

-- 3. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se todas as tabelas foram criadas
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verificar se há dados nas tabelas principais
SELECT 
  'Users:' as table_name, 
  COUNT(*) as count 
FROM users
UNION ALL
SELECT 'Ads:', COUNT(*) FROM ads
UNION ALL
SELECT 'Categories:', COUNT(*) FROM categories
UNION ALL
SELECT 'Plans:', COUNT(*) FROM plans
UNION ALL
SELECT 'Page Views:', COUNT(*) FROM page_views;

-- Verificar configurações do sistema
SELECT 
  key,
  value,
  is_public
FROM system_settings
ORDER BY key;

-- =====================================================
-- SCRIPT DE CONFIGURAÇÃO LOCAL CONCLUÍDO
-- Execute todos os scripts na ordem indicada
-- =====================================================
