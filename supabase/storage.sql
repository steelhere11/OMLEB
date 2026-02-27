-- Storage bucket for client logos
-- Run AFTER schema.sql and rls.sql in Supabase SQL Editor

-- Create public bucket for client logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'clientes',
  'clientes',
  true,
  2097152,  -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- RLS policy: Admins can upload logos
-- (Service role key bypasses RLS, but this is a safety net)
CREATE POLICY "admin_upload_logos"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'clientes'
  AND ((SELECT auth.jwt()) -> 'app_metadata' ->> 'rol') = 'admin'
);

-- RLS policy: Anyone authenticated can view logos (public bucket handles this too)
CREATE POLICY "authenticated_view_logos"
ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'clientes');

-- RLS policy: Admins can delete logos (for logo replacement)
CREATE POLICY "admin_delete_logos"
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'clientes'
  AND ((SELECT auth.jwt()) -> 'app_metadata' ->> 'rol') = 'admin'
);
