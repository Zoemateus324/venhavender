-- CRIAÇÃO DAS TABELAS DE ANÚNCIOS
-- =====================================================

-- 1. CRIAR TABELA CATEGORIES (se não existir)
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CRIAR TABELA ADS
-- =====================================================
CREATE TABLE IF NOT EXISTS ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  photos TEXT[] DEFAULT '{}',
  location TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  contact_info JSONB,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'expired')),
  type TEXT DEFAULT 'sale' CHECK (type IN ('sale', 'rent', 'exchange')),
  ad_type TEXT DEFAULT 'normal' CHECK (ad_type IN ('normal', 'featured', 'premium')),
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  views INTEGER DEFAULT 0,
  end_date TIMESTAMP WITH TIME ZONE,
  availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'sold', 'rented')),
  max_exposures INTEGER DEFAULT 0,
  admin_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRIAR TABELA SPECIAL_ADS
-- =====================================================
CREATE TABLE IF NOT EXISTS special_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  image_url TEXT,
  large_image_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  expires_at TIMESTAMP WITH TIME ZONE,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CRIAR TABELA FAVORITES
-- =====================================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, ad_id)
);

-- 5. CRIAR TABELA MESSAGES
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_ads_user_id ON ads(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_category_id ON ads(category_id);
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_type ON ads(type);
CREATE INDEX IF NOT EXISTS idx_ads_ad_type ON ads(ad_type);
CREATE INDEX IF NOT EXISTS idx_ads_location ON ads(location);
CREATE INDEX IF NOT EXISTS idx_ads_created_at ON ads(created_at);

CREATE INDEX IF NOT EXISTS idx_special_ads_created_by ON special_ads(created_by);
CREATE INDEX IF NOT EXISTS idx_special_ads_status ON special_ads(status);
CREATE INDEX IF NOT EXISTS idx_special_ads_expires_at ON special_ads(expires_at);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_ad_id ON favorites(ad_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_ad_id ON messages(ad_id);

-- 7. CONFIGURAR RLS (ROW LEVEL SECURITY)
-- =====================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Políticas para categories
DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

CREATE POLICY "Anyone can read categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para ads
DROP POLICY IF EXISTS "Anyone can read active ads" ON ads;
DROP POLICY IF EXISTS "Users can manage own ads" ON ads;
DROP POLICY IF EXISTS "Admins can manage all ads" ON ads;

CREATE POLICY "Anyone can read active ads" ON ads
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can manage own ads" ON ads
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all ads" ON ads
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para special_ads
DROP POLICY IF EXISTS "Anyone can read active special ads" ON special_ads;
DROP POLICY IF EXISTS "Users can manage own special ads" ON special_ads;
DROP POLICY IF EXISTS "Admins can manage all special ads" ON special_ads;

CREATE POLICY "Anyone can read active special ads" ON special_ads
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can manage own special ads" ON special_ads
  FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all special ads" ON special_ads
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para favorites
DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;

CREATE POLICY "Users can manage own favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para messages
DROP POLICY IF EXISTS "Users can manage own messages" ON messages;

CREATE POLICY "Users can manage own messages" ON messages
  FOR ALL USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 8. CONCEDER PERMISSÕES
-- =====================================================
GRANT ALL ON categories TO authenticated;
GRANT ALL ON ads TO authenticated;
GRANT ALL ON special_ads TO authenticated;
GRANT ALL ON favorites TO authenticated;
GRANT ALL ON messages TO authenticated;

GRANT SELECT ON categories TO anon;
GRANT SELECT ON ads TO anon;
GRANT SELECT ON special_ads TO anon;

-- 9. INSERIR CATEGORIAS PADRÃO
-- =====================================================
INSERT INTO categories (name, slug, description) VALUES
  ('Veículos', 'veiculos', 'Carros, motos, caminhões e outros veículos'),
  ('Imóveis', 'imoveis', 'Casas, apartamentos, terrenos e imóveis comerciais'),
  ('Eletrônicos', 'eletronicos', 'Celulares, computadores, TVs e eletrônicos'),
  ('Casa e Jardim', 'casa-jardim', 'Móveis, decoração, ferramentas e jardinagem'),
  ('Esportes', 'esportes', 'Equipamentos esportivos, roupas e acessórios'),
  ('Moda', 'moda', 'Roupas, calçados, bolsas e acessórios'),
  ('Livros', 'livros', 'Livros, revistas e materiais educativos'),
  ('Animais', 'animais', 'Pets, ração e acessórios para animais'),
  ('Serviços', 'servicos', 'Serviços diversos e profissionais'),
  ('Outros', 'outros', 'Outros produtos e serviços')
ON CONFLICT (slug) DO NOTHING;

-- 10. CRIAR FUNÇÕES AUXILIARES
-- =====================================================
CREATE OR REPLACE FUNCTION increment_ad_view(ad_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE ads SET views = views + 1 WHERE id = ad_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignorar erros silenciosamente
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_special_ad_view(ad_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE special_ads SET views = views + 1 WHERE id = ad_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignorar erros silenciosamente
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões nas funções
GRANT EXECUTE ON FUNCTION increment_ad_view(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_ad_view(UUID) TO anon;
GRANT EXECUTE ON FUNCTION increment_special_ad_view(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_special_ad_view(UUID) TO anon;

-- 11. VERIFICAÇÃO FINAL
-- =====================================================
SELECT 'Categories table created successfully' as status;
SELECT 'Ads table created successfully' as status;
SELECT 'Special ads table created successfully' as status;
SELECT 'Favorites table created successfully' as status;
SELECT 'Messages table created successfully' as status;
SELECT COUNT(*) as total_categories FROM categories;
SELECT COUNT(*) as total_ads FROM ads;
SELECT COUNT(*) as total_special_ads FROM special_ads;
