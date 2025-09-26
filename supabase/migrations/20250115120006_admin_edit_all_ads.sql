-- Allow admins to edit any ad (common ads)
-- This migration updates RLS policies to allow admins to edit any ad

-- Drop existing policies for ads table
DROP POLICY IF EXISTS "Users can update their own ads" ON ads;
DROP POLICY IF EXISTS "Users can delete their own ads" ON ads;

-- Create new comprehensive policies for ads table

-- Policy: Users can read their own ads
CREATE POLICY "Users can read their own ads" ON ads
FOR SELECT USING (user_id = auth.uid());

-- Policy: Users can create ads
CREATE POLICY "Users can create ads" ON ads
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own ads
CREATE POLICY "Users can update their own ads" ON ads
FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own ads
CREATE POLICY "Users can delete their own ads" ON ads
FOR DELETE USING (user_id = auth.uid());

-- Policy: Admins can read all ads
CREATE POLICY "Admins can read all ads" ON ads
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Policy: Admins can update any ad
CREATE POLICY "Admins can update any ad" ON ads
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

-- Policy: Admins can delete any ad
CREATE POLICY "Admins can delete any ad" ON ads
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Policy: Public can read active ads
CREATE POLICY "Public can read active ads" ON ads
FOR SELECT USING (status = 'active');

-- Update special_ads policies to allow admins to edit any special ad
DROP POLICY IF EXISTS "Only admins can update special ads" ON special_ads;

-- Policy: Admins can update any special ad
CREATE POLICY "Admins can update any special ad" ON special_ads
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

-- Create function to check if user can edit any ad
CREATE OR REPLACE FUNCTION can_edit_any_ad()
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
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can edit specific ad
CREATE OR REPLACE FUNCTION can_edit_ad(ad_id UUID)
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
  
  -- Check if user is the owner
  IF EXISTS (
    SELECT 1 FROM ads 
    WHERE id = ad_id 
    AND user_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION can_edit_any_ad() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION can_edit_ad(UUID) TO authenticated, anon;
