-- ============================================================================
-- Migration 15: Add "papeleta" to reporte_fotos etiqueta CHECK constraint
-- ============================================================================
-- Run AFTER migration-14-step-ordering.sql
-- Adds "papeleta" etiqueta for contractor form (papeleta) photos.
-- ============================================================================

ALTER TABLE public.reporte_fotos
  DROP CONSTRAINT IF EXISTS reporte_fotos_etiqueta_check;

ALTER TABLE public.reporte_fotos
  ADD CONSTRAINT reporte_fotos_etiqueta_check
  CHECK (etiqueta IN (
    'antes', 'durante', 'despues', 'dano', 'placa', 'progreso',
    'llegada', 'sitio', 'equipo_general', 'anotado', 'papeleta'
  ));

-- ============================================================================
-- DONE. Run this migration in Supabase SQL Editor after migration-14-step-ordering.sql.
-- ============================================================================
