/*
  # Venha Vender - Sistema de Classificados

  1. New Tables
    - `users` - Usuários do sistema com planos e assinaturas
    - `ads` - Anúncios com diferentes tipos (gratuito, cabeçalho, rodapé)  
    - `plans` - Planos disponíveis (básico, prata, ouro)
    - `messages` - Sistema de chat interno entre usuários
    - `payments` - Histórico de pagamentos via Asaas API
    - `requests` - Solicitações de orçamento para anúncios especiais
    - `categories` - Categorias dos anúncios
    - `favorites` - Sistema de favoritos dos usuários

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on user roles
    - Admin policies for management functions
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text,
  avatar_url text,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  plan_type text DEFAULT 'free' CHECK (plan_type IN ('free', 'silver', 'gold')),
  plan_start_date timestamptz,
  plan_end_date timestamptz,
  plan_status text DEFAULT 'inactive' CHECK (plan_status IN ('active', 'inactive', 'expired')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text,
  created_at timestamptz DEFAULT now()
);

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price decimal(10,2) NOT NULL DEFAULT 0,
  duration_days integer NOT NULL DEFAULT 15,
  photo_limit integer DEFAULT 1,
  direct_contact boolean DEFAULT false,
  featured boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Ads table
CREATE TABLE IF NOT EXISTS ads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id),
  type text NOT NULL CHECK (type IN ('grid', 'header', 'footer')),
  title text NOT NULL,
  description text,
  price decimal(10,2),
  photos text[] DEFAULT '{}',
  location text,
  contact_info jsonb DEFAULT '{}',
  plan_id uuid REFERENCES plans(id),
  start_date timestamptz DEFAULT now(),
  end_date timestamptz NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'expired', 'rejected')),
  views integer DEFAULT 0,
  exposures integer DEFAULT 0,
  max_exposures integer DEFAULT 0,
  admin_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES users(id) ON DELETE CASCADE,
  ad_id uuid REFERENCES ads(id) ON DELETE CASCADE,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES plans(id),
  ad_id uuid REFERENCES ads(id),
  amount decimal(10,2) NOT NULL,
  payment_method text,
  asaas_payment_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  payment_date timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Requests table (for custom ad requests)
CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  ad_type text NOT NULL,
  duration_days integer NOT NULL,
  materials text,
  observations text,
  proposed_value decimal(10,2),
  admin_response text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  ad_id uuid REFERENCES ads(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, ad_id)
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Ads policies
CREATE POLICY "Anyone can read active ads" ON ads
  FOR SELECT TO authenticated
  USING (status = 'active' OR user_id = auth.uid());

CREATE POLICY "Users can manage own ads" ON ads
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all ads" ON ads
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Messages policies
CREATE POLICY "Users can read own messages" ON messages
  FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Payments policies
CREATE POLICY "Users can read own payments" ON payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create payments" ON payments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Other policies
CREATE POLICY "Anyone can read categories" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read active plans" ON plans FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "Users can manage own favorites" ON favorites FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can read own requests" ON requests FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create requests" ON requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Insert initial data

-- Categories
INSERT INTO categories (name, slug, icon) VALUES
  ('Veículos', 'veiculos', 'Car'),
  ('Imóveis', 'imoveis', 'Home'),
  ('Eletrônicos', 'eletronicos', 'Smartphone'),
  ('Casa e Jardim', 'casa-jardim', 'Home'),
  ('Moda e Beleza', 'moda-beleza', 'Shirt'),
  ('Esportes e Lazer', 'esportes-lazer', 'Dumbbell'),
  ('Animais de Estimação', 'pets', 'Heart'),
  ('Serviços', 'servicos', 'Briefcase');

-- Plans
INSERT INTO plans (name, slug, description, price, duration_days, photo_limit, direct_contact, featured) VALUES
  ('Básico', 'basic', 'Anúncio gratuito na grade principal', 0.00, 15, 1, false, false),
  ('Prata', 'silver', 'Anúncio em destaque no cabeçalho', 19.80, 30, 5, true, true),
  ('Ouro', 'gold', 'Anúncio premium com máxima visibilidade', 29.80, 90, 999, true, true);