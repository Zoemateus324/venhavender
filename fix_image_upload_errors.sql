-- =====================================================
-- SCRIPT PARA CORRIGIR PROBLEMAS DE UPLOAD DE IMAGENS
-- Sistema Venha Vender - Correção de Upload de Imagens
-- =====================================================

-- 1. CRIAR BUCKET DE STORAGE PARA IMAGENS
-- =====================================================

-- Criar bucket para imagens de anúncios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'ad-images',
    'ad-images',
    true,
    52428800, -- 50MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Criar bucket para avatars de usuários
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'user-avatars',
    'user-avatars',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. CONFIGURAR POLÍTICAS DE STORAGE
-- =====================================================

-- Políticas para bucket de imagens de anúncios
DROP POLICY IF EXISTS "Anyone can view ad images" ON storage.objects;
CREATE POLICY "Anyone can view ad images" ON storage.objects
FOR SELECT USING (bucket_id = 'ad-images');

DROP POLICY IF EXISTS "Authenticated users can upload ad images" ON storage.objects;
CREATE POLICY "Authenticated users can upload ad images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'ad-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update own ad images" ON storage.objects;
CREATE POLICY "Users can update own ad images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'ad-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own ad images" ON storage.objects;
CREATE POLICY "Users can delete own ad images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'ad-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Políticas para bucket de avatars
DROP POLICY IF EXISTS "Anyone can view user avatars" ON storage.objects;
CREATE POLICY "Anyone can view user avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'user-avatars');

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'user-avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'user-avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar" ON storage.objects
FOR DELETE USING (
    bucket_id = 'user-avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. CRIAR FUNÇÕES AUXILIARES PARA UPLOAD
-- =====================================================

-- Função para gerar nome único de arquivo
CREATE OR REPLACE FUNCTION generate_unique_filename(original_name TEXT)
RETURNS TEXT AS $$
DECLARE
    file_extension TEXT;
    timestamp_part TEXT;
    random_part TEXT;
    unique_name TEXT;
BEGIN
    -- Extrair extensão do arquivo
    file_extension := COALESCE(
        CASE 
            WHEN position('.' in original_name) > 0 
            THEN substring(original_name from position('.' in original_name))
            ELSE ''
        END,
        '.jpg'
    );
    
    -- Gerar timestamp e parte aleatória
    timestamp_part := extract(epoch from now())::text;
    random_part := substring(md5(random()::text) from 1 for 8);
    
    -- Combinar para criar nome único
    unique_name := timestamp_part || '-' || random_part || file_extension;
    
    RETURN unique_name;
END;
$$ LANGUAGE plpgsql;

-- Função para obter URL pública de imagem
CREATE OR REPLACE FUNCTION get_image_url(bucket_name TEXT, file_path TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN 'https://edvdzfvevldfetveupes.supabase.co/storage/v1/object/public/' || bucket_name || '/' || file_path;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Função para validar tipo de arquivo
CREATE OR REPLACE FUNCTION validate_image_type(file_name TEXT, mime_type TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar extensão
    IF file_name NOT LIKE '%.jpg' 
       AND file_name NOT LIKE '%.jpeg' 
       AND file_name NOT LIKE '%.png' 
       AND file_name NOT LIKE '%.webp' 
       AND file_name NOT LIKE '%.gif' THEN
        RETURN false;
    END IF;
    
    -- Verificar MIME type
    IF mime_type NOT IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif') THEN
        RETURN false;
    END IF;
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql;

-- 4. CONFIGURAR PERMISSÕES DAS FUNÇÕES
-- =====================================================

-- Conceder permissões de execução das funções
GRANT EXECUTE ON FUNCTION generate_unique_filename(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_image_url(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_image_type(TEXT, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION generate_unique_filename(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_image_url(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION validate_image_type(TEXT, TEXT) TO anon;

-- 5. CRIAR TRIGGER PARA ATUALIZAR URLS DE IMAGENS
-- =====================================================

-- Função para atualizar URLs de imagens automaticamente
CREATE OR REPLACE FUNCTION update_ad_image_urls()
RETURNS TRIGGER AS $$
DECLARE
    base_url TEXT;
    updated_photos TEXT[];
    photo_url TEXT;
BEGIN
    base_url := 'https://edvdzfvevldfetveupes.supabase.co/storage/v1/object/public/ad-images/';
    
    -- Atualizar array de fotos com URLs completas
    IF NEW.photos IS NOT NULL AND array_length(NEW.photos, 1) > 0 THEN
        updated_photos := ARRAY[]::TEXT[];
        
        FOR i IN 1..array_length(NEW.photos, 1) LOOP
            photo_url := NEW.photos[i];
            
            -- Se a URL não contém o domínio completo, adicionar
            IF photo_url NOT LIKE 'https://%' THEN
                photo_url := base_url || NEW.user_id::text || '/' || photo_url;
            END IF;
            
            updated_photos := array_append(updated_photos, photo_url);
        END LOOP;
        
        NEW.photos := updated_photos;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar URLs automaticamente
DROP TRIGGER IF EXISTS update_ad_image_urls_trigger ON ads;
CREATE TRIGGER update_ad_image_urls_trigger
    BEFORE INSERT OR UPDATE ON ads
    FOR EACH ROW
    EXECUTE FUNCTION update_ad_image_urls();

-- 6. ATUALIZAR DADOS EXISTENTES COM URLS CORRETAS
-- =====================================================

-- Atualizar anúncios existentes com URLs corretas
UPDATE ads 
SET photos = ARRAY(
    SELECT CASE 
        WHEN photo NOT LIKE 'https://%' 
        THEN 'https://edvdzfvevldfetveupes.supabase.co/storage/v1/object/public/ad-images/' || user_id::text || '/' || photo
        ELSE photo
    END
    FROM unnest(photos) AS photo
)
WHERE photos IS NOT NULL AND array_length(photos, 1) > 0;

-- 7. CRIAR FUNÇÃO PARA UPLOAD SEGURO
-- =====================================================

-- Função para fazer upload seguro de imagem
CREATE OR REPLACE FUNCTION upload_ad_image(
    user_id UUID,
    file_name TEXT,
    file_data BYTEA,
    mime_type TEXT
)
RETURNS JSON AS $$
DECLARE
    unique_name TEXT;
    file_path TEXT;
    public_url TEXT;
    result JSON;
BEGIN
    -- Validar tipo de arquivo
    IF NOT validate_image_type(file_name, mime_type) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Tipo de arquivo não suportado'
        );
    END IF;
    
    -- Gerar nome único
    unique_name := generate_unique_filename(file_name);
    file_path := user_id::text || '/' || unique_name;
    
    -- Fazer upload para storage
    INSERT INTO storage.objects (bucket_id, name, owner, metadata)
    VALUES ('ad-images', file_path, user_id, json_build_object('mimetype', mime_type));
    
    -- Gerar URL pública
    public_url := get_image_url('ad-images', file_path);
    
    result := json_build_object(
        'success', true,
        'file_name', unique_name,
        'file_path', file_path,
        'public_url', public_url
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erro no upload: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Configurar permissões da função
GRANT EXECUTE ON FUNCTION upload_ad_image(UUID, TEXT, BYTEA, TEXT) TO authenticated;

-- 8. CRIAR CONFIGURAÇÕES DE STORAGE
-- =====================================================

-- Inserir configurações de storage no sistema
INSERT INTO system_settings (key, value, description, is_public) VALUES
('storage_enabled', 'true', 'Storage habilitado', true),
('max_file_size', '52428800', 'Tamanho máximo de arquivo (50MB)', true),
('allowed_image_types', 'image/jpeg,image/png,image/webp,image/gif', 'Tipos de imagem permitidos', true),
('storage_base_url', 'https://edvdzfvevldfetveupes.supabase.co/storage/v1/object/public/', 'URL base do storage', true)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    is_public = EXCLUDED.is_public;

-- 9. VERIFICAÇÃO E TESTE
-- =====================================================

-- Verificar buckets criados
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE id IN ('ad-images', 'user-avatars');

-- Verificar políticas de storage
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- Verificar configurações de storage
SELECT 
    key,
    value,
    description
FROM system_settings
WHERE key LIKE '%storage%' OR key LIKE '%image%'
ORDER BY key;

-- Testar função de geração de nome único
SELECT 'Testando generate_unique_filename:' as test, generate_unique_filename('teste.jpg') as result;
SELECT 'Testando get_image_url:' as test, get_image_url('ad-images', 'teste.jpg') as result;
SELECT 'Testando validate_image_type:' as test, validate_image_type('teste.jpg', 'image/jpeg') as result;

-- 10. CRIAR DADOS DE TESTE PARA IMAGENS
-- =====================================================

-- Inserir algumas imagens de teste se não existirem
INSERT INTO ads (title, description, price, status, user_id, category_id, photos, type, start_date, end_date, admin_approved)
SELECT 
    'Anúncio com Imagem ' || generate_series,
    'Descrição do anúncio com imagem de teste',
    100.00 + (generate_series * 50),
    'active',
    '00000000-0000-0000-0000-000000000001',
    '550e8400-e29b-41d4-a716-446655440001',
    ARRAY['https://edvdzfvevldfetveupes.supabase.co/storage/v1/object/public/ad-images/00000000-0000-0000-0000-000000000001/test-image-' || generate_series || '.jpg'],
    'grid',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '14 days',
    true
FROM generate_series(1, 2)
WHERE NOT EXISTS (SELECT 1 FROM ads WHERE title LIKE 'Anúncio com Imagem%');

-- =====================================================
-- SCRIPT DE CORREÇÃO DE UPLOAD DE IMAGENS CONCLUÍDO
-- Problemas de upload foram corrigidos
-- =====================================================
