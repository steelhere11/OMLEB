-- ============================================================================
-- OMLEB HVAC — Migration: Guided Maintenance Workflows
-- ============================================================================
-- Run this AFTER schema.sql and rls.sql in Supabase SQL Editor.
-- This adds:
--   1. tipos_equipo (admin-extensible equipment type catalog)
--   2. Migrates equipos.tipo_equipo from free text to FK
--   3. plantillas_pasos (preventive maintenance step templates)
--   4. fallas_correctivas (corrective issue library)
--   5. reporte_pasos (step completion tracking)
--   6. Adds reporte_paso_id to reporte_fotos
--   7. valores_referencia (reference values for reading validation)
--   8. RLS policies for all new tables
-- ============================================================================

-- ============================================================================
-- 1. TIPOS_EQUIPO — Admin-extensible equipment type catalog
-- ============================================================================
-- Admins can add new types. Technicians see these in dropdowns.
-- slug is the machine-readable key used in plantillas_pasos / fallas_correctivas.
-- nombre is the Spanish display name shown to users.
-- is_system = true means it was pre-seeded and cannot be deleted by admins.

CREATE TABLE public.tipos_equipo (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  nombre      text NOT NULL,
  is_system   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.tipos_equipo IS 'Equipment type catalog. Admin-extensible. slug used as FK key throughout workflow tables.';
COMMENT ON COLUMN public.tipos_equipo.slug IS 'Machine key: mini_split_interior, mini_split_exterior, mini_chiller, otro, or admin-created.';
COMMENT ON COLUMN public.tipos_equipo.is_system IS 'System-seeded types cannot be deleted by admin.';

-- Pre-seed the system types
INSERT INTO public.tipos_equipo (slug, nombre, is_system) VALUES
  ('mini_split_interior', 'Mini Split — Unidad Interior', true),
  ('mini_split_exterior', 'Mini Split — Unidad Exterior', true),
  ('mini_chiller',        'Mini Chiller',                  true),
  ('otro',                'Otro',                          true);

-- ============================================================================
-- 2. MIGRATE equipos.tipo_equipo from free text to FK
-- ============================================================================
-- Step A: Add FK column
ALTER TABLE public.equipos
  ADD COLUMN tipo_equipo_id uuid REFERENCES public.tipos_equipo (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.equipos.tipo_equipo_id IS 'FK to tipos_equipo catalog. Replaces free-text tipo_equipo.';

-- Step B: Best-effort migration of existing free-text values
-- Maps common Spanish/English free-text values to the correct slug.
-- Anything unmatched stays NULL (admin can fix later).
UPDATE public.equipos e
SET tipo_equipo_id = te.id
FROM public.tipos_equipo te
WHERE
  (LOWER(TRIM(e.tipo_equipo)) IN ('mini split', 'mini_split', 'minisplit', 'split') AND te.slug = 'mini_split_interior')
  OR (LOWER(TRIM(e.tipo_equipo)) IN ('mini split exterior', 'condensador', 'condensadora', 'unidad exterior') AND te.slug = 'mini_split_exterior')
  OR (LOWER(TRIM(e.tipo_equipo)) IN ('mini chiller', 'mini_chiller', 'minichiller', 'chiller') AND te.slug = 'mini_chiller');

-- Step C: Keep the old column for now (don't drop yet — let app code migrate gradually)
-- When ready, drop with: ALTER TABLE public.equipos DROP COLUMN tipo_equipo;

-- Step D: Index for lookups
CREATE INDEX idx_equipos_tipo_equipo ON public.equipos (tipo_equipo_id);

-- ============================================================================
-- 3. PLANTILLAS_PASOS — Preventive maintenance step templates
-- ============================================================================

CREATE TABLE public.plantillas_pasos (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_equipo_slug      text NOT NULL,
  tipo_mantenimiento    text NOT NULL CHECK (tipo_mantenimiento IN ('preventivo', 'correctivo')),
  orden                 integer NOT NULL,
  nombre                text NOT NULL,
  procedimiento         text NOT NULL,
  evidencia_requerida   jsonb NOT NULL DEFAULT '[]'::jsonb,
  lecturas_requeridas   jsonb NOT NULL DEFAULT '[]'::jsonb,
  es_obligatorio        boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tipo_equipo_slug, tipo_mantenimiento, orden)
);

COMMENT ON TABLE public.plantillas_pasos IS 'Pre-loaded step-by-step templates for preventive maintenance. Loaded per tipo_equipo.';
COMMENT ON COLUMN public.plantillas_pasos.tipo_equipo_slug IS 'Matches tipos_equipo.slug (mini_split_interior, mini_split_exterior, mini_chiller).';
COMMENT ON COLUMN public.plantillas_pasos.evidencia_requerida IS 'JSON array: [{etapa: "antes"|"durante"|"despues", descripcion: "..."}]';
COMMENT ON COLUMN public.plantillas_pasos.lecturas_requeridas IS 'JSON array: [{nombre: "Amperaje compresor", unidad: "A", rango_min: null, rango_max: null}]';

CREATE INDEX idx_plantillas_tipo_orden ON public.plantillas_pasos (tipo_equipo_slug, tipo_mantenimiento, orden);

-- ============================================================================
-- 4. FALLAS_CORRECTIVAS — Corrective issue library
-- ============================================================================

CREATE TABLE public.fallas_correctivas (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_equipo_slug      text NOT NULL,
  nombre                text NOT NULL,
  diagnostico           text NOT NULL,
  evidencia_requerida   jsonb NOT NULL DEFAULT '[]'::jsonb,
  materiales_tipicos    jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at            timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.fallas_correctivas IS 'Pre-loaded corrective issue library. Tech selects issue, app loads evidence and materials.';
COMMENT ON COLUMN public.fallas_correctivas.materiales_tipicos IS 'JSON array of strings: ["Refrigerante R-410A", "Kit de soldadura", ...]';

CREATE INDEX idx_fallas_tipo ON public.fallas_correctivas (tipo_equipo_slug);

-- ============================================================================
-- 5. REPORTE_PASOS — Step completion tracking
-- ============================================================================

CREATE TABLE public.reporte_pasos (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporte_equipo_id   uuid NOT NULL REFERENCES public.reporte_equipos (id) ON DELETE CASCADE,
  plantilla_paso_id   uuid REFERENCES public.plantillas_pasos (id) ON DELETE SET NULL,
  falla_correctiva_id uuid REFERENCES public.fallas_correctivas (id) ON DELETE SET NULL,
  completado          boolean NOT NULL DEFAULT false,
  notas               text,
  lecturas            jsonb DEFAULT '{}'::jsonb,
  completed_at        timestamptz
);

COMMENT ON TABLE public.reporte_pasos IS 'Tracks technician completion of each workflow step or corrective issue within a report-equipment entry.';
COMMENT ON COLUMN public.reporte_pasos.lecturas IS 'JSON object: {amperaje_compresor: 12.5, voltaje_l1l2: 220, ...}';
COMMENT ON COLUMN public.reporte_pasos.plantilla_paso_id IS 'Set for preventive steps. NULL for corrective.';
COMMENT ON COLUMN public.reporte_pasos.falla_correctiva_id IS 'Set for corrective issues. NULL for preventive.';

CREATE INDEX idx_reporte_pasos_equipo ON public.reporte_pasos (reporte_equipo_id);

-- ============================================================================
-- 6. ADD reporte_paso_id to reporte_fotos
-- ============================================================================
-- Ties photos to specific workflow steps. Nullable — existing photos stay unlinked.

ALTER TABLE public.reporte_fotos
  ADD COLUMN reporte_paso_id uuid REFERENCES public.reporte_pasos (id) ON DELETE SET NULL;

-- Add 'durante' to the etiqueta check constraint (currently missing from schema)
-- First drop the old constraint, then recreate with the full set
ALTER TABLE public.reporte_fotos DROP CONSTRAINT IF EXISTS reporte_fotos_etiqueta_check;
ALTER TABLE public.reporte_fotos
  ADD CONSTRAINT reporte_fotos_etiqueta_check
  CHECK (etiqueta IN ('antes', 'durante', 'despues', 'dano', 'placa', 'progreso'));

CREATE INDEX idx_reporte_fotos_paso ON public.reporte_fotos (reporte_paso_id);

-- ============================================================================
-- 7. VALORES_REFERENCIA — Reading validation ranges
-- ============================================================================
-- Used by the app to validate technician readings in real-time.

CREATE TABLE public.valores_referencia (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text NOT NULL UNIQUE,
  unidad      text NOT NULL,
  rango_min   numeric,
  rango_max   numeric,
  notas       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.valores_referencia IS 'Reference values for real-time validation of technician readings.';

INSERT INTO public.valores_referencia (nombre, unidad, rango_min, rango_max, notas) VALUES
  ('voltaje_monofasico',          'V',    187,    253,    '208-230V ±10%'),
  ('voltaje_trifasico_208',       'V',    187,    229,    '208V ±10%'),
  ('voltaje_trifasico_220',       'V',    198,    242,    '220V ±10%'),
  ('voltaje_trifasico_440',       'V',    396,    484,    '440V ±10%'),
  ('desbalance_voltaje',          '%',    0,      2,      'Máximo 2% entre fases'),
  ('capacitor_tolerancia',        '%',    -10,    10,     '±5-10% del valor nominal µF'),
  ('resistencia_aislamiento',     'MΩ',   1,      NULL,   '>1 MΩ. <1 MΩ indica falla'),
  ('presion_succion_r410a',       'PSI',  110,    130,    'Típico enfriamiento. Varía según temp. ambiente'),
  ('presion_descarga_r410a',      'PSI',  275,    400,    'Típico enfriamiento. Varía según temp. ambiente'),
  ('superheat',                   '°F',   5,      15,     'TXV: 10-15°F. Orificio fijo: tabla del fabricante'),
  ('subcooling',                  '°F',   8,      14,     'Indicador primario de carga correcta con TXV'),
  ('delta_t_aire',                '°F',   14,     22,     'Diferencia retorno vs. suministro'),
  ('delta_t_agua',                '°F',   10,     12,     'Diferencia entrada vs. salida evaporador'),
  ('temp_cuerpo_compresor',       '°C',   NULL,   90,     'Temperaturas mayores indican problema'),
  ('temp_descarga',               '°C',   NULL,   100,    'Excesiva = baja carga o restricción');

-- ============================================================================
-- 8. RLS POLICIES
-- ============================================================================

-- tipos_equipo: everyone reads, admin writes
ALTER TABLE public.tipos_equipo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tipos_equipo_select" ON public.tipos_equipo
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "tipos_equipo_insert" ON public.tipos_equipo
  FOR INSERT TO authenticated
  WITH CHECK (private.is_admin());

CREATE POLICY "tipos_equipo_update" ON public.tipos_equipo
  FOR UPDATE TO authenticated
  USING (private.is_admin());

CREATE POLICY "tipos_equipo_delete" ON public.tipos_equipo
  FOR DELETE TO authenticated
  USING (private.is_admin() AND NOT is_system);

-- plantillas_pasos: everyone reads, admin writes
ALTER TABLE public.plantillas_pasos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plantillas_pasos_select" ON public.plantillas_pasos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "plantillas_pasos_admin_all" ON public.plantillas_pasos
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- fallas_correctivas: everyone reads, admin writes
ALTER TABLE public.fallas_correctivas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fallas_correctivas_select" ON public.fallas_correctivas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "fallas_correctivas_admin_all" ON public.fallas_correctivas
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- reporte_pasos: same as reporte_equipos (user can write own, admin can write all)
ALTER TABLE public.reporte_pasos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reporte_pasos_select" ON public.reporte_pasos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "reporte_pasos_insert" ON public.reporte_pasos
  FOR INSERT TO authenticated
  WITH CHECK (
    private.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.reporte_equipos re
      JOIN public.reportes r ON r.id = re.reporte_id
      WHERE re.id = reporte_equipo_id
        AND r.creado_por = auth.uid()
    )
  );

CREATE POLICY "reporte_pasos_update" ON public.reporte_pasos
  FOR UPDATE TO authenticated
  USING (
    private.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.reporte_equipos re
      JOIN public.reportes r ON r.id = re.reporte_id
      WHERE re.id = reporte_equipo_id
        AND r.creado_por = auth.uid()
    )
  );

-- valores_referencia: everyone reads, admin writes
ALTER TABLE public.valores_referencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "valores_referencia_select" ON public.valores_referencia
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "valores_referencia_admin_all" ON public.valores_referencia
  FOR ALL TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- ============================================================================
-- 9. UPDATED_AT TRIGGERS (for tables that need them)
-- ============================================================================
-- tipos_equipo doesn't need updated_at (rarely changes).
-- plantillas_pasos and fallas_correctivas are reference data, no updated_at needed.
-- reporte_pasos uses completed_at instead.

-- ============================================================================
-- DONE. Now run seed-workflows.sql to populate plantillas_pasos and fallas_correctivas.
-- ============================================================================
