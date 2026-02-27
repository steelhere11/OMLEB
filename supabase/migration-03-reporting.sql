-- ============================================================================
-- OMLEB HVAC -- Migration 03: Reporting Enhancements
-- ============================================================================
-- Run this file AFTER schema.sql and rls.sql in Supabase SQL Editor.
--
-- This migration applies three fixes identified during Phase 3 research:
-- 1. Unique constraint on reportes(folio_id, fecha) to prevent duplicate daily reports
-- 2. Fix folio_asignados RLS to let technicians see ALL team members on their folios
-- 3. Enable Supabase Realtime for report-related tables
-- ============================================================================

-- ============================================================================
-- 1. UNIQUE CONSTRAINT: One report per folio per day
-- ============================================================================
-- Prevents duplicate daily reports. Race conditions handled in server actions
-- by catching PostgreSQL error code 23505 (unique_violation).

ALTER TABLE public.reportes
ADD CONSTRAINT unique_folio_fecha UNIQUE (folio_id, fecha);

-- ============================================================================
-- 2. FIX folio_asignados RLS: Let technicians see ALL team members
-- ============================================================================
-- The original policy restricted technicians to only see their own row:
--   USING (usuario_id = (SELECT auth.uid()))
-- This prevents techs from seeing who else is assigned to the same folio.
-- The new policy lets techs see all assignments for folios they are part of.

DROP POLICY IF EXISTS "folio_asignados_tech_select" ON public.folio_asignados;

CREATE POLICY "folio_asignados_tech_select"
  ON public.folio_asignados FOR SELECT
  TO authenticated
  USING (folio_id IN (SELECT private.get_my_folio_ids()));

-- ============================================================================
-- 3. ENABLE SUPABASE REALTIME for report tables
-- ============================================================================
-- Allows real-time subscriptions for collaborative editing (cuadrilla members
-- working on the same report simultaneously).

ALTER PUBLICATION supabase_realtime ADD TABLE public.reportes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reporte_equipos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reporte_materiales;
