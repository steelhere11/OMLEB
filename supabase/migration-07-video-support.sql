-- ============================================================================
-- OMLEB HVAC — Migration: Video Support
-- ============================================================================
-- Run this AFTER migration-04-photos.sql in Supabase SQL Editor.
-- This adds:
--   1. Video MIME types to the 'reportes' storage bucket
--   2. Increased file size limit (50MB for videos)
--   3. tipo_media column on reporte_fotos table (foto | video)
-- ============================================================================

-- ============================================================================
-- 1. UPDATE STORAGE BUCKET — Add video MIME types and increase size limit
-- ============================================================================
-- Videos need larger file size (50MB) and additional MIME types.
-- Keeps existing image types alongside new video types.

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg', 'image/png', 'image/webp',
  'video/mp4', 'video/quicktime', 'video/webm'
],
file_size_limit = 52428800  -- 50MB for videos
WHERE id = 'reportes';

-- ============================================================================
-- 2. ADD tipo_media COLUMN TO reporte_fotos
-- ============================================================================
-- Tracks whether a row is a photo or video.
-- Defaults to 'foto' for backward compatibility with existing rows.

ALTER TABLE public.reporte_fotos
  ADD COLUMN IF NOT EXISTS tipo_media text NOT NULL DEFAULT 'foto'
  CHECK (tipo_media IN ('foto', 'video'));

COMMENT ON COLUMN public.reporte_fotos.tipo_media IS 'Media type: foto or video';

-- ============================================================================
-- DONE. Storage bucket now accepts video uploads, and reporte_fotos tracks
-- whether each row is a photo or video via tipo_media column.
-- ============================================================================
