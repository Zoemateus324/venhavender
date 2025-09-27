-- =====================================================
-- SCRIPT PARA RECRIAR TODAS AS TABELAS E ESTRUTURAS
-- Sistema Venha Vender - Classificados Online
-- =====================================================

-- 1. REMOVER TODAS AS TABELAS EXISTENTES (CASCADE)
-- =====================================================
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS ads CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS special_ads CASCADE;
DROP TABLE IF EXISTS page_views CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;

-- 2. REMOVER TODAS AS FUNÇÕES EXISTENTES
-- =====================================================
DROP FUNCTION IF EXISTS is_admin(UUID);
DROP FUNCTION IF EXISTS get_users_count();
DROP FUNCTION IF EXISTS get_ads_count();
DROP FUNCTION IF EXISTS get_active_ads_count();
DROP FUNCTION IF EXISTS get_payments_count(TEXT);
DROP FUNCTION IF EXISTS get_total_revenue();
DROP FUNCTION IF EXISTS get_new_users_today();

-- 3. CRIAR EXTENSÕES NECESSÁRIAS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 4. CRIAR TABELAS PRINCIPAIS
-- =====================================================

-- Tabela de usuários
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  plan_status VARCHAR(20) DEFAULT 'free' CHECK (plan_status IN ('free', 'premium', 'expired')),
  plan_type VARCHAR(50) DEFAULT 'free' CHECK (plan_type IN ('free', 'silver', 'gold', 'admin')),
  plan_start_date TIMESTAMP WITH TIME ZONE,
  plan_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de categorias
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255) UNIQUE,
  icon VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de planos
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  duration_days INTEGER NOT NULL DEFAULT 15,
  photo_limit INTEGER DEFAULT 1,
  direct_contact BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de anúncios
CREATE TABLE ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES plans(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('grid', 'header', 'footer')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  photos TEXT[] DEFAULT '{}',
  location TEXT,
  contact_info JSONB DEFAULT '{}',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'rejected')),
  views INTEGER DEFAULT 0,
  exposures INTEGER DEFAULT 0,
  max_exposures INTEGER DEFAULT 0,
  admin_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mensagens
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pagamentos
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id),
  ad_id UUID REFERENCES ads(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50),
  asaas_payment_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'refunded')),
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de solicitações
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ad_type VARCHAR(50) NOT NULL,
  duration_days INTEGER NOT NULL,
  materials TEXT,
  observations TEXT,
  proposed_value DECIMAL(10,2),
  admin_response TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de favoritos
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, ad_id)
);

-- Tabela de anúncios especiais
CREATE TABLE special_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE,
  image_url TEXT,
  small_image_url TEXT,
  large_image_url TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0
);

-- Tabela de visualizações de página
CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path VARCHAR(255) NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de chaves API
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  key_value VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de configurações do sistema
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_plan_status ON users(plan_status);
CREATE INDEX idx_ads_status ON ads(status);
CREATE INDEX idx_ads_user_id ON ads(user_id);
CREATE INDEX idx_ads_category_id ON ads(category_id);
CREATE INDEX idx_ads_type ON ads(type);
CREATE INDEX idx_ads_end_date ON ads(end_date);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_ad_id ON messages(ad_id);
CREATE INDEX idx_special_ads_status ON special_ads(status);
CREATE INDEX idx_page_views_device_id ON page_views(device_id);
CREATE INDEX idx_page_views_user_id ON page_views(user_id);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_value ON api_keys(key_value);
CREATE INDEX idx_system_settings_key ON system_settings(key);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_ad_id ON favorites(ad_id);
CREATE INDEX idx_requests_user_id ON requests(user_id);
CREATE INDEX idx_requests_status ON requests(status);

-- 6. INSERIR DADOS INICIAIS
-- =====================================================

-- Usuário administrador
INSERT INTO users (id, email, name, role, plan_status, plan_type) VALUES
('00000000-0000-0000-0000-000000000001', 'keizzstoreloja@gmail.com', 'Administrador', 'admin', 'premium', 'admin');

-- Usuários de exemplo
INSERT INTO users (email, name, role, plan_status, plan_type) VALUES
('user1@example.com', 'João Silva', 'user', 'free', 'free'),
('user2@example.com', 'Maria Santos', 'user', 'premium', 'silver'),
('user3@example.com', 'Pedro Costa', 'user', 'free', 'free');

-- Categorias
INSERT INTO categories (id, name, description, slug, icon) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Imóveis', 'Casas, apartamentos, terrenos e imóveis comerciais', 'imoveis', 'home'),
('550e8400-e29b-41d4-a716-446655440002', 'Veículos', 'Carros, motos, caminhões e outros veículos', 'veiculos', 'car'),
('550e8400-e29b-41d4-a716-446655440003', 'Eletrônicos', 'Celulares, computadores, eletrodomésticos', 'eletronicos', 'smartphone'),
('550e8400-e29b-41d4-a716-446655440004', 'Roupas e Acessórios', 'Vestuário, calçados e acessórios', 'roupas', 'shirt'),
('550e8400-e29b-41d4-a716-446655440005', 'Casa e Jardim', 'Móveis, decoração e itens para casa', 'casa-jardim', 'sofa'),
('550e8400-e29b-41d4-a716-446655440006', 'Moda e Beleza', 'Roupas, cosméticos e produtos de beleza', 'moda-beleza', 'heart'),
('550e8400-e29b-41d4-a716-446655440007', 'Esportes e Lazer', 'Equipamentos esportivos e atividades', 'esportes-lazer', 'dumbbell'),
('550e8400-e29b-41d4-a716-446655440008', 'Animais de Estimação', 'Pets, ração e acessórios', 'pets', 'heart'),
('550e8400-e29b-41d4-a716-446655440009', 'Serviços', 'Serviços diversos e profissionais', 'servicos', 'briefcase');

-- Planos
INSERT INTO plans (id, name, slug, description, price, duration_days, photo_limit, direct_contact, featured, active) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Básico', 'basic', 'Anúncio gratuito na grade principal', 0.00, 15, 1, false, false, true),
('660e8400-e29b-41d4-a716-446655440002', 'Prata', 'silver', 'Anúncio em destaque no cabeçalho', 19.80, 30, 5, true, true, true),
('660e8400-e29b-41d4-a716-446655440003', 'Ouro', 'gold', 'Anúncio premium com máxima visibilidade', 29.80, 90, 999, true, true, true);

-- Anúncios de exemplo
INSERT INTO ads (title, description, price, status, user_id, category_id, plan_id, type, end_date, views) VALUES
('Apartamento para alugar', 'Apartamento 2 quartos no centro da cidade', 1500.00, 'active', '00000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'grid', NOW() + INTERVAL '15 days', 25),
('Carro usado Honda Civic', 'Honda Civic 2018, bem conservado, único dono', 45000.00, 'active', '00000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'header', NOW() + INTERVAL '30 days', 15),
('Casa para venda', 'Casa 3 quartos com quintal, garagem para 2 carros', 250000.00, 'active', (SELECT id FROM users WHERE email = 'user1@example.com'), '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'grid', NOW() + INTERVAL '15 days', 30),
('iPhone 13 Pro', 'iPhone 13 Pro 128GB, usado, sem riscos', 3500.00, 'active', (SELECT id FROM users WHERE email = 'user2@example.com'), '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'footer', NOW() + INTERVAL '90 days', 20),
('Sofá 3 lugares', 'Sofá confortável, cor bege, pouco uso', 800.00, 'active', (SELECT id FROM users WHERE email = 'user3@example.com'), '550e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440001', 'grid', NOW() + INTERVAL '15 days', 10);

-- Pagamentos de exemplo
INSERT INTO payments (user_id, plan_id, ad_id, amount, status, payment_date) VALUES
('00000000-0000-0000-0000-000000000001', '660e8400-e29b-41d4-a716-446655440002', (SELECT id FROM ads WHERE title = 'Carro usado Honda Civic'), 19.80, 'approved', NOW() - INTERVAL '1 day'),
('00000000-0000-0000-0000-000000000001', '660e8400-e29b-41d4-a716-446655440001', (SELECT id FROM ads WHERE title = 'Apartamento para alugar'), 0.00, 'approved', NOW() - INTERVAL '2 days'),
((SELECT id FROM users WHERE email = 'user2@example.com'), '660e8400-e29b-41d4-a716-446655440003', (SELECT id FROM ads WHERE title = 'iPhone 13 Pro'), 29.80, 'approved', NOW() - INTERVAL '3 days');

-- Configurações do sistema
INSERT INTO system_settings (key, value, description, is_public) VALUES
('site_name', 'Venha Vender', 'Nome do site', true),
('site_description', 'Plataforma de anúncios online', 'Descrição do site', true),
('contact_email', 'suporte@venhavender.com.br', 'Email de contato', true),
('meta_title', 'Venha Vender - Anúncios Online', 'Título SEO', true),
('meta_description', 'Encontre e publique anúncios online de forma fácil e segura', 'Descrição SEO', true),
('primary_color', '#f97316', 'Cor primária do site', true),
('max_photos_basic', '1', 'Máximo de fotos para plano básico', false),
('max_photos_silver', '5', 'Máximo de fotos para plano prata', false),
('max_photos_gold', '999', 'Máximo de fotos para plano ouro', false);

-- 7. CRIAR FUNÇÕES AUXILIARES
-- =====================================================

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = user_id AND role = 'admin');
$$ LANGUAGE sql STABLE;

-- Funções de contagem para dashboard
CREATE OR REPLACE FUNCTION get_users_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM users);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_ads_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM ads);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_active_ads_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM ads WHERE status = 'active');
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_total_revenue()
RETURNS DECIMAL AS $$
BEGIN
  RETURN COALESCE((SELECT SUM(amount) FROM payments WHERE status = 'approved'), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_new_users_today()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. CONFIGURAR PERMISSÕES E RLS
-- =====================================================

-- Desabilitar RLS para evitar problemas de permissão
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

-- Conceder permissões de execução nas funções
GRANT EXECUTE ON FUNCTION get_users_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_ads_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_ads_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_payments_count(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_total_revenue() TO authenticated;
GRANT EXECUTE ON FUNCTION get_new_users_today() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;

GRANT EXECUTE ON FUNCTION get_users_count() TO anon;
GRANT EXECUTE ON FUNCTION get_ads_count() TO anon;
GRANT EXECUTE ON FUNCTION get_active_ads_count() TO anon;
GRANT EXECUTE ON FUNCTION get_payments_count(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_total_revenue() TO anon;
GRANT EXECUTE ON FUNCTION get_new_users_today() TO anon;

-- 9. VERIFICAÇÃO FINAL
-- =====================================================
SELECT 'Users:' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Ads:', COUNT(*) FROM ads
UNION ALL
SELECT 'Payments:', COUNT(*) FROM payments
UNION ALL
SELECT 'Categories:', COUNT(*) FROM categories
UNION ALL
SELECT 'Plans:', COUNT(*) FROM plans
UNION ALL
SELECT 'Messages:', COUNT(*) FROM messages
UNION ALL
SELECT 'Requests:', COUNT(*) FROM requests
UNION ALL
SELECT 'Favorites:', COUNT(*) FROM favorites
UNION ALL
SELECT 'Special Ads:', COUNT(*) FROM special_ads
UNION ALL
SELECT 'Page Views:', COUNT(*) FROM page_views
UNION ALL
SELECT 'API Keys:', COUNT(*) FROM api_keys
UNION ALL
SELECT 'System Settings:', COUNT(*) FROM system_settings;

-- =====================================================
-- SCRIPT CONCLUÍDO
-- Todas as tabelas e estruturas foram recriadas
-- =====================================================