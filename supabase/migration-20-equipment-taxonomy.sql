-- ============================================================================
-- Migration 20: Equipment Taxonomy Expansion
-- Adds categoria to tipos_equipo, inserts 13 new equipment types,
-- adds forma_factor to equipos
-- ============================================================================

-- 1. Add categoria column to tipos_equipo
ALTER TABLE tipos_equipo ADD COLUMN IF NOT EXISTS categoria text;

-- 2. Update existing types with their categories
UPDATE tipos_equipo SET categoria = 'DX — Interior' WHERE slug = 'mini_split_interior';
UPDATE tipos_equipo SET categoria = 'DX — Exterior' WHERE slug = 'mini_split_exterior';
UPDATE tipos_equipo SET categoria = 'Agua Helada — Interior' WHERE slug = 'fan_coil';
UPDATE tipos_equipo SET categoria = 'Agua Helada — Generacion' WHERE slug = 'mini_chiller';
-- "otro" stays NULL category

-- 3. Insert 13 new equipment types
INSERT INTO tipos_equipo (slug, nombre, is_system, categoria) VALUES
  -- DX — Interior
  ('multi_split_interior', 'Multi Split (Interior)', true, 'DX — Interior'),
  ('vrf_interior', 'VRF (Interior)', true, 'DX — Interior'),
  -- DX — Exterior
  ('vrf_exterior', 'VRF (Exterior)', true, 'DX — Exterior'),
  -- Agua Helada — Interior
  ('manejadora_aire', 'Manejadora de Aire (AHU)', true, 'Agua Helada — Interior'),
  -- Agua Helada — Generacion
  ('chiller_aire', 'Chiller Enfriado por Aire', true, 'Agua Helada — Generacion'),
  ('chiller_agua', 'Chiller Enfriado por Agua', true, 'Agua Helada — Generacion'),
  ('bomba_agua_helada', 'Bomba de Agua Helada', true, 'Agua Helada — Generacion'),
  ('torre_enfriamiento', 'Torre de Enfriamiento', true, 'Agua Helada — Generacion'),
  -- Autonomo
  ('paquete_rooftop', 'Paquete / Rooftop', true, 'Autonomo'),
  ('unidad_ventana', 'Unidad de Ventana', true, 'Autonomo'),
  -- Especializado
  ('cortina_aire', 'Cortina de Aire', true, 'Especializado'),
  ('extractor', 'Extractor', true, 'Especializado'),
  ('deshumidificador', 'Deshumidificador', true, 'Especializado')
ON CONFLICT (slug) DO NOTHING;

-- 4. Add forma_factor column to equipos
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS forma_factor text;
