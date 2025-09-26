-- Create storage bucket for special ads images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ads_especiais',
  'ads_especiais',
  true,
  10485760, -- 10MB limit (aumentado para imagens de alta qualidade)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view special ads images
CREATE POLICY "Anyone can view special ads images" ON storage.objects
  FOR SELECT USING (bucket_id = 'ads_especiais');

-- Policy: Authenticated users can upload special ads images
CREATE POLICY "Authenticated users can upload special ads images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'ads_especiais' 
    AND auth.role() = 'authenticated'
  );

-- Policy: Admins can manage special ads images
CREATE POLICY "Admins can manage special ads images" ON storage.objects
  FOR ALL USING (
    bucket_id = 'ads_especiais' 
    AND is_admin(auth.uid())
  );

-- Policy: Users can update their own special ads images
CREATE POLICY "Users can update their own special ads images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'ads_especiais' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own special ads images
CREATE POLICY "Users can delete their own special ads images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'ads_especiais' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
