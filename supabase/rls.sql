-- ============================================================================
-- OMLEB HVAC -- Row Level Security Policies
-- ============================================================================
-- Run this file AFTER schema.sql in Supabase SQL Editor.
--
-- Architecture:
-- 1. Private schema with SECURITY DEFINER helper functions
-- 2. All auth.uid() and auth.jwt() calls wrapped in (SELECT ...) for performance
-- 3. Helper functions prevent circular RLS dependencies
-- ============================================================================

-- ============================================================================
-- 1. PRIVATE SCHEMA + HELPER FUNCTIONS
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS private;

-- Helper: Get current user's role from JWT app_metadata
CREATE OR REPLACE FUNCTION private.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT auth.jwt()) -> 'app_metadata' ->> 'rol',
    'tecnico'
  );
$$;

-- Helper: Check if current user is admin
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT ((SELECT auth.jwt()) -> 'app_metadata' ->> 'rol') = 'admin';
$$;

-- Helper: Get folio IDs assigned to current user (avoids circular RLS)
CREATE OR REPLACE FUNCTION private.get_my_folio_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT folio_id
  FROM public.folio_asignados
  WHERE usuario_id = (SELECT auth.uid());
$$;

-- ============================================================================
-- 2. ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folio_asignados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reporte_equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reporte_fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reporte_materiales ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. RLS POLICIES
-- ============================================================================

-- --------------------------------------------------------------------------
-- users
-- --------------------------------------------------------------------------
-- Admin: full read, insert (via service role for creation), update all
-- Technicians: read all (needed to see team members), update own row only

CREATE POLICY "users_select_all"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_insert_admin"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT private.is_admin()));

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "users_update_admin"
  ON public.users FOR UPDATE
  TO authenticated
  USING ((SELECT private.is_admin()));

CREATE POLICY "users_delete_admin"
  ON public.users FOR DELETE
  TO authenticated
  USING ((SELECT private.is_admin()));

-- --------------------------------------------------------------------------
-- clientes
-- --------------------------------------------------------------------------
-- Admin: full CRUD
-- Technicians: read-only (needed to see client info on folios)

CREATE POLICY "clientes_select_all"
  ON public.clientes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "clientes_insert_admin"
  ON public.clientes FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT private.is_admin()));

CREATE POLICY "clientes_update_admin"
  ON public.clientes FOR UPDATE
  TO authenticated
  USING ((SELECT private.is_admin()));

CREATE POLICY "clientes_delete_admin"
  ON public.clientes FOR DELETE
  TO authenticated
  USING ((SELECT private.is_admin()));

-- --------------------------------------------------------------------------
-- sucursales
-- --------------------------------------------------------------------------
-- Admin: full CRUD
-- Technicians: read-only

CREATE POLICY "sucursales_select_all"
  ON public.sucursales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "sucursales_insert_admin"
  ON public.sucursales FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT private.is_admin()));

CREATE POLICY "sucursales_update_admin"
  ON public.sucursales FOR UPDATE
  TO authenticated
  USING ((SELECT private.is_admin()));

CREATE POLICY "sucursales_delete_admin"
  ON public.sucursales FOR DELETE
  TO authenticated
  USING ((SELECT private.is_admin()));

-- --------------------------------------------------------------------------
-- equipos
-- --------------------------------------------------------------------------
-- Admin: full CRUD
-- Technicians: read all (branch equipment), insert (field-added equipment)

CREATE POLICY "equipos_select_all"
  ON public.equipos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "equipos_insert_admin"
  ON public.equipos FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT private.is_admin()));

CREATE POLICY "equipos_insert_tech"
  ON public.equipos FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT (SELECT private.is_admin())
    AND agregado_por = (SELECT auth.uid())
  );

CREATE POLICY "equipos_update_admin"
  ON public.equipos FOR UPDATE
  TO authenticated
  USING ((SELECT private.is_admin()));

CREATE POLICY "equipos_delete_admin"
  ON public.equipos FOR DELETE
  TO authenticated
  USING ((SELECT private.is_admin()));

-- --------------------------------------------------------------------------
-- folios
-- --------------------------------------------------------------------------
-- Admin: full CRUD
-- Technicians: read assigned folios only

CREATE POLICY "folios_admin_all"
  ON public.folios FOR ALL
  TO authenticated
  USING ((SELECT private.is_admin()));

CREATE POLICY "folios_tech_select"
  ON public.folios FOR SELECT
  TO authenticated
  USING (id IN (SELECT private.get_my_folio_ids()));

-- --------------------------------------------------------------------------
-- folio_asignados
-- --------------------------------------------------------------------------
-- Admin: full CRUD
-- Technicians: read own assignments only

CREATE POLICY "folio_asignados_admin_all"
  ON public.folio_asignados FOR ALL
  TO authenticated
  USING ((SELECT private.is_admin()));

CREATE POLICY "folio_asignados_tech_select"
  ON public.folio_asignados FOR SELECT
  TO authenticated
  USING (usuario_id = (SELECT auth.uid()));

-- --------------------------------------------------------------------------
-- reportes
-- --------------------------------------------------------------------------
-- Admin: full CRUD
-- Technicians: CRUD on reports for their assigned folios

CREATE POLICY "reportes_admin_all"
  ON public.reportes FOR ALL
  TO authenticated
  USING ((SELECT private.is_admin()));

CREATE POLICY "reportes_tech_select"
  ON public.reportes FOR SELECT
  TO authenticated
  USING (folio_id IN (SELECT private.get_my_folio_ids()));

CREATE POLICY "reportes_tech_insert"
  ON public.reportes FOR INSERT
  TO authenticated
  WITH CHECK (
    folio_id IN (SELECT private.get_my_folio_ids())
    AND creado_por = (SELECT auth.uid())
  );

CREATE POLICY "reportes_tech_update"
  ON public.reportes FOR UPDATE
  TO authenticated
  USING (folio_id IN (SELECT private.get_my_folio_ids()));

CREATE POLICY "reportes_tech_delete"
  ON public.reportes FOR DELETE
  TO authenticated
  USING (
    folio_id IN (SELECT private.get_my_folio_ids())
    AND creado_por = (SELECT auth.uid())
  );

-- --------------------------------------------------------------------------
-- reporte_equipos
-- --------------------------------------------------------------------------
-- Admin: full CRUD
-- Technicians: CRUD via folio assignment (join through reportes)

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
      WHERE r.folio_id IN (SELECT private.get_my_folio_ids())
    )
  );

CREATE POLICY "reporte_equipos_tech_insert"
  ON public.reporte_equipos FOR INSERT
  TO authenticated
  WITH CHECK (
    reporte_id IN (
      SELECT r.id FROM public.reportes r
      WHERE r.folio_id IN (SELECT private.get_my_folio_ids())
    )
  );

CREATE POLICY "reporte_equipos_tech_update"
  ON public.reporte_equipos FOR UPDATE
  TO authenticated
  USING (
    reporte_id IN (
      SELECT r.id FROM public.reportes r
      WHERE r.folio_id IN (SELECT private.get_my_folio_ids())
    )
  );

CREATE POLICY "reporte_equipos_tech_delete"
  ON public.reporte_equipos FOR DELETE
  TO authenticated
  USING (
    reporte_id IN (
      SELECT r.id FROM public.reportes r
      WHERE r.folio_id IN (SELECT private.get_my_folio_ids())
    )
  );

-- --------------------------------------------------------------------------
-- reporte_fotos
-- --------------------------------------------------------------------------
-- Admin: full CRUD
-- Technicians: CRUD via folio assignment (join through reportes)

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
      WHERE r.folio_id IN (SELECT private.get_my_folio_ids())
    )
  );

CREATE POLICY "reporte_fotos_tech_insert"
  ON public.reporte_fotos FOR INSERT
  TO authenticated
  WITH CHECK (
    reporte_id IN (
      SELECT r.id FROM public.reportes r
      WHERE r.folio_id IN (SELECT private.get_my_folio_ids())
    )
  );

CREATE POLICY "reporte_fotos_tech_update"
  ON public.reporte_fotos FOR UPDATE
  TO authenticated
  USING (
    reporte_id IN (
      SELECT r.id FROM public.reportes r
      WHERE r.folio_id IN (SELECT private.get_my_folio_ids())
    )
  );

CREATE POLICY "reporte_fotos_tech_delete"
  ON public.reporte_fotos FOR DELETE
  TO authenticated
  USING (
    reporte_id IN (
      SELECT r.id FROM public.reportes r
      WHERE r.folio_id IN (SELECT private.get_my_folio_ids())
    )
  );

-- --------------------------------------------------------------------------
-- reporte_materiales
-- --------------------------------------------------------------------------
-- Admin: full CRUD
-- Technicians: CRUD via folio assignment (join through reportes)

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
      WHERE r.folio_id IN (SELECT private.get_my_folio_ids())
    )
  );

CREATE POLICY "reporte_materiales_tech_insert"
  ON public.reporte_materiales FOR INSERT
  TO authenticated
  WITH CHECK (
    reporte_id IN (
      SELECT r.id FROM public.reportes r
      WHERE r.folio_id IN (SELECT private.get_my_folio_ids())
    )
  );

CREATE POLICY "reporte_materiales_tech_update"
  ON public.reporte_materiales FOR UPDATE
  TO authenticated
  USING (
    reporte_id IN (
      SELECT r.id FROM public.reportes r
      WHERE r.folio_id IN (SELECT private.get_my_folio_ids())
    )
  );

CREATE POLICY "reporte_materiales_tech_delete"
  ON public.reporte_materiales FOR DELETE
  TO authenticated
  USING (
    reporte_id IN (
      SELECT r.id FROM public.reportes r
      WHERE r.folio_id IN (SELECT private.get_my_folio_ids())
    )
  );
