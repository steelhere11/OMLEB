-- ============================================================================
-- Migration 08: Registration flow -- arrival/site/equipment nameplate columns
-- ============================================================================
-- Run AFTER migration-07-video-support.sql
-- This adds:
--   1. Nameplate data columns on equipos (capacidad, refrigerante, voltaje, fase, ubicacion)
--   2. Expanded etiqueta CHECK constraint on reporte_fotos (llegada, sitio, equipo_general)
--   3. Gating booleans on reportes (llegada_completada, sitio_completado)
--   4. Registration tracking on reporte_equipos (registro_completado)
-- ============================================================================

-- ============================================================================
-- 1. NEW COLUMNS ON equipos TABLE — Nameplate data + physical location
-- ============================================================================

ALTER TABLE public.equipos
  ADD COLUMN IF NOT EXISTS capacidad text,
  ADD COLUMN IF NOT EXISTS refrigerante text,
  ADD COLUMN IF NOT EXISTS voltaje text,
  ADD COLUMN IF NOT EXISTS fase text,
  ADD COLUMN IF NOT EXISTS ubicacion text;

COMMENT ON COLUMN public.equipos.capacidad IS 'Capacity: tonnage or BTU (e.g., 5 Ton, 60000 BTU)';
COMMENT ON COLUMN public.equipos.refrigerante IS 'Refrigerant type per ASHRAE 34 (e.g., R-410A, R-22, R-32)';
COMMENT ON COLUMN public.equipos.voltaje IS 'Nameplate voltage (e.g., 220V, 208/230V, 460V)';
COMMENT ON COLUMN public.equipos.fase IS 'Phase: monofasico or trifasico';
COMMENT ON COLUMN public.equipos.ubicacion IS 'Physical location within the branch (e.g., ATM, PATIO, BOVEDA, TREN DE CAJA)';

-- ============================================================================
-- 2. EXPAND reporte_fotos etiqueta CHECK CONSTRAINT
-- ============================================================================
-- Adds llegada (arrival selfie), sitio (site overview), equipo_general (equipment overall photo)
-- to the existing set of etiqueta values.

ALTER TABLE public.reporte_fotos
  DROP CONSTRAINT IF EXISTS reporte_fotos_etiqueta_check;

ALTER TABLE public.reporte_fotos
  ADD CONSTRAINT reporte_fotos_etiqueta_check
  CHECK (etiqueta IN (
    'antes', 'durante', 'despues', 'dano', 'placa', 'progreso',
    'llegada', 'sitio', 'equipo_general'
  ));

-- ============================================================================
-- 3. GATING COLUMNS ON reportes TABLE
-- ============================================================================
-- These booleans gate the report flow: technician must complete arrival and
-- site steps before proceeding to equipment work.

ALTER TABLE public.reportes
  ADD COLUMN IF NOT EXISTS llegada_completada boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sitio_completado boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.reportes.llegada_completada IS 'True once arrival photo is captured for this report';
COMMENT ON COLUMN public.reportes.sitio_completado IS 'True once site overview photo is captured for this folio';

-- ============================================================================
-- 4. REGISTRATION TRACKING ON reporte_equipos TABLE
-- ============================================================================
-- Tracks whether a technician has completed the equipment registration step
-- (overall photo + placa photo + nameplate data filled).

ALTER TABLE public.reporte_equipos
  ADD COLUMN IF NOT EXISTS registro_completado boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.reporte_equipos.registro_completado IS 'True once equipment has overall photo + placa photo + nameplate data filled';

-- ============================================================================
-- DONE. Run this migration in Supabase SQL Editor after migration-07-video-support.sql.
-- ============================================================================
