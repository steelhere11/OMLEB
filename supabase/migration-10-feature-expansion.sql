-- migration-10-feature-expansion.sql
-- Phase 10: Feature Expansion
-- Run AFTER migration-09-admin-control.sql
--
-- Changes:
-- 1. reporte_revisiones table (revision audit trail for approved reports)
-- 2. reportes.revision_actual column (current revision number)
-- 3. reporte_pasos.nombre_custom column (custom step name for ad-hoc steps)
-- 4. Updated etiqueta CHECK constraint (add 'anotado')
-- 5. RLS policies for reporte_revisiones

-- ============================================================================
-- 1. reportes.revision_actual — tracks current revision number
-- ============================================================================

ALTER TABLE public.reportes
  ADD COLUMN IF NOT EXISTS revision_actual integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.reportes.revision_actual IS
  'Current revision number. 0 = original, incremented with each post-approval edit.';

-- ============================================================================
-- 2. reporte_revisiones — audit trail for post-approval edits
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reporte_revisiones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporte_id  uuid NOT NULL REFERENCES public.reportes (id) ON DELETE CASCADE,
  autor_id    uuid NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  numero      integer NOT NULL DEFAULT 1,
  resumen     text NOT NULL,
  cambios     jsonb NOT NULL DEFAULT '[]',
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.reporte_revisiones IS
  'Audit trail for post-approval report edits. Each row = one revision with summary and field-level changes.';

COMMENT ON COLUMN public.reporte_revisiones.numero IS
  'Revision number: 1, 2, 3... matches reportes.revision_actual after insert.';

COMMENT ON COLUMN public.reporte_revisiones.resumen IS
  'Admin-written summary of what changed, e.g. "Se corrigió lectura de amperaje en paso 5".';

COMMENT ON COLUMN public.reporte_revisiones.cambios IS
  'JSON array of {campo, valor_anterior, valor_nuevo, entidad, entidad_id} change records.';

-- Index for fast lookup by report
CREATE INDEX IF NOT EXISTS idx_reporte_revisiones_reporte_id
  ON public.reporte_revisiones (reporte_id);

-- ============================================================================
-- 3. reporte_pasos.nombre_custom — for ad-hoc steps not in plantillas
-- ============================================================================

ALTER TABLE public.reporte_pasos
  ADD COLUMN IF NOT EXISTS nombre_custom text;

COMMENT ON COLUMN public.reporte_pasos.nombre_custom IS
  'Custom step name for ad-hoc steps not in plantillas. When set, plantilla_paso_id and falla_correctiva_id are both NULL.';

-- ============================================================================
-- 4. Updated etiqueta CHECK constraint — add ''anotado''
-- ============================================================================

ALTER TABLE public.reporte_fotos DROP CONSTRAINT IF EXISTS reporte_fotos_etiqueta_check;
ALTER TABLE public.reporte_fotos ADD CONSTRAINT reporte_fotos_etiqueta_check
  CHECK (etiqueta IN (
    'antes', 'durante', 'despues', 'dano', 'placa', 'progreso',
    'llegada', 'sitio', 'equipo_general', 'anotado'
  ));

-- ============================================================================
-- 5. RLS policies for reporte_revisiones
-- ============================================================================

ALTER TABLE public.reporte_revisiones ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY reporte_revisiones_admin_all
  ON public.reporte_revisiones
  FOR ALL
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

-- Technician: read-only for revisions on their assigned folios
CREATE POLICY reporte_revisiones_tech_select
  ON public.reporte_revisiones
  FOR SELECT
  USING (
    reporte_id IN (
      SELECT r.id FROM public.reportes r
      WHERE r.folio_id IN (SELECT private.get_my_folio_ids())
    )
  );
