-- Criar tabela page_views para analytics
CREATE TABLE IF NOT EXISTS page_views (
  id SERIAL PRIMARY KEY,
  device_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_device_id ON page_views(device_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);

-- Habilitar RLS
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção anônima
CREATE POLICY "Allow anonymous page view tracking" ON page_views
  FOR INSERT WITH CHECK (true);

-- Política para permitir leitura de dados próprios
CREATE POLICY "Users can view their own page views" ON page_views
  FOR SELECT USING (auth.uid() = user_id);

-- Política para admin ver todos
CREATE POLICY "Admins can view all page views" ON page_views
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
