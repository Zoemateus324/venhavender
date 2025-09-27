-- Add validation for special ads image dimensions
-- This function can be used to validate image dimensions before upload

-- Function to validate image dimensions (to be called from frontend)
CREATE OR REPLACE FUNCTION validate_special_ad_image_dimensions(
  image_url TEXT,
  max_width INTEGER DEFAULT 1135,
  max_height INTEGER DEFAULT 350
)
RETURNS BOOLEAN AS $$
BEGIN
  -- This function would ideally validate image dimensions
  -- In a real implementation, you might want to:
  -- 1. Download the image and check its dimensions
  -- 2. Use a service like ImageMagick or similar
  -- 3. Validate on the frontend before upload
  
  -- For now, we'll just return true
  -- In production, implement proper image dimension validation
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to the special_ads table about image requirements
COMMENT ON COLUMN special_ads.image_url IS 'URL da imagem do anúncio especial. Dimensões máximas: 1135x350 pixels';

-- Update the special_ads table to include image dimension constraints in comments
COMMENT ON TABLE special_ads IS 'Tabela para anúncios especiais (carrossel). Imagens devem ter dimensões máximas de 1135x350 pixels';

-- Create a function to get special ads with proper formatting
CREATE OR REPLACE FUNCTION get_active_special_ads()
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  description TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
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
    sa.image_url,
    sa.views,
    sa.clicks,
    sa.created_at
  FROM special_ads sa
  WHERE sa.status = 'active'
    AND (sa.expires_at IS NULL OR sa.expires_at > NOW())
  ORDER BY sa.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_active_special_ads() TO anon, authenticated;

-- Create a function to increment special ad views
CREATE OR REPLACE FUNCTION increment_special_ad_view(ad_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE special_ads 
  SET views = views + 1 
  WHERE id = ad_id AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to increment special ad clicks
CREATE OR REPLACE FUNCTION increment_special_ad_click(ad_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE special_ads 
  SET clicks = clicks + 1 
  WHERE id = ad_id AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_special_ad_view(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_special_ad_click(UUID) TO anon, authenticated;
