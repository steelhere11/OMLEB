-- ============================================================================
-- Migration 11: Rename "folios" to "ordenes_servicio"
-- ============================================================================
-- Run AFTER migration-10-feature-expansion.sql in Supabase SQL Editor.
--
-- This migration renames all folio-related tables, columns, indexes, triggers,
-- functions, constraints, and RLS policies from "folio(s)" to "orden(es)_servicio".
--
-- The folio number prefix changes from "F-" to "ODS-".
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. RENAME TABLES
-- ============================================================================

ALTER TABLE public.folios RENAME TO ordenes_servicio;
ALTER TABLE public.folio_asignados RENAME TO orden_asignados;
ALTER TABLE public.folio_equipos RENAME TO orden_equipos;

-- ============================================================================
-- 2. RENAME COLUMNS
-- ============================================================================

ALTER TABLE public.ordenes_servicio RENAME COLUMN numero_folio TO numero_orden;
ALTER TABLE public.orden_asignados RENAME COLUMN folio_id TO orden_servicio_id;
ALTER TABLE public.orden_equipos RENAME COLUMN folio_id TO orden_servicio_id;
ALTER TABLE public.reportes RENAME COLUMN folio_id TO orden_servicio_id;

-- ============================================================================
-- 3. RENAME SEQUENCE
-- ============================================================================

ALTER SEQUENCE public.folio_numero_seq RENAME TO orden_numero_seq;

-- ============================================================================
-- 4. REPLACE TRIGGER FUNCTION: generate_folio_number -> generate_orden_number
-- ============================================================================
-- Drop the old function after removing its trigger (section 5).
-- Create the new function with ODS- prefix.

CREATE OR REPLACE FUNCTION public.generate_orden_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.numero_orden IS NULL OR NEW.numero_orden = '' THEN
    NEW.numero_orden = 'ODS-' || lpad(nextval('public.orden_numero_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. DROP OLD TRIGGERS AND CREATE NEW ONES
-- ============================================================================

-- Drop old folio number trigger and create new orden number trigger
DROP TRIGGER IF EXISTS set_folio_number ON public.ordenes_servicio;

CREATE TRIGGER set_orden_number
  BEFORE INSERT ON public.ordenes_servicio
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_orden_number();

-- Drop old updated_at trigger and create new one
DROP TRIGGER IF EXISTS set_folios_updated_at ON public.ordenes_servicio;

CREATE TRIGGER set_ordenes_servicio_updated_at
  BEFORE UPDATE ON public.ordenes_servicio
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Drop the old trigger function (no longer needed)
DROP FUNCTION IF EXISTS public.generate_folio_number();

-- ============================================================================
-- 6. RENAME INDEXES
-- ============================================================================

ALTER INDEX idx_folios_sucursal RENAME TO idx_ordenes_servicio_sucursal;
ALTER INDEX idx_folios_cliente RENAME TO idx_ordenes_servicio_cliente;
ALTER INDEX idx_folio_asignados_folio RENAME TO idx_orden_asignados_orden;
ALTER INDEX idx_folio_asignados_usuario RENAME TO idx_orden_asignados_usuario;
ALTER INDEX idx_reportes_folio RENAME TO idx_reportes_orden;
ALTER INDEX idx_folio_equipos_folio RENAME TO idx_orden_equipos_orden;
ALTER INDEX idx_folio_equipos_equipo RENAME TO idx_orden_equipos_equipo;

-- ============================================================================
-- 7. DROP ALL EXISTING RLS POLICIES (must happen before dropping old function)
-- ============================================================================
-- Drop all policies that reference private.get_my_folio_ids() FIRST,
-- so the function can be replaced cleanly.

-- 7a. ordenes_servicio (formerly folios)
DROP POLICY IF EXISTS "folios_admin_all" ON public.ordenes_servicio;
DROP POLICY IF EXISTS "folios_tech_select" ON public.ordenes_servicio;

-- 7b. orden_asignados (formerly folio_asignados)
DROP POLICY IF EXISTS "folio_asignados_admin_all" ON public.orden_asignados;
DROP POLICY IF EXISTS "folio_asignados_tech_select" ON public.orden_asignados;

-- 7c. orden_equipos (formerly folio_equipos)
DROP POLICY IF EXISTS "folio_equipos_admin_all" ON public.orden_equipos;
DROP POLICY IF EXISTS "folio_equipos_tech_select" ON public.orden_equipos;
DROP POLICY IF EXISTS "folio_equipos_tech_insert" ON public.orden_equipos;

-- 7d. reportes
DROP POLICY IF EXISTS "reportes_admin_all" ON public.reportes;
DROP POLICY IF EXISTS "reportes_tech_select" ON public.reportes;
DROP POLICY IF EXISTS "reportes_tech_insert" ON public.reportes;
DROP POLICY IF EXISTS "reportes_tech_update" ON public.reportes;
DROP POLICY IF EXISTS "reportes_tech_delete" ON public.reportes;

-- 7e. reporte_equipos
DROP POLICY IF EXISTS "reporte_equipos_admin_all" ON public.reporte_equipos;
DROP POLICY IF EXISTS "reporte_equipos_tech_select" ON public.reporte_equipos;
DROP POLICY IF EXISTS "reporte_equipos_tech_insert" ON public.reporte_equipos;
DROP POLICY IF EXISTS "reporte_equipos_tech_update" ON public.reporte_equipos;
DROP POLICY IF EXISTS "reporte_equipos_tech_delete" ON public.reporte_equipos;

-- 7f. reporte_fotos
DROP POLICY IF EXISTS "reporte_fotos_admin_all" ON public.reporte_fotos;
DROP POLICY IF EXISTS "reporte_fotos_tech_select" ON public.reporte_fotos;
DROP POLICY IF EXISTS "reporte_fotos_tech_insert" ON public.reporte_fotos;
DROP POLICY IF EXISTS "reporte_fotos_tech_update" ON public.reporte_fotos;
DROP POLICY IF EXISTS "reporte_fotos_tech_delete" ON public.reporte_fotos;

-- 7g. reporte_materiales
DROP POLICY IF EXISTS "reporte_materiales_admin_all" ON public.reporte_materiales;
DROP POLICY IF EXISTS "reporte_materiales_tech_select" ON public.reporte_materiales;
DROP POLICY IF EXISTS "reporte_materiales_tech_insert" ON public.reporte_materiales;
DROP POLICY IF EXISTS "reporte_materiales_tech_update" ON public.reporte_materiales;
DROP POLICY IF EXISTS "reporte_materiales_tech_delete" ON public.reporte_materiales;

-- 7h. reporte_revisiones (may not exist if migration-10 was not run)
DO $$ BEGIN
  DROP POLICY IF EXISTS "reporte_revisiones_admin_all" ON public.reporte_revisiones;
  DROP POLICY IF EXISTS "reporte_revisiones_tech_select" ON public.reporte_revisiones;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- 7i. reporte_comentarios (may not exist if migration-09 was not run)
DO $$ BEGIN
  DROP POLICY IF EXISTS "reporte_comentarios_admin_all" ON public.reporte_comentarios;
  DROP POLICY IF EXISTS "reporte_comentarios_tech_select" ON public.reporte_comentarios;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================================================
-- 7.1 DROP AND RECREATE RLS HELPER FUNCTION
-- ============================================================================
-- Now that all policies depending on get_my_folio_ids() are dropped, we can
-- safely drop the old function and create the new one.

DROP FUNCTION IF EXISTS private.get_my_folio_ids();

CREATE OR REPLACE FUNCTION private.get_my_orden_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT orden_servicio_id
  FROM public.orden_asignados
  WHERE usuario_id = (SELECT auth.uid());
$$;

-- ============================================================================
-- 8. RECREATE ALL RLS POLICIES WITH NEW NAMES AND FUNCTION REFERENCES
-- ============================================================================

-- --------------------------------------------------------------------------
-- 8a. ordenes_servicio
-- --------------------------------------------------------------------------

CREATE POLICY "ordenes_servicio_admin_all"
  ON public.ordenes_servicio FOR ALL
  TO authenticated
  USING ((SELECT private.is_admin()));

CREATE POLICY "ordenes_servicio_tech_select"
  ON public.ordenes_servicio FOR SELECT
  TO authenticated
  USING (id IN (SELECT private.get_my_orden_ids()));

-- --------------------------------------------------------------------------
-- 8b. orden_asignados
-- --------------------------------------------------------------------------

CREATE POLICY "orden_asignados_admin_all"
  ON public.orden_asignados FOR ALL
  TO authenticated
  USING ((SELECT private.is_admin()));

CREATE POLICY "orden_asignados_tech_select"
  ON public.orden_asignados FOR SELECT
  TO authenticated
  USING (orden_servicio_id IN (SELECT private.get_my_orden_ids()));

-- --------------------------------------------------------------------------
-- 8c. orden_equipos
-- --------------------------------------------------------------------------

CREATE POLICY "orden_equipos_admin_all"
  ON public.orden_equipos FOR ALL
  TO authenticated
  USING ((SELECT private.is_admin()));

CREATE POLICY "orden_equipos_tech_select"
  ON public.orden_equipos FOR SELECT
  TO authenticated
  USING (orden_servicio_id IN (SELECT private.get_my_orden_ids()));

CREATE POLICY "orden_equipos_tech_insert"
  ON public.orden_equipos FOR INSERT
  TO authenticated
  WITH CHECK (orden_servicio_id IN (SELECT private.get_my_orden_ids()));

-- --------------------------------------------------------------------------
-- 8d. reportes
-- --------------------------------------------------------------------------

CREATE POLICY "reportes_admin_all"
  ON public.reportes FOR ALL
  TO authenticated
  USING ((SELECT private.is_admin()));

CREATE POLICY "reportes_tech_select"
  ON public.reportes FOR SELECT
  TO authenticated
  USING (orden_servicio_id IN (SELECT private.get_my_orden_ids()));

CREATE POLICY "reportes_tech_insert"
  ON public.reportes FOR INSERT
  TO authenticated
  WITH CHECK (
    orden_servicio_id IN (SELECT private.get_my_orden_ids())
    AND creado_por = (SELECT auth.uid())
  );

CREATE POLICY "reportes_tech_update"
  ON public.reportes FOR UPDATE
  TO authenticated
  USING (orden_servicio_id IN (SELECT private.get_my_orden_ids()));

CREATE POLICY "reportes_tech_delete"
  ON public.reportes FOR DELETE
  TO authenticated
  USING (
    orden_servicio_id IN (SELECT private.get_my_orden_ids())
    AND creado_por = (SELECT auth.uid())
  );

-- --------------------------------------------------------------------------
-- 8e. reporte_equipos
-- --------------------------------------------------------------------------

CREATE POLICY "reporte_equipos_admin_all"
  ON public.reporte_equipos FOR ALL
  TO authenticated
  USING ((SELECT private.is_admin()));

CREATE POLICY "reporte_equipos_tech_select"
  ON public.reporte_equipos FOR SELECT
  TO authenticated
  USING (
    reporte_id IN (
      SELECT r.id FROM public.reportes r
      WHERE r.orden_servicio_id IN (SELECT private.get_my_orden_ids())
    )
  );

CREATE POLICY "reporte_equipos_tech_insert"
  ON public.reporte_equipos FOR INSERT
  TO authenticated
  WITH CHECK (
    reporte_id IN (
      SELECT r.id FROM public.reportes r
      WHERE r.orden_servicio_id IN (SELECT private.get_my_orden_ids())
    )
  );

CREATE POLICY "reporte_equipos_tech_update"
  ON public.reporte_equipos FOR UPDATE
  TO authenticated
  USING (
    reporte_id IN (
      SELECT r.id FROM public.reportes r
      WHERE r.orden_servicio_id IN (SELECT private.get_my_orden_ids())
    )
  );

CREATE POLICY "reporte_equipos_tech_delete"
  ON public.reporte_equipos FOR DELETE
  TO authenticated
  USING (
    reporte_id IN (
      SELECT r.id FROM public.reportes r
      WHERE r.orden_servicio_id IN (SELECT private.get_my_orden_ids())
    )
  );

-- --------------------------------------------------------------------------
-- 8f. reporte_fotos
-- --------------------------------------------------------------------------

CREATE POLICY "reporte_fotos_admin_all"
  ON public.reporte_fotos FOR ALL
  TO authenticated
  USING ((SELECT private.is_admin()));

CREATE POLICY "reporte_fotos_tech_select"
  ON public.reporte_fotos FOR SELECT
  TO authenticated
  USING (
    reporte_id IN (
      SELECT r.id FROM public.reportes r
      WHERE r.orden_servicio_id IN (SELECT private.get_my_orden_ids())
    )
  );

CREATE POLICY "reporte_fotos_tech_insert"
  ON public.reporte_fotos FOR INSERT
  TO authenticated
  WITH CHECK (
    reporte_id IN (
      SELECT r.id FROM public.reportes r
      WHERE r.orden_servicio_id IN (SELECT private.get_my_orden_ids())
    )
  );

CREATE POLICY "reporte_fotos_tech_update"
  ON public.reporte_fotos FOR UPDATE
  TO authenticated
  USING (
    reporte_id IN (
      SELECT r.id FROM public.reportes r
      WHERE r.orden_servicio_id IN (SELECT private.get_my_orden_ids())
    )
  );

CREATE POLICY "reporte_fotos_tech_delete"
  ON public.reporte_fotos FOR DELETE
  TO authenticated
  USING (
    reporte_id IN (
      SELECT r.id FROM public.reportes r
      WHERE r.orden_servicio_id IN (SELECT private.get_my_orden_ids())
    )
  );

-- --------------------------------------------------------------------------
-- 8g. reporte_materiales
-- --------------------------------------------------------------------------

CREATE POLICY "reporte_materiales_admin_all"
  ON public.reporte_materiales FOR ALL
  TO authenticated
  USING ((SELECT private.is_admin()));

CREATE POLICY "reporte_materiales_tech_select"
  ON public.reporte_materiales FOR SELECT
  TO authenticated
  USING (
    reporte_id IN (
      SELECT r.id FROM public.reportes r
      WHERE r.orden_servicio_id IN (SELECT private.get_my_orden_ids())
    )
  );

CREATE POLICY "reporte_materiales_tech_insert"
  ON public.reporte_materiales FOR INSERT
  TO authenticated
  WITH CHECK (
    reporte_id IN (
      SELECT r.id FROM public.reportes r
      WHERE r.orden_servicio_id IN (SELECT private.get_my_orden_ids())
    )
  );

CREATE POLICY "reporte_materiales_tech_update"
  ON public.reporte_materiales FOR UPDATE
  TO authenticated
  USING (
    reporte_id IN (
      SELECT r.id FROM public.reportes r
      WHERE r.orden_servicio_id IN (SELECT private.get_my_orden_ids())
    )
  );

CREATE POLICY "reporte_materiales_tech_delete"
  ON public.reporte_materiales FOR DELETE
  TO authenticated
  USING (
    reporte_id IN (
      SELECT r.id FROM public.reportes r
      WHERE r.orden_servicio_id IN (SELECT private.get_my_orden_ids())
    )
  );

-- --------------------------------------------------------------------------
-- 8h. reporte_pasos — unaffected (uses creado_por join, not get_my_folio_ids)
-- --------------------------------------------------------------------------

-- --------------------------------------------------------------------------
-- 8i. reporte_revisiones (only if table exists)
-- --------------------------------------------------------------------------

DO $$ BEGIN
  CREATE POLICY "reporte_revisiones_admin_all"
    ON public.reporte_revisiones
    FOR ALL
    USING ((SELECT private.is_admin()))
    WITH CHECK ((SELECT private.is_admin()));

  CREATE POLICY "reporte_revisiones_tech_select"
    ON public.reporte_revisiones
    FOR SELECT
    USING (
      reporte_id IN (
        SELECT r.id FROM public.reportes r
        WHERE r.orden_servicio_id IN (SELECT private.get_my_orden_ids())
      )
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- --------------------------------------------------------------------------
-- 8j. reporte_comentarios (only if table exists)
-- --------------------------------------------------------------------------

DO $$ BEGIN
  CREATE POLICY "reporte_comentarios_admin_all"
    ON public.reporte_comentarios FOR ALL
    TO authenticated
    USING ((SELECT private.is_admin()));

  CREATE POLICY "reporte_comentarios_tech_select"
    ON public.reporte_comentarios FOR SELECT
    TO authenticated
    USING (
      reporte_id IN (
        SELECT r.id FROM public.reportes r
        WHERE r.orden_servicio_id IN (SELECT private.get_my_orden_ids())
      )
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================================================
-- 9. RENAME UNIQUE CONSTRAINT ON reportes
-- ============================================================================

DO $$ BEGIN
  ALTER TABLE public.reportes RENAME CONSTRAINT unique_folio_fecha TO unique_orden_fecha;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- ============================================================================
-- 10. UPDATE REALTIME PUBLICATION
-- ============================================================================
-- Remove old table names and add new ones.
-- folio_equipos was added to realtime in migration-06; rename it.
-- reportes, reporte_equipos, reporte_materiales were added in migration-03
-- but their table names haven't changed, so they don't need updating.

-- The table was already renamed to orden_equipos in step 1, so drop by new name.
-- Use DO block because ALTER PUBLICATION doesn't support IF EXISTS.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE public.orden_equipos;
EXCEPTION WHEN undefined_object THEN
  NULL; -- table wasn't in publication, ignore
END $$;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orden_equipos;

-- ============================================================================
-- 11. UPDATE EXISTING DATA: F- prefix -> ODS- prefix
-- ============================================================================

UPDATE public.ordenes_servicio
SET numero_orden = REPLACE(numero_orden, 'F-', 'ODS-')
WHERE numero_orden LIKE 'F-%';

-- ============================================================================
-- 12. UPDATE TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE public.ordenes_servicio IS 'Ordenes de servicio (work orders). Each order is assigned to a branch, client, and team.';
COMMENT ON COLUMN public.ordenes_servicio.numero_orden IS 'Auto-generated order number with ODS- prefix (e.g., ODS-0001).';

COMMENT ON TABLE public.orden_asignados IS 'Many-to-many assignment of users (technicians/helpers) to ordenes de servicio.';
COMMENT ON COLUMN public.orden_asignados.orden_servicio_id IS 'FK to ordenes_servicio. Renamed from folio_id.';

COMMENT ON TABLE public.orden_equipos IS 'Equipment assigned to an orden de servicio. Scopes equipment from branch to specific order.';
COMMENT ON COLUMN public.orden_equipos.orden_servicio_id IS 'FK to ordenes_servicio. Renamed from folio_id.';

COMMENT ON COLUMN public.reportes.orden_servicio_id IS 'FK to ordenes_servicio. Renamed from folio_id.';

-- ============================================================================
-- DONE. All folio references have been renamed to ordenes_servicio.
-- ============================================================================

COMMIT;
