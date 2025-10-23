-- Adicionar campo availability_status para marcar anúncios como vendido/disponível
-- Esta migração adiciona o campo availability_status à tabela ads

-- Adicionar a coluna availability_status à tabela ads
ALTER TABLE ads ADD COLUMN IF NOT EXISTS availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available', 'sold', 'reserved'));

-- Comentário para documentar o campo
COMMENT ON COLUMN ads.availability_status IS 'Status de disponibilidade do anúncio: available (disponível), sold (vendido), reserved (reservado)';

-- Atualizar anúncios existentes para ter o status padrão 'available'
UPDATE ads SET availability_status = 'available' WHERE availability_status IS NULL;

-- Tornar o campo NOT NULL após definir valores padrão
ALTER TABLE ads ALTER COLUMN availability_status SET NOT NULL;

-- Criar índice para melhorar performance nas consultas por status
CREATE INDEX IF NOT EXISTS idx_ads_availability_status ON ads(availability_status);

-- Verificar se a migração foi aplicada corretamente
SELECT COUNT(*) as total_ads, 
       COUNT(CASE WHEN availability_status = 'available' THEN 1 END) as available_ads,
       COUNT(CASE WHEN availability_status = 'sold' THEN 1 END) as sold_ads,
       COUNT(CASE WHEN availability_status = 'reserved' THEN 1 END) as reserved_ads
FROM ads;