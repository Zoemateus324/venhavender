-- Verificar se a tabela payments existe e sua estrutura
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND table_schema = 'public' 
ORDER BY ordinal_position;

-- Se a tabela não existir, criar com a estrutura correta
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  plan_id UUID,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50) NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  stripe_checkout_session_id VARCHAR(255),
  invoice_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Se a tabela já existir mas não tiver as colunas corretas, adicionar as colunas faltantes
DO $$ 
BEGIN
    -- Adicionar coluna stripe_payment_intent_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'stripe_payment_intent_id'
    ) THEN
        ALTER TABLE payments ADD COLUMN stripe_payment_intent_id VARCHAR(255);
    END IF;
    
    -- Adicionar coluna stripe_checkout_session_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'stripe_checkout_session_id'
    ) THEN
        ALTER TABLE payments ADD COLUMN stripe_checkout_session_id VARCHAR(255);
    END IF;
    
    -- Adicionar coluna invoice_url se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'invoice_url'
    ) THEN
        ALTER TABLE payments ADD COLUMN invoice_url TEXT;
    END IF;
    
    -- Adicionar coluna plan_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'plan_id'
    ) THEN
        ALTER TABLE payments ADD COLUMN plan_id UUID;
    END IF;
    
    -- Adicionar coluna payment_method se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE payments ADD COLUMN payment_method VARCHAR(50) NOT NULL DEFAULT 'stripe';
    END IF;
END $$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_checkout_session_id ON payments(stripe_checkout_session_id);

-- Habilitar RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de pagamentos
DROP POLICY IF EXISTS "Allow payment creation" ON payments;
CREATE POLICY "Allow payment creation" ON payments
  FOR INSERT WITH CHECK (true);

-- Política para usuários verem seus próprios pagamentos
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Política para admin ver todos os pagamentos
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
CREATE POLICY "Admins can view all payments" ON payments
  FOR ALL USING (
    SELECT role FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
