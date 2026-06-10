-- Crea el bucket usado por el formulario de reportes para guardar evidencias.
-- Ejecutar en Supabase SQL Editor con permisos de administrador del proyecto.

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('evidencias', 'evidencias', true, 10485760)
ON CONFLICT (id) DO UPDATE
SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS "Public read evidencias storage" ON storage.objects;
CREATE POLICY "Public read evidencias storage"
ON storage.objects
FOR SELECT
USING (bucket_id = 'evidencias');

DROP POLICY IF EXISTS "Authenticated upload evidencias storage" ON storage.objects;
CREATE POLICY "Authenticated upload evidencias storage"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'evidencias');

DROP POLICY IF EXISTS "Owner update evidencias storage" ON storage.objects;
CREATE POLICY "Owner update evidencias storage"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'evidencias' AND owner = auth.uid())
WITH CHECK (bucket_id = 'evidencias' AND owner = auth.uid());

DROP POLICY IF EXISTS "Owner delete evidencias storage" ON storage.objects;
CREATE POLICY "Owner delete evidencias storage"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'evidencias' AND owner = auth.uid());
