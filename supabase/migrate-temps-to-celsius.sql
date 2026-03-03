-- ============================================================================
-- OMLEB HVAC — Migration: Convert all °F readings to °C
-- ============================================================================
-- Run this in Supabase SQL Editor to update live data.
-- Converts temperature readings in plantillas_pasos and valores_referencia.
-- ============================================================================

-- 1. Update valores_referencia table
UPDATE public.valores_referencia SET unidad = '°C', rango_min = 3, rango_max = 8, notas = 'TXV: 6-8°C. Orificio fijo: tabla del fabricante' WHERE nombre = 'superheat';
UPDATE public.valores_referencia SET unidad = '°C', rango_min = 4, rango_max = 8, notas = 'Indicador primario de carga correcta con TXV' WHERE nombre = 'subcooling';
UPDATE public.valores_referencia SET unidad = '°C', rango_min = 8, rango_max = 12, notas = 'Diferencia retorno vs. suministro' WHERE nombre = 'delta_t_aire';
UPDATE public.valores_referencia SET unidad = '°C', rango_min = 5, rango_max = 7, notas = 'Diferencia entrada vs. salida evaporador' WHERE nombre = 'delta_t_agua';

-- 2. Update plantillas_pasos: mini_split_exterior step 7 (superheat/subcooling)
UPDATE public.plantillas_pasos
SET lecturas_requeridas = '[{"nombre":"Presión succión","unidad":"PSI","rango_min":110,"rango_max":130},{"nombre":"Presión descarga","unidad":"PSI","rango_min":275,"rango_max":400},{"nombre":"Temp. línea succión","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temp. línea líquido","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Superheat calculado","unidad":"°C","rango_min":3,"rango_max":8},{"nombre":"Subcooling calculado","unidad":"°C","rango_min":4,"rango_max":8}]'::jsonb
WHERE tipo_equipo_slug = 'mini_split_exterior' AND orden = 7 AND tipo_mantenimiento = 'preventivo';

-- 3. Update plantillas_pasos: mini_split_exterior step 9 (delta T)
UPDATE public.plantillas_pasos
SET procedimiento = 'Medir temperatura del aire de suministro (salida del evaporador). Medir temperatura del aire de retorno (entrada del evaporador). Calcular diferencial de temperatura (delta T). El delta T debe estar entre 8-12°C para enfriamiento.',
    lecturas_requeridas = '[{"nombre":"Temp. suministro","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temp. retorno","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Delta T","unidad":"°C","rango_min":8,"rango_max":12}]'::jsonb
WHERE tipo_equipo_slug = 'mini_split_exterior' AND orden = 9 AND tipo_mantenimiento = 'preventivo';

-- 4. Update plantillas_pasos: mini_chiller step 4 (water circuit)
UPDATE public.plantillas_pasos
SET procedimiento = 'Verificar temperatura de entrada y salida del agua. El diferencial debe estar entre 5-7°C. Inspeccionar tubería por fugas, corrosión, aislamiento dañado. Verificar presión del agua en el sistema. Verificar operación de la bomba de agua (si es parte del sistema). Verificar flujo de agua.',
    lecturas_requeridas = '[{"nombre":"Temp. entrada agua","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temp. salida agua","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Delta T agua","unidad":"°C","rango_min":5,"rango_max":7},{"nombre":"Presión agua","unidad":"PSI","rango_min":null,"rango_max":null},{"nombre":"Flujo agua","unidad":"GPM","rango_min":null,"rango_max":null}]'::jsonb
WHERE tipo_equipo_slug = 'mini_chiller' AND orden = 4 AND tipo_mantenimiento = 'preventivo';

-- 5. Update plantillas_pasos: mini_chiller step 7 (superheat/subcooling per circuit)
UPDATE public.plantillas_pasos
SET lecturas_requeridas = '[{"nombre":"Presión succión circuito 1","unidad":"PSI","rango_min":110,"rango_max":130},{"nombre":"Presión descarga circuito 1","unidad":"PSI","rango_min":275,"rango_max":400},{"nombre":"Superheat circuito 1","unidad":"°C","rango_min":3,"rango_max":8},{"nombre":"Subcooling circuito 1","unidad":"°C","rango_min":4,"rango_max":8},{"nombre":"Presión succión circuito 2","unidad":"PSI","rango_min":110,"rango_max":130},{"nombre":"Presión descarga circuito 2","unidad":"PSI","rango_min":275,"rango_max":400},{"nombre":"Superheat circuito 2","unidad":"°C","rango_min":3,"rango_max":8},{"nombre":"Subcooling circuito 2","unidad":"°C","rango_min":4,"rango_max":8}]'::jsonb
WHERE tipo_equipo_slug = 'mini_chiller' AND orden = 7 AND tipo_mantenimiento = 'preventivo';

-- 6. Update plantillas_pasos: mini_chiller step 10 (TXV superheat)
UPDATE public.plantillas_pasos
SET lecturas_requeridas = '[{"nombre":"Superheat evaporador","unidad":"°C","rango_min":3,"rango_max":8}]'::jsonb
WHERE tipo_equipo_slug = 'mini_chiller' AND orden = 10 AND tipo_mantenimiento = 'preventivo';

-- 7. Update plantillas_pasos: mini_chiller step 13 (final water temps)
UPDATE public.plantillas_pasos
SET lecturas_requeridas = '[{"nombre":"Presión succión final","unidad":"PSI","rango_min":110,"rango_max":130},{"nombre":"Presión descarga final","unidad":"PSI","rango_min":275,"rango_max":400},{"nombre":"Temp. agua entrada final","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temp. agua salida final","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Amperaje compresor(es) final","unidad":"A","rango_min":null,"rango_max":null}]'::jsonb
WHERE tipo_equipo_slug = 'mini_chiller' AND orden = 13 AND tipo_mantenimiento = 'preventivo';

-- ============================================================================
-- VERIFICATION: Run after to confirm no °F remains
-- ============================================================================
-- SELECT nombre, unidad FROM valores_referencia WHERE unidad LIKE '%F%';
-- Expected: 0 rows
--
-- SELECT tipo_equipo_slug, orden, lecturas_requeridas::text
-- FROM plantillas_pasos
-- WHERE lecturas_requeridas::text LIKE '%°F%';
-- Expected: 0 rows
-- ============================================================================
