-- Create special_ads table for carousel advertisements
CREATE TABLE IF NOT EXISTS special_ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  expires_at TIMESTAMP WITH TIME ZONE,
  image_url TEXT, -- URL da imagem no bucket ads_especiais
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Admin que criou
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_special_ads_status ON special_ads(status);
CREATE INDEX IF NOT EXISTS idx_special_ads_expires_at ON special_ads(expires_at);
CREATE INDEX IF NOT EXISTS idx_special_ads_created_at ON special_ads(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE special_ads ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active special ads
CREATE POLICY "Anyone can read active special ads" ON special_ads
  FOR SELECT USING (status = 'active' AND (expires_at IS NULL OR expires_at > NOW()));

-- Policy: Admins can read all special ads
CREATE POLICY "Admins can read all special ads" ON special_ads
  FOR SELECT USING (is_admin(auth.uid()));

-- Policy: Admins can insert special ads
CREATE POLICY "Admins can insert special ads" ON special_ads
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- Policy: Admins can update special ads
CREATE POLICY "Admins can update special ads" ON special_ads
  FOR UPDATE USING (is_admin(auth.uid()));

-- Policy: Admins can delete special ads
CREATE POLICY "Admins can delete special ads" ON special_ads
  FOR DELETE USING (is_admin(auth.uid()));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_special_ads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_special_ads_updated_at
  BEFORE UPDATE ON special_ads
  FOR EACH ROW
  EXECUTE FUNCTION update_special_ads_updated_at();

-- Function to increment views when special ad is viewed
CREATE OR REPLACE FUNCTION increment_special_ad_views(ad_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE special_ads 
  SET views = views + 1 
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment clicks when special ad is clicked
CREATE OR REPLACE FUNCTION increment_special_ad_clicks(ad_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE special_ads 
  SET clicks = clicks + 1 
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S'            -- sequence
      AND c.relname = 'special_ads_id_seq'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'GRANT USAGE ON SEQUENCE public.special_ads_id_seq TO authenticated';
  END IF;
END
$$;

-- Insert some sample data (optional)
INSERT INTO special_ads (title, description, price, status, expires_at, image_url, created_by) VALUES
  (
    'Festival de Carros',
    'Compre seu carro em até 48x. Contrate o seguro Klubi e ganhe bônus de R$ 2 MIL',
    99.90,
    'active',
    NOW() + INTERVAL '30 days',
    'https://example.com/festival-carros.jpg',
    (SELECT id FROM auth.users WHERE email = 'admin@venhavender.com.br' LIMIT 1)
  ),
  (
    'Black Friday - Eletrônicos',
    'Os melhores eletrônicos com até 70% de desconto. Aproveite!',
    149.90,
    'active',
    NOW() + INTERVAL '15 days',
    'https://example.com/black-friday.jpg',
    (SELECT id FROM auth.users WHERE email = 'admin@venhavender.com.br' LIMIT 1)
  );
