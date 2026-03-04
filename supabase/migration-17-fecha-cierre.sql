-- Migration 17: Add fecha_cierre column to reportes
-- Stores the actual completion date (when status first changed to "completado")
-- so that subsequent admin edits don't change the displayed closure date.

ALTER TABLE public.reportes ADD COLUMN IF NOT EXISTS fecha_cierre timestamptz;

-- Backfill existing completed reports: use updated_at as best approximation
UPDATE public.reportes
SET fecha_cierre = updated_at
WHERE estatus = 'completado' AND fecha_cierre IS NULL;
