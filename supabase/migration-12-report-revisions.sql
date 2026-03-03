-- ============================================================================
-- Migration 12: Report Revision Numbering
-- ============================================================================
-- Adds numero_revision column to reportes table so daily reports for the same
-- orden de servicio are numbered sequentially (Rev 1, Rev 2, Rev 3...).
-- ============================================================================

-- 1. Add numero_revision column (default 1 for new reports)
ALTER TABLE public.reportes
  ADD COLUMN IF NOT EXISTS numero_revision integer NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.reportes.numero_revision IS
  'Sequential revision number within an orden de servicio (Rev 1 = first daily report, Rev 2 = second day, etc.)';

-- 2. Backfill existing reports: number sequentially per orden by date, then creation time
WITH numbered AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY orden_servicio_id
      ORDER BY fecha, created_at
    ) AS rev
  FROM public.reportes
)
UPDATE public.reportes
SET numero_revision = numbered.rev
FROM numbered
WHERE public.reportes.id = numbered.id;
