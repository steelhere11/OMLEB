-- Migration 06: folio_equipos join table
-- Scopes equipment to folios instead of showing all branch equipment

-- Table: folio_equipos (which equipment is assigned to which folio)
CREATE TABLE public.folio_equipos (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio_id   uuid NOT NULL REFERENCES public.folios(id) ON DELETE CASCADE,
  equipo_id  uuid NOT NULL REFERENCES public.equipos(id) ON DELETE RESTRICT,
  added_by   uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (folio_id, equipo_id)
);

-- Indexes
CREATE INDEX idx_folio_equipos_folio ON public.folio_equipos(folio_id);
CREATE INDEX idx_folio_equipos_equipo ON public.folio_equipos(equipo_id);

-- RLS (same pattern as folio_asignados)
ALTER TABLE public.folio_equipos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "folio_equipos_admin_all"
  ON public.folio_equipos FOR ALL TO authenticated
  USING ((SELECT private.is_admin()));

CREATE POLICY "folio_equipos_tech_select"
  ON public.folio_equipos FOR SELECT TO authenticated
  USING (folio_id IN (SELECT private.get_my_folio_ids()));

CREATE POLICY "folio_equipos_tech_insert"
  ON public.folio_equipos FOR INSERT TO authenticated
  WITH CHECK (folio_id IN (SELECT private.get_my_folio_ids()));

-- Data migration: link equipment from existing reports
INSERT INTO public.folio_equipos (folio_id, equipo_id)
SELECT DISTINCT r.folio_id, re.equipo_id
FROM public.reporte_equipos re
JOIN public.reportes r ON r.id = re.reporte_id
ON CONFLICT (folio_id, equipo_id) DO NOTHING;

-- Realtime for cuadrilla sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.folio_equipos;
