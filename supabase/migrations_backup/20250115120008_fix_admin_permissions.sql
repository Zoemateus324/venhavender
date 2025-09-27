-- Fix admin permissions and ensure proper access
-- This migration ensures the admin user has proper permissions

-- Ensure the is_admin function exists and works correctly
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id 
    AND role = 'admin'
  );
$$ LANGUAGE sql STABLE;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO anon;

-- Ensure users table has proper structure
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

-- Ensure ads table has proper structure
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

-- Ensure payments table has proper structure
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')),
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can read their own profile" ON users;
DROP POLICY IF EXISTS "Admins can read all ads" ON ads;
DROP POLICY IF EXISTS "Public can read active ads" ON ads;
DROP POLICY IF EXISTS "Users can read their own ads" ON ads;
DROP POLICY IF EXISTS "Admins can read all payments" ON payments;
DROP POLICY IF EXISTS "Users can read their own payments" ON payments;

-- RLS Policies for users table
CREATE POLICY "Admins can read all users" ON users
FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Users can read their own profile" ON users
FOR SELECT USING (auth.uid() = id);

-- RLS Policies for ads table
CREATE POLICY "Admins can read all ads" ON ads
FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Public can read active ads" ON ads
FOR SELECT USING (status = 'active');

CREATE POLICY "Users can read their own ads" ON ads
FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for payments table
CREATE POLICY "Admins can read all payments" ON payments
FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Users can read their own payments" ON payments
FOR SELECT USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON ads TO authenticated;
GRANT ALL ON payments TO authenticated;

GRANT SELECT ON users TO anon;
GRANT SELECT ON ads TO anon;

-- Create a test admin user if none exists
INSERT INTO users (id, email, name, role, plan_status, plan_type)
SELECT 
  '00000000-0000-0000-0000-000000000001'::UUID,
  'admin@venhavender.com.br',
  'Administrador',
  'admin',
  'premium',
  'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE role = 'admin'
);

-- Update existing user to admin if they have admin email
UPDATE users 
SET role = 'admin', plan_status = 'premium', plan_type = 'admin'
WHERE email = 'keizzstoreloja@gmail.com' AND role != 'admin';

-- Insert sample data if tables are empty
INSERT INTO ads (id, title, description, price, status, user_id, views)
SELECT 
  'a0000000-0000-0000-0000-000000000001'::UUID,
  'Apartamento para alugar',
  'Apartamento 2 quartos no centro da cidade',
  1500.00,
  'active',
  '00000000-0000-0000-0000-000000000001'::UUID,
  25
WHERE NOT EXISTS (SELECT 1 FROM ads LIMIT 1);

INSERT INTO payments (id, user_id, amount, status, payment_date)
SELECT 
  'p0000000-0000-0000-0000-000000000001'::UUID,
  '00000000-0000-0000-0000-000000000001'::UUID,
  199.90,
  'approved',
  NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (SELECT 1 FROM payments LIMIT 1);
