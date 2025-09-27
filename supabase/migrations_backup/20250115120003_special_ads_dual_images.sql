-- Add support for dual images (small and large) in special ads
-- This migration adds new columns for small and large images

-- Add new columns for dual images
ALTER TABLE special_ads 
ADD COLUMN small_image_url TEXT,
ADD COLUMN large_image_url TEXT;

-- Update the existing image_url column comment
COMMENT ON COLUMN special_ads.image_url IS 'URL da imagem principal do anúncio especial (DEPRECATED - use small_image_url e large_image_url)';
COMMENT ON COLUMN special_ads.small_image_url IS 'URL da imagem pequena do anúncio especial. Dimensões: até 400x200 pixels';
COMMENT ON COLUMN special_ads.large_image_url IS 'URL da imagem grande do anúncio especial. Dimensões: até 1135x350 pixels';

-- Create function to get special ads with both image types
CREATE OR REPLACE FUNCTION get_active_special_ads_with_images()
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  description TEXT,
  price DECIMAL(10,2),
  small_image_url TEXT,
  large_image_url TEXT,
  image_url TEXT, -- Keep for backward compatibility
  views INTEGER,
  clicks INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.id,
    sa.title,
    sa.description,
    sa.price,
    sa.small_image_url,
    sa.large_image_url,
    sa.image_url, -- For backward compatibility
    sa.views,
    sa.clicks,
    sa.created_at
  FROM special_ads sa
  WHERE sa.status = 'active'
    AND (sa.expires_at IS NULL OR sa.expires_at > NOW())
  ORDER BY sa.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the new function
GRANT EXECUTE ON FUNCTION get_active_special_ads_with_images() TO anon, authenticated;

-- Update existing records to have both image types (if they have image_url)
UPDATE special_ads 
SET 
  small_image_url = image_url,
  large_image_url = image_url
WHERE image_url IS NOT NULL;

-- Create function to validate image dimensions for both types
CREATE OR REPLACE FUNCTION validate_special_ad_image_dimensions(
  small_image_url TEXT DEFAULT NULL,
  large_image_url TEXT DEFAULT NULL,
  small_max_width INTEGER DEFAULT 400,
  small_max_height INTEGER DEFAULT 200,
  large_max_width INTEGER DEFAULT 1135,
  large_max_height INTEGER DEFAULT 350
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validate that at least one image is provided
  IF small_image_url IS NULL AND large_image_url IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- In a real implementation, you would validate actual image dimensions
  -- For now, we'll just return true if at least one image is provided
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add constraint to ensure at least one image is provided
ALTER TABLE special_ads 
ADD CONSTRAINT check_at_least_one_image 
CHECK (small_image_url IS NOT NULL OR large_image_url IS NOT NULL OR image_url IS NOT NULL);

-- Update the table comment
COMMENT ON TABLE special_ads IS 'Tabela para anúncios especiais (carrossel). Suporta imagens pequenas (400x200) e grandes (1135x350).';
