-- Fix reports tables and ensure proper RLS policies
-- This migration ensures all tables needed for reports exist and have proper policies

-- Ensure users table exists with proper structure
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  plan_status VARCHAR(20) DEFAULT 'free' CHECK (plan_status IN ('free', 'premium', 'expired')),
  plan_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure ads table exists with proper structure
CREATE TABLE IF NOT EXISTS ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'rejected')),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID,
  photos TEXT[] DEFAULT '{}',
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure categories table exists
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure payments table exists
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')),
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure page_views table exists for analytics
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path VARCHAR(255) NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Create is_admin function if it doesn't exist
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = user_id AND role = 'admin');
$$ LANGUAGE sql STABLE;

-- RLS Policies for users table
DROP POLICY IF EXISTS "Admins can read all users" ON users;
CREATE POLICY "Admins can read all users" ON users
FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can read their own profile" ON users;
CREATE POLICY "Users can read their own profile" ON users
FOR SELECT USING (auth.uid() = id);

-- RLS Policies for ads table
DROP POLICY IF EXISTS "Admins can read all ads" ON ads;
CREATE POLICY "Admins can read all ads" ON ads
FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Public can read active ads" ON ads;
CREATE POLICY "Public can read active ads" ON ads
FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Users can read their own ads" ON ads;
CREATE POLICY "Users can read their own ads" ON ads
FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for categories table
DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
CREATE POLICY "Anyone can read categories" ON categories
FOR SELECT USING (true);

-- RLS Policies for payments table
DROP POLICY IF EXISTS "Admins can read all payments" ON payments;
CREATE POLICY "Admins can read all payments" ON payments
FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can read their own payments" ON payments;
CREATE POLICY "Users can read their own payments" ON payments
FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for page_views table
DROP POLICY IF EXISTS "Admins can read all page views" ON page_views;
CREATE POLICY "Admins can read all page views" ON page_views
FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can insert page views" ON page_views;
CREATE POLICY "Anyone can insert page views" ON page_views
FOR INSERT WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON ads TO authenticated;
GRANT ALL ON categories TO authenticated;
GRANT ALL ON payments TO authenticated;
GRANT ALL ON page_views TO authenticated;

GRANT SELECT ON users TO anon;
GRANT SELECT ON ads TO anon;
GRANT SELECT ON categories TO anon;
GRANT INSERT ON page_views TO anon;

-- Insert sample categories if they don't exist
INSERT INTO categories (id, name, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Imóveis', 'Casas, apartamentos, terrenos e imóveis comerciais')
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440002', 'Veículos', 'Carros, motos, caminhões e outros veículos')
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440003', 'Eletrônicos', 'Celulares, computadores, eletrodomésticos')
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440004', 'Roupas e Acessórios', 'Vestuário, calçados e acessórios')
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440005', 'Casa e Jardim', 'Móveis, decoração e itens para casa')
ON CONFLICT (id) DO NOTHING;

-- Add foreign key constraint for ads.category_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'ads_category_id_fkey' 
    AND table_name = 'ads'
  ) THEN
    ALTER TABLE ads ADD CONSTRAINT ads_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
  END IF;
END $$;
