-- Add edit permissions for special ads
-- Allow users to edit their own special ads and admins to edit all

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admins can manage all special ads" ON special_ads;
DROP POLICY IF EXISTS "Authenticated users can read active special ads" ON special_ads;
DROP POLICY IF EXISTS "Public can read active special ads" ON special_ads;

-- Create new comprehensive policies

-- Policy: Admins can do everything with special ads
CREATE POLICY "Admins can manage all special ads" ON special_ads
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Policy: Users can read all active special ads
CREATE POLICY "Users can read active special ads" ON special_ads
FOR SELECT USING (
  status = 'active' 
  AND (expires_at IS NULL OR expires_at >= NOW())
);

-- Policy: Public can read active special ads
CREATE POLICY "Public can read active special ads" ON special_ads
FOR SELECT USING (
  status = 'active' 
  AND (expires_at IS NULL OR expires_at >= NOW())
);

-- Policy: Only admins can create special ads
CREATE POLICY "Only admins can create special ads" ON special_ads
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Policy: Only admins can update special ads
CREATE POLICY "Only admins can update special ads" ON special_ads
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Policy: Only admins can delete special ads
CREATE POLICY "Only admins can delete special ads" ON special_ads
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Grant necessary permissions
GRANT ALL ON special_ads TO authenticated;
GRANT SELECT ON special_ads TO anon;

-- Create function to check if user can edit special ad
CREATE OR REPLACE FUNCTION can_edit_special_ad(ad_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is admin
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is the creator
  IF EXISTS (
    SELECT 1 FROM special_ads 
    WHERE id = ad_id 
    AND created_by = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get special ads with edit permissions
CREATE OR REPLACE FUNCTION get_special_ads_with_permissions()
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  description TEXT,
  price DECIMAL(10,2),
  status VARCHAR(20),
  expires_at TIMESTAMP WITH TIME ZONE,
  image_url TEXT,
  small_image_url TEXT,
  large_image_url TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  views INTEGER,
  clicks INTEGER,
  can_edit BOOLEAN,
  created_by_user JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.id,
    sa.title,
    sa.description,
    sa.price,
    sa.status,
    sa.expires_at,
    sa.image_url,
    sa.small_image_url,
    sa.large_image_url,
    sa.created_by,
    sa.created_at,
    sa.updated_at,
    sa.views,
    sa.clicks,
    can_edit_special_ad(sa.id) as can_edit,
    jsonb_build_object(
      'name', u.name,
      'email', u.email
    ) as created_by_user
  FROM special_ads sa
  LEFT JOIN users u ON sa.created_by = u.id
  ORDER BY sa.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION can_edit_special_ad(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_special_ads_with_permissions() TO authenticated, anon;
