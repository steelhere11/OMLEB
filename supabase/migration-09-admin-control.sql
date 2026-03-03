-- ============================================================================
-- Migration 09: Admin Full Control — photo review, admin notes, comments
-- ============================================================================
-- Run AFTER migration-08-registration.sql in Supabase SQL Editor.
-- This adds:
--   1. Photo review status column on reporte_fotos (estatus_revision)
--   2. Admin notes column on reporte_fotos (nota_admin)
--   3. reporte_comentarios table (admin comments on reports/equipment)
--   4. RLS policies for reporte_comentarios
-- ============================================================================

-- ============================================================================
-- 1. PHOTO REVIEW STATUS on reporte_fotos
-- ============================================================================
-- Allows admin to flag each photo as accepted, rejected, or needs retake.
-- Default is 'pendiente' (not yet reviewed).

ALTER TABLE public.reporte_fotos
  ADD COLUMN IF NOT EXISTS estatus_revision text NOT NULL DEFAULT 'pendiente'
  CHECK (estatus_revision IN ('pendiente', 'aceptada', 'rechazada', 'retomar'));

COMMENT ON COLUMN public.reporte_fotos.estatus_revision
  IS 'Admin review status: pendiente (default), aceptada, rechazada, retomar (needs retake).';

-- ============================================================================
-- 2. ADMIN NOTES on reporte_fotos
-- ============================================================================
-- Free-text note from admin explaining why a photo was flagged or needs retake.

ALTER TABLE public.reporte_fotos
  ADD COLUMN IF NOT EXISTS nota_admin text;

COMMENT ON COLUMN public.reporte_fotos.nota_admin
  IS 'Admin note on photo — explanation for rejection, retake request, or general feedback.';

-- ============================================================================
-- 3. REPORTE_COMENTARIOS table — Admin comments on reports
-- ============================================================================
-- Admins can leave comments at the report level or scoped to specific equipment.
-- Technicians can read comments for feedback visibility.

CREATE TABLE IF NOT EXISTS public.reporte_comentarios (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporte_id  uuid NOT NULL REFERENCES public.reportes (id) ON DELETE CASCADE,
  equipo_id   uuid REFERENCES public.equipos (id) ON DELETE SET NULL,
  autor_id    uuid NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  contenido   text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reporte_comentarios_reporte
  ON public.reporte_comentarios (reporte_id);

COMMENT ON TABLE public.reporte_comentarios
  IS 'Admin comments on reports. Can be report-level (equipo_id NULL) or equipment-scoped.';
COMMENT ON COLUMN public.reporte_comentarios.equipo_id
  IS 'If set, comment is scoped to this equipment within the report. NULL = report-level comment.';
COMMENT ON COLUMN public.reporte_comentarios.autor_id
  IS 'User who wrote the comment (typically admin).';

-- ============================================================================
-- 4. RLS POLICIES for reporte_comentarios
-- ============================================================================

ALTER TABLE public.reporte_comentarios ENABLE ROW LEVEL SECURITY;

-- Admin: full access (insert, select, update, delete)
CREATE POLICY "reporte_comentarios_admin_all"
  ON public.reporte_comentarios FOR ALL
  TO authenticated
  USING ((SELECT private.is_admin()));

-- Technicians: read-only for feedback visibility
-- Scoped to comments on reports for their assigned folios
CREATE POLICY "reporte_comentarios_tech_select"
  ON public.reporte_comentarios FOR SELECT
  TO authenticated
  USING (
    reporte_id IN (
      SELECT r.id FROM public.reportes r
      WHERE r.orden_servicio_id IN (SELECT private.get_my_orden_ids())
    )
  );

-- ============================================================================
-- DONE. Run this migration in Supabase SQL Editor after migration-08-registration.sql.
-- ============================================================================
