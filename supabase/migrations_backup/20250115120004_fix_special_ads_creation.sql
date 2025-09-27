-- Fix special_ads table creation and add sample data
-- This migration ensures the table is created properly

-- Drop table if exists to recreate it properly
DROP TABLE IF EXISTS special_ads CASCADE;

-- Create special_ads table with proper structure
CREATE TABLE special_ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  expires_at TIMESTAMP WITH TIME ZONE,
  image_url TEXT, -- For backward compatibility
  small_image_url TEXT, -- Small image URL
  large_image_url TEXT, -- Large image URL
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX idx_special_ads_status ON special_ads(status);
CREATE INDEX idx_special_ads_expires_at ON special_ads(expires_at);
CREATE INDEX idx_special_ads_created_at ON special_ads(created_at);
CREATE INDEX idx_special_ads_created_by ON special_ads(created_by);

-- Enable Row Level Security
ALTER TABLE special_ads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Admins can do anything
CREATE POLICY "Admins can manage all special ads" ON special_ads
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Authenticated users can read active special ads
CREATE POLICY "Authenticated users can read active special ads" ON special_ads
FOR SELECT USING (
  status = 'active' 
  AND (expires_at IS NULL OR expires_at >= NOW())
);

-- Public can read active special ads
CREATE POLICY "Public can read active special ads" ON special_ads
FOR SELECT USING (
  status = 'active' 
  AND (expires_at IS NULL OR expires_at >= NOW())
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_special_ads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_special_ads_updated_at
BEFORE UPDATE ON special_ads
FOR EACH ROW
EXECUTE FUNCTION update_special_ads_updated_at();

-- Insert sample data
INSERT INTO special_ads (title, description, price, status, expires_at, image_url, small_image_url, large_image_url, views, clicks) VALUES
('Oferta Especial de Verão', 'Descontos incríveis em produtos selecionados para o verão! Aproveite nossas promoções exclusivas.', 99.90, 'active', '2025-12-31 23:59:59+00', 'https://example.com/summer_sale.jpg', 'https://example.com/summer_sale_small.jpg', 'https://example.com/summer_sale_large.jpg', 1250, 89),
('Festival de Carros', 'Compre seu carro em até 48x. Contrate o seguro Klubi e ganhe bônus de R$ 2 MIL.', 199.90, 'active', '2025-06-30 23:59:59+00', 'https://example.com/car_festival.jpg', 'https://example.com/car_festival_small.jpg', 'https://example.com/car_festival_large.jpg', 2100, 156),
('Black Friday 2025', 'As melhores ofertas do ano! Descontos de até 70% em produtos selecionados.', 149.90, 'active', '2025-11-30 23:59:59+00', 'https://example.com/black_friday.jpg', 'https://example.com/black_friday_small.jpg', 'https://example.com/black_friday_large.jpg', 3200, 234);

-- Grant necessary permissions
GRANT ALL ON special_ads TO authenticated;
GRANT SELECT ON special_ads TO anon;
