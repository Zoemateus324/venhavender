-- Add Asaas checkout link to plans
ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS asaas_payment_link TEXT;

-- Optional: index for quick filtering of plans with link
CREATE INDEX IF NOT EXISTS idx_plans_asaas_payment_link ON plans(asaas_payment_link);