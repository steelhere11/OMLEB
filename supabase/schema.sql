-- ============================================================================
-- OMLEB HVAC -- Database Schema
-- ============================================================================
-- Run this file FIRST in Supabase SQL Editor.
-- Then run rls.sql, then seed.sql.
-- ============================================================================

-- ============================================================================
-- 1. HELPER: updated_at trigger function
-- ============================================================================
-- Auto-updates the updated_at column on any UPDATE operation.

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. SEQUENCE: folio numbering
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS public.folio_numero_seq START WITH 1 INCREMENT BY 1;

-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- --------------------------------------------------------------------------
-- users (synced from auth.users via trigger)
-- --------------------------------------------------------------------------

CREATE TABLE public.users (
  id          uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email       text NOT NULL UNIQUE,
  nombre      text NOT NULL,
  rol         text NOT NULL CHECK (rol IN ('admin', 'tecnico', 'ayudante')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.users IS 'Application users synced from auth.users. Roles: admin, tecnico, ayudante.';

-- --------------------------------------------------------------------------
-- clientes
-- --------------------------------------------------------------------------

CREATE TABLE public.clientes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text NOT NULL,
  logo_url    text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.clientes IS 'Clients (contractors or direct clients) that reports are directed to.';

-- --------------------------------------------------------------------------
-- sucursales
-- --------------------------------------------------------------------------

CREATE TABLE public.sucursales (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text NOT NULL,
  numero      text NOT NULL,
  direccion   text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_sucursales_updated_at
  BEFORE UPDATE ON public.sucursales
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.sucursales IS 'Physical branch locations where HVAC work is performed.';

-- --------------------------------------------------------------------------
-- equipos
-- --------------------------------------------------------------------------

CREATE TABLE public.equipos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sucursal_id      uuid NOT NULL REFERENCES public.sucursales (id) ON DELETE CASCADE,
  numero_etiqueta  text NOT NULL,
  marca            text,
  modelo           text,
  numero_serie     text,
  tipo_equipo      text,
  agregado_por     uuid REFERENCES public.users (id) ON DELETE SET NULL,
  revisado         boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_equipos_updated_at
  BEFORE UPDATE ON public.equipos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.equipos IS 'HVAC equipment at each branch. Technicians can add equipment on-site (revisado=false).';
COMMENT ON COLUMN public.equipos.agregado_por IS 'User who added this equipment. NULL means admin-created.';
COMMENT ON COLUMN public.equipos.revisado IS 'Whether admin has reviewed tech-added equipment.';

-- --------------------------------------------------------------------------
-- folios (work orders)
-- --------------------------------------------------------------------------

CREATE TABLE public.folios (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sucursal_id           uuid NOT NULL REFERENCES public.sucursales (id) ON DELETE RESTRICT,
  cliente_id            uuid NOT NULL REFERENCES public.clientes (id) ON DELETE RESTRICT,
  numero_folio          text NOT NULL UNIQUE,
  descripcion_problema  text NOT NULL,
  estatus               text NOT NULL DEFAULT 'abierto'
                        CHECK (estatus IN ('abierto', 'en_progreso', 'completado', 'en_espera')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_folios_updated_at
  BEFORE UPDATE ON public.folios
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.folios IS 'Work orders (folios). Each folio is assigned to a branch, client, and team.';

-- --------------------------------------------------------------------------
-- Trigger: auto-generate folio number (F-0001, F-0002, ...)
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.generate_folio_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.numero_folio IS NULL OR NEW.numero_folio = '' THEN
    NEW.numero_folio = 'F-' || lpad(nextval('public.folio_numero_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_folio_number
  BEFORE INSERT ON public.folios
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_folio_number();

-- --------------------------------------------------------------------------
-- folio_asignados (team members per folio)
-- --------------------------------------------------------------------------

CREATE TABLE public.folio_asignados (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio_id    uuid NOT NULL REFERENCES public.folios (id) ON DELETE CASCADE,
  usuario_id  uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (folio_id, usuario_id)
);

COMMENT ON TABLE public.folio_asignados IS 'Many-to-many assignment of users (technicians/helpers) to folios.';

-- --------------------------------------------------------------------------
-- reportes (daily reports)
-- --------------------------------------------------------------------------

CREATE TABLE public.reportes (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio_id             uuid NOT NULL REFERENCES public.folios (id) ON DELETE RESTRICT,
  creado_por           uuid NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  sucursal_id          uuid NOT NULL REFERENCES public.sucursales (id) ON DELETE RESTRICT,
  fecha                date NOT NULL DEFAULT CURRENT_DATE,
  estatus              text NOT NULL DEFAULT 'en_progreso'
                       CHECK (estatus IN ('en_progreso', 'en_espera', 'completado')),
  firma_encargado      text,
  finalizado_por_admin boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_reportes_updated_at
  BEFORE UPDATE ON public.reportes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.reportes IS 'Daily reports submitted by technicians for a folio.';
COMMENT ON COLUMN public.reportes.firma_encargado IS 'Digital signature data (base64). Required only when estatus=completado.';
COMMENT ON COLUMN public.reportes.finalizado_por_admin IS 'Whether admin has reviewed and approved this report.';

-- --------------------------------------------------------------------------
-- reporte_equipos (per-equipment details within a report)
-- --------------------------------------------------------------------------

CREATE TABLE public.reporte_equipos (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporte_id        uuid NOT NULL REFERENCES public.reportes (id) ON DELETE CASCADE,
  equipo_id         uuid NOT NULL REFERENCES public.equipos (id) ON DELETE RESTRICT,
  tipo_trabajo      text NOT NULL CHECK (tipo_trabajo IN ('preventivo', 'correctivo')),
  diagnostico       text,
  trabajo_realizado text,
  observaciones     text
);

COMMENT ON TABLE public.reporte_equipos IS 'Equipment-level details within a report: work type, diagnosis, work done.';

-- --------------------------------------------------------------------------
-- reporte_fotos
-- --------------------------------------------------------------------------

CREATE TABLE public.reporte_fotos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporte_id      uuid NOT NULL REFERENCES public.reportes (id) ON DELETE CASCADE,
  equipo_id       uuid REFERENCES public.equipos (id) ON DELETE SET NULL,
  url             text NOT NULL,
  etiqueta        text CHECK (etiqueta IN ('antes', 'despues', 'dano', 'placa', 'progreso')),
  metadata_gps    text,
  metadata_fecha  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.reporte_fotos IS 'Photos attached to reports. Can be per-equipment or general.';
COMMENT ON COLUMN public.reporte_fotos.etiqueta IS 'Photo label: antes, despues, dano, placa, progreso.';
COMMENT ON COLUMN public.reporte_fotos.metadata_gps IS 'GPS coordinates burned into overlay (lat,lng).';

-- --------------------------------------------------------------------------
-- reporte_materiales
-- --------------------------------------------------------------------------

CREATE TABLE public.reporte_materiales (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporte_id  uuid NOT NULL REFERENCES public.reportes (id) ON DELETE CASCADE,
  cantidad    numeric NOT NULL,
  unidad      text NOT NULL,
  descripcion text NOT NULL
);

COMMENT ON TABLE public.reporte_materiales IS 'Materials used, logged per report: quantity, unit, description.';

-- ============================================================================
-- 4. TRIGGER: Sync auth.users to public.users
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, nombre, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', ''),
    COALESCE(NEW.raw_app_meta_data->>'rol', 'tecnico')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 5. INDEXES (performance)
-- ============================================================================

CREATE INDEX idx_equipos_sucursal ON public.equipos (sucursal_id);
CREATE INDEX idx_folios_sucursal ON public.folios (sucursal_id);
CREATE INDEX idx_folios_cliente ON public.folios (cliente_id);
CREATE INDEX idx_folio_asignados_folio ON public.folio_asignados (folio_id);
CREATE INDEX idx_folio_asignados_usuario ON public.folio_asignados (usuario_id);
CREATE INDEX idx_reportes_folio ON public.reportes (folio_id);
CREATE INDEX idx_reportes_creado_por ON public.reportes (creado_por);
CREATE INDEX idx_reportes_fecha ON public.reportes (fecha);
CREATE INDEX idx_reporte_equipos_reporte ON public.reporte_equipos (reporte_id);
CREATE INDEX idx_reporte_fotos_reporte ON public.reporte_fotos (reporte_id);
CREATE INDEX idx_reporte_materiales_reporte ON public.reporte_materiales (reporte_id);
