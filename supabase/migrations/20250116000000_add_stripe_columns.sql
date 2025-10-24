-- Adicionar colunas do Stripe na tabela payments
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_checkout_session_id ON payments(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_customer_id ON payments(stripe_customer_id);

-- Adicionar colunas do Stripe na tabela plans (opcional, para futuras integrações)
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

-- Comentários para documentação
COMMENT ON COLUMN payments.stripe_payment_intent_id IS 'ID do Payment Intent do Stripe';
COMMENT ON COLUMN payments.stripe_checkout_session_id IS 'ID da Checkout Session do Stripe';
COMMENT ON COLUMN payments.stripe_customer_id IS 'ID do Customer no Stripe';
COMMENT ON COLUMN plans.stripe_price_id IS 'ID do Price no Stripe';
COMMENT ON COLUMN plans.stripe_product_id IS 'ID do Product no Stripe';
