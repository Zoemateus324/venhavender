-- Adicionar campo ad_type para distinguir entre venda e locação
-- Esta migração adiciona o campo ad_type à tabela ads

-- Adicionar a coluna ad_type à tabela ads
ALTER TABLE ads ADD COLUMN IF NOT EXISTS ad_type VARCHAR(20) DEFAULT 'sale' CHECK (ad_type IN ('sale', 'rent'));

-- Comentário para documentar o campo
COMMENT ON COLUMN ads.ad_type IS 'Tipo do anúncio: sale (venda) ou rent (locação)';

-- Atualizar anúncios existentes para ter o tipo padrão 'sale'
UPDATE ads SET ad_type = 'sale' WHERE ad_type IS NULL;

-- Tornar o campo NOT NULL após definir valores padrão
ALTER TABLE ads ALTER COLUMN ad_type SET NOT NULL;
