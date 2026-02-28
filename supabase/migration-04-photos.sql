-- ============================================================================
-- OMLEB HVAC — Migration: Photo Capture & Signatures
-- ============================================================================
-- Run this AFTER schema.sql, rls.sql, and migration-workflows.sql in Supabase SQL Editor.
-- This adds:
--   1. Storage bucket 'reportes' for report photos (public read, authenticated write)
--   2. RLS policies for storage.objects scoped to 'reportes' bucket
--   3. nombre_encargado column on reportes table
-- ============================================================================

-- ============================================================================
-- 1. STORAGE BUCKET — Report photos
-- ============================================================================
-- Public read so photos can be displayed in reports and PDFs.
-- Authenticated write so only logged-in users can upload.
-- 5MB limit per file (compressed photos are ~800KB, but allow margin).
-- Only allow image types.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reportes',
  'reportes',
  true,
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. RLS POLICIES — Storage access for 'reportes' bucket
-- ============================================================================

-- Authenticated users can upload photos
CREATE POLICY "authenticated_upload_photos"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'reportes');

-- Authenticated users can view photos
CREATE POLICY "authenticated_view_photos"
ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'reportes');

-- Authenticated users can delete photos
CREATE POLICY "authenticated_delete_photos"
ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'reportes');

-- ============================================================================
-- 3. ADD nombre_encargado TO reportes
-- ============================================================================
-- Name of the branch manager who signed the report (typed by tech at signature time).
-- Only populated when status = completado and signature is provided.

ALTER TABLE public.reportes ADD COLUMN IF NOT EXISTS nombre_encargado text;
COMMENT ON COLUMN public.reportes.nombre_encargado IS 'Name of the branch manager who signed the report.';

-- ============================================================================
-- DONE. Storage bucket ready for photo uploads via browser client.
-- ============================================================================
