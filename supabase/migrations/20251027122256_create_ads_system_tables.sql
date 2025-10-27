-- =====================================================
-- MIGRAÇÃO: CRIAR TABELAS DO SISTEMA DE ANÚNCIOS
-- =====================================================

-- 1. Criar tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT DEFAULT '#3B82F6',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de anúncios
CREATE TABLE IF NOT EXISTS ads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2),
    location TEXT,
    city TEXT,
    state TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    images TEXT[] DEFAULT '{}',
    featured BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de anúncios especiais
CREATE TABLE IF NOT EXISTS special_ads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2),
    location TEXT,
    city TEXT,
    state TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    images TEXT[] DEFAULT '{}',
    featured BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    views INTEGER DEFAULT 0,
    special_type TEXT DEFAULT 'premium',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela de planos do usuário
CREATE TABLE IF NOT EXISTS user_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL DEFAULT 'free',
    plan_status TEXT NOT NULL DEFAULT 'inactive',
    plan_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 5. Criar tabela de pagamentos
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'BRL',
    status TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT,
    stripe_payment_intent_id TEXT,
    stripe_session_id TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Criar tabela de favoritos
CREATE TABLE IF NOT EXISTS favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
    special_ad_id UUID REFERENCES special_ads(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, ad_id),
    UNIQUE(user_id, special_ad_id),
    CHECK ((ad_id IS NOT NULL AND special_ad_id IS NULL) OR (ad_id IS NULL AND special_ad_id IS NOT NULL))
);

-- 7. Criar tabela de mensagens
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
    special_ad_id UUID REFERENCES special_ads(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK ((ad_id IS NOT NULL AND special_ad_id IS NULL) OR (ad_id IS NULL AND special_ad_id IS NOT NULL))
);

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Políticas para categories (todos podem ler)
CREATE POLICY "Categories are viewable by everyone" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Categories are manageable by admins" ON categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.tipo_usuario = 'admin' OR profiles.tipo_usuario = 'super_admin')
        )
    );

-- Políticas para ads
CREATE POLICY "Ads are viewable by everyone" ON ads
    FOR SELECT USING (active = true);

CREATE POLICY "Users can view their own ads" ON ads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ads" ON ads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ads" ON ads
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ads" ON ads
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all ads" ON ads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.tipo_usuario = 'admin' OR profiles.tipo_usuario = 'super_admin')
        )
    );

-- Políticas para special_ads
CREATE POLICY "Special ads are viewable by everyone" ON special_ads
    FOR SELECT USING (active = true);

CREATE POLICY "Users can view their own special ads" ON special_ads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own special ads" ON special_ads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own special ads" ON special_ads
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own special ads" ON special_ads
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all special ads" ON special_ads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.tipo_usuario = 'admin' OR profiles.tipo_usuario = 'super_admin')
        )
    );

-- Políticas para user_plans
CREATE POLICY "Users can view their own plans" ON user_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plans" ON user_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans" ON user_plans
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user plans" ON user_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.tipo_usuario = 'admin' OR profiles.tipo_usuario = 'super_admin')
        )
    );

-- Políticas para payments
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.tipo_usuario = 'admin' OR profiles.tipo_usuario = 'super_admin')
        )
    );

-- Políticas para favorites
CREATE POLICY "Users can manage their own favorites" ON favorites
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para messages
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_ads_user_id ON ads(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_category_id ON ads(category_id);
CREATE INDEX IF NOT EXISTS idx_ads_active ON ads(active);
CREATE INDEX IF NOT EXISTS idx_ads_featured ON ads(featured);
CREATE INDEX IF NOT EXISTS idx_ads_created_at ON ads(created_at);

CREATE INDEX IF NOT EXISTS idx_special_ads_user_id ON special_ads(user_id);
CREATE INDEX IF NOT EXISTS idx_special_ads_category_id ON special_ads(category_id);
CREATE INDEX IF NOT EXISTS idx_special_ads_active ON special_ads(active);
CREATE INDEX IF NOT EXISTS idx_special_ads_featured ON special_ads(featured);
CREATE INDEX IF NOT EXISTS idx_special_ads_expires_at ON special_ads(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_status ON user_plans(plan_status);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_ad_id ON favorites(ad_id);
CREATE INDEX IF NOT EXISTS idx_favorites_special_ad_id ON favorites(special_ad_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_ad_id ON messages(ad_id);
CREATE INDEX IF NOT EXISTS idx_messages_special_ad_id ON messages(special_ad_id);

-- =====================================================
-- FUNÇÕES ÚTEIS
-- =====================================================

-- Função para incrementar visualizações de anúncios
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

-- Função para contar visitantes únicos
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

-- Função para contar visualizações de páginas
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

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir categorias padrão
INSERT INTO categories (name, description, icon, color) VALUES
('Veículos', 'Carros, motos, caminhões e outros veículos', '🚗', '#3B82F6'),
('Imóveis', 'Casas, apartamentos, terrenos e imóveis comerciais', '🏠', '#10B981'),
('Eletrônicos', 'Celulares, computadores, eletrodomésticos', '📱', '#F59E0B'),
('Roupas e Acessórios', 'Roupas, calçados, bolsas e acessórios', '👕', '#EF4444'),
('Casa e Jardim', 'Móveis, decoração, ferramentas e jardinagem', '🛋️', '#8B5CF6'),
('Esportes e Lazer', 'Equipamentos esportivos, jogos e entretenimento', '⚽', '#06B6D4'),
('Livros e Mídia', 'Livros, filmes, música e jogos', '📚', '#84CC16'),
('Animais', 'Pets, ração, acessórios para animais', '🐕', '#F97316'),
('Serviços', 'Serviços diversos e profissionais', '🔧', '#6366F1'),
('Outros', 'Outros produtos e serviços', '📦', '#6B7280')
ON CONFLICT (name) DO NOTHING;

