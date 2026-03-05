-- ============================================================================
-- OMLEB HVAC — Seed: Manejadora de Aire (AHU) Guided Maintenance Workflow Templates
-- ============================================================================
-- Run this AFTER migration-workflows.sql and migration-20-equipment-taxonomy.sql
-- Seeds 12 preventive steps and 8 corrective issues.
--
-- Data source: ASHRAE 180, manufacturer manuals (Carrier, Trane, York)
-- Equipment type: Manejadora de Aire (Air Handling Unit)
-- NOTE: tipos_equipo slug 'manejadora_aire' already exists from migration-20
-- ============================================================================

-- ============================================================================
-- PREVENTIVE: MANEJADORA DE AIRE (12 steps)
-- ============================================================================

INSERT INTO public.plantillas_pasos (tipo_equipo_slug, tipo_mantenimiento, orden, nombre, procedimiento, evidencia_requerida, lecturas_requeridas, es_obligatorio) VALUES

('manejadora_aire', 'preventivo', 1, 'Seguridad: Desenergizar y Lock-Out/Tag-Out',
 'Apagar la manejadora desde el BMS o tablero de control. Desconectar el interruptor principal. Verificar ausencia de voltaje en terminales con multímetro. Cerrar válvulas de aislamiento de agua helada y agua caliente. Aplicar Lock-Out/Tag-Out.',
 '[{"etapa":"antes","descripcion":"Foto del equipo en operación"},{"etapa":"despues","descripcion":"Foto del interruptor en OFF con etiqueta de seguridad"}]'::jsonb,
 '[{"nombre":"Voltaje en terminales","unidad":"V","rango_min":0,"rango_max":0}]'::jsonb,
 true),

('manejadora_aire', 'preventivo', 2, 'Inspección visual general del gabinete y secciones',
 'Inspeccionar gabinete exterior por daños, corrosión, fugas de aire o agua. Verificar sellos de paneles y puertas de acceso. Inspeccionar aislamiento interno del gabinete por deterioro. Verificar anclaje y base del equipo. Revisar que no haya obstrucciones en plenums de suministro y retorno.',
 '[{"etapa":"antes","descripcion":"Foto panorámica del equipo"},{"etapa":"antes","descripcion":"Foto de cualquier daño, corrosión o sello deteriorado"}]'::jsonb,
 '[]'::jsonb,
 true),

('manejadora_aire', 'preventivo', 3, 'Inspección y reemplazo de filtros de aire',
 'Retirar filtros del banco de filtros. Inspeccionar por acumulación de polvo, humedad, o daño. Verificar rating MERV de los filtros. Reemplazar todos los filtros con el tamaño y rating correcto. Verificar sellos del marco de filtros — no debe haber bypass de aire. Verificar indicador de presión diferencial de filtros si existe.',
 '[{"etapa":"antes","descripcion":"Foto de filtros sucios mostrando acumulación"},{"etapa":"durante","descripcion":"Foto de filtros retirados"},{"etapa":"despues","descripcion":"Foto de filtros nuevos instalados con sellos verificados"}]'::jsonb,
 '[]'::jsonb,
 true),

('manejadora_aire', 'preventivo', 4, 'Inspección y limpieza del serpentín de enfriamiento (agua helada)',
 'Inspeccionar serpentín de enfriamiento por acumulación de polvo, pelusa y suciedad. Verificar paso de luz con linterna. Aspirar con cepillo suave. Aplicar limpiador espumante no ácido si hay acumulación significativa. Enjuagar con agua a baja presión. Peinar aletas dobladas. Medir temperatura de agua de entrada y salida para calcular delta T.',
 '[{"etapa":"antes","descripcion":"Foto del serpentín mostrando condición"},{"etapa":"despues","descripcion":"Foto del serpentín limpio"},{"etapa":"durante","descripcion":"Foto de lectura de temperaturas de agua"}]'::jsonb,
 '[{"nombre":"Temp. agua entrada","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temp. agua salida","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Delta T agua","unidad":"°C","rango_min":4,"rango_max":7}]'::jsonb,
 true),

('manejadora_aire', 'preventivo', 5, 'Inspección del serpentín de calefacción (si aplica)',
 'Inspeccionar serpentín de agua caliente o resistencias eléctricas de calefacción. Si es agua caliente: verificar flujo, temperatura de entrada/salida, y delta T. Si es eléctrico: verificar estado de resistencias, secuenciadores y protecciones. Inspeccionar por signos de sobrecalentamiento o daño.',
 '[{"etapa":"durante","descripcion":"Foto del serpentín de calefacción o resistencias"},{"etapa":"durante","descripcion":"Foto de lecturas de temperatura (si agua caliente)"}]'::jsonb,
 '[]'::jsonb,
 true),

('manejadora_aire', 'preventivo', 6, 'Inspección del ventilador de suministro',
 'Inspeccionar ventilador centrífugo o plenum fan por acumulación de suciedad en aspas/rueda. Limpiar con cepillo y aspiradora. Verificar que gire libremente sin roces ni vibraciones. Medir amperaje del motor y comparar con datos de placa. Verificar rodamientos por ruido o temperatura excesiva.',
 '[{"etapa":"antes","descripcion":"Foto del ventilador mostrando condición"},{"etapa":"despues","descripcion":"Foto del ventilador limpio"},{"etapa":"durante","descripcion":"Foto de lectura de amperaje del motor"}]'::jsonb,
 '[{"nombre":"Amperaje motor ventilador","unidad":"A","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('manejadora_aire', 'preventivo', 7, 'Inspección de bandas, poleas y rodamientos',
 'Inspeccionar bandas por grietas, deshilachado, desgaste o elongación. Verificar tensión de la banda. Verificar alineación de poleas con regla o láser. Inspeccionar poleas por desgaste en ranura. Verificar temperatura y ruido de rodamientos. Lubricar rodamientos según especificación del fabricante. Reemplazar bandas si están dañadas.',
 '[{"etapa":"antes","descripcion":"Foto de bandas y poleas mostrando condición"},{"etapa":"despues","descripcion":"Foto de bandas nuevas instaladas (si se reemplazaron)"}]'::jsonb,
 '[]'::jsonb,
 true),

('manejadora_aire', 'preventivo', 8, 'Inspección de la charola de condensados y línea de drenaje',
 'Inspeccionar charola de condensados por agua estancada, lodo, algas u hongos. Limpiar con solución antibacterial. Colocar tableta bactericida. Verificar que la línea de drenaje no esté obstruida. Soplar con nitrógeno o aire comprimido si es necesario. Verificar trampa de drenaje (p-trap). Inspeccionar por signos de corrosión.',
 '[{"etapa":"antes","descripcion":"Foto de la charola mostrando condición"},{"etapa":"despues","descripcion":"Foto de charola limpia y drenaje verificado"}]'::jsonb,
 '[]'::jsonb,
 true),

('manejadora_aire', 'preventivo', 9, 'Verificación de dampers y actuadores',
 'Verificar operación de dampers de aire exterior, retorno y mixto. Verificar que cada actuador abra y cierre completamente al recibir señal. Verificar ajuste mínimo de aire exterior. Lubricar articulaciones de dampers. Verificar que las aspas sellen correctamente cuando están cerradas. Verificar sensor de temperatura de aire exterior. Inspeccionar actuadores por daño o desgaste.',
 '[{"etapa":"durante","descripcion":"Foto de dampers en posición abierta"},{"etapa":"durante","descripcion":"Foto de dampers en posición cerrada"},{"etapa":"durante","descripcion":"Foto de actuadores"}]'::jsonb,
 '[]'::jsonb,
 true),

('manejadora_aire', 'preventivo', 10, 'Verificación de válvula de control de agua y actuador',
 'Verificar operación de la válvula de control de agua helada (2 o 3 vías). Verificar que el actuador responda proporcionalmente a la señal del controlador. Verificar que la válvula abra y cierre completamente. Inspeccionar por fugas en la válvula y conexiones. Verificar señal de control (0-10V, 4-20mA, o on/off según tipo).',
 '[{"etapa":"durante","descripcion":"Foto de la válvula de control y actuador"},{"etapa":"durante","descripcion":"Foto de la válvula en posición abierta y cerrada"}]'::jsonb,
 '[]'::jsonb,
 true),

('manejadora_aire', 'preventivo', 11, 'Verificación de flujo de aire y temperaturas',
 'Energizar equipo para mediciones. Medir temperatura de aire de suministro. Medir temperatura de aire de retorno. Medir temperatura de aire mixto (después de dampers). Verificar flujo de aire uniforme en salidas principales. Verificar diferencial de presión a través de filtros y serpentines.',
 '[{"etapa":"durante","descripcion":"Foto de lectura de temperatura de suministro"},{"etapa":"durante","descripcion":"Foto de lectura de temperatura de retorno"},{"etapa":"durante","descripcion":"Foto de lectura de temperatura de aire mixto"}]'::jsonb,
 '[{"nombre":"Temp. aire suministro","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temp. aire retorno","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temp. aire mixto","unidad":"°C","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('manejadora_aire', 'preventivo', 12, 'Prueba de operación completa, verificación de BMS, y documentación',
 'Restaurar energía y abrir válvulas de agua. Arrancar equipo y verificar operación normal. Verificar comunicación con BMS o sistema de automatización. Verificar set points y programación de horarios. Verificar secuencia de operación (economizador, enfriamiento, calefacción). Monitorear por 15 minutos. Leer y documentar historial de alarmas. Cerrar paneles.',
 '[{"etapa":"despues","descripcion":"Foto del equipo en operación"},{"etapa":"despues","descripcion":"Foto del BMS o controlador mostrando lecturas normales"},{"etapa":"despues","descripcion":"Video del equipo funcionando (10-15 seg)"}]'::jsonb,
 '[]'::jsonb,
 true);

-- ============================================================================
-- CORRECTIVE: MANEJADORA DE AIRE (8 issues)
-- ============================================================================

INSERT INTO public.fallas_correctivas (tipo_equipo_slug, nombre, diagnostico, evidencia_requerida, materiales_tipicos) VALUES

('manejadora_aire', 'Motor de ventilador quemado',
 'Motor del ventilador de suministro no arranca. Olor a quemado. Amperaje en cero. Rodamientos trabados. Posible falla por sobre-carga, bajo voltaje, falta de lubricación, o desgaste natural. Sin flujo de aire en el sistema de ductos.',
 '[{"etapa":"antes","descripcion":"Foto del motor quemado"},{"etapa":"durante","descripcion":"Foto de lectura de resistencia de devanados"},{"etapa":"despues","descripcion":"Foto del motor nuevo instalado y operando"}]'::jsonb,
 '["Motor de reemplazo (según HP, RPM y frame)","Rodamientos","Bandas nuevas","Capacitor (si aplica)"]'::jsonb),

('manejadora_aire', 'Banda rota / Polea desgastada',
 'Sin flujo de aire. Ventilador no gira aunque el motor opera. Banda visiblemente rota, deshilachada o caída de la polea. Polea con ranura desgastada que no retiene la banda. Ruido de chirrido previo a la ruptura.',
 '[{"etapa":"antes","descripcion":"Foto de la banda rota o polea desgastada"},{"etapa":"despues","descripcion":"Foto de banda nueva y/o polea nueva instalada"}]'::jsonb,
 '["Banda de reemplazo (según número y tamaño)","Polea de reemplazo (si desgastada)"]'::jsonb),

('manejadora_aire', 'Válvula de control de agua no opera',
 'Válvula de agua helada no abre o no cierra. Actuador no responde a señal de control. Equipo no enfría o enfría continuamente sin modulación. Vástago de la válvula trabado o corroído. Fuga por empaques.',
 '[{"etapa":"antes","descripcion":"Foto de la válvula de control que no opera"},{"etapa":"durante","descripcion":"Foto de lectura de señal de control al actuador"},{"etapa":"despues","descripcion":"Foto de la válvula reparada o reemplazada funcionando"}]'::jsonb,
 '["Actuador de reemplazo (según señal y torque)","Válvula de control de reemplazo (según diámetro)","Empaques","Teflón"]'::jsonb),

('manejadora_aire', 'Drenaje obstruido / Charola desbordada',
 'Charola de condensados desbordada. Agua goteando del equipo o en el cuarto de máquinas. Línea de drenaje tapada por lodo, algas o biofilm. Olor a humedad o moho. Posible daño a equipos eléctricos cercanos.',
 '[{"etapa":"antes","descripcion":"Foto de la charola desbordada o fuga de agua"},{"etapa":"durante","descripcion":"Foto del proceso de destape y limpieza"},{"etapa":"despues","descripcion":"Foto del drenaje limpio con flujo libre verificado"}]'::jsonb,
 '["Kit de limpieza de drenaje","Tabletas bactericidas","Nitrógeno o aire comprimido","Solución de cloro/vinagre"]'::jsonb),

('manejadora_aire', 'Damper trabado o actuador defectuoso',
 'Damper de aire exterior, retorno o mixto no se mueve. Actuador no responde a señal de control del BMS. Articulaciones del damper oxidadas o trabadas. Equipo no modula aire exterior o recircula aire incorrectamente.',
 '[{"etapa":"antes","descripcion":"Foto del damper trabado"},{"etapa":"antes","descripcion":"Foto del actuador defectuoso"},{"etapa":"despues","descripcion":"Foto del damper operando correctamente"}]'::jsonb,
 '["Actuador de damper de reemplazo","Lubricante para articulaciones","Articulaciones de reemplazo (si dañadas)"]'::jsonb),

('manejadora_aire', 'Serpentín obstruido / Bajo delta T de agua',
 'Serpentín de enfriamiento severamente obstruido por suciedad. Delta T de agua muy bajo (menor a 3°C), indicando transferencia de calor deficiente. Flujo de aire reducido a través del serpentín. Aletas severamente aplastadas.',
 '[{"etapa":"antes","descripcion":"Foto del serpentín obstruido"},{"etapa":"durante","descripcion":"Foto de lectura de temperaturas de agua (entrada/salida)"},{"etapa":"despues","descripcion":"Foto del serpentín limpio con delta T normalizado"}]'::jsonb,
 '["Limpiador de serpentín espumante","Peine de aletas","Agua para enjuague"]'::jsonb),

('manejadora_aire', 'Vibración excesiva / Rodamientos desgastados',
 'Vibración excesiva en el equipo, transmitida a estructura o ductos. Ruido de rechinido, traqueteo o golpeteo. Rodamientos del motor o del eje del ventilador con temperatura elevada. Ventilador desbalanceado por acumulación de suciedad o daño en aspas.',
 '[{"etapa":"antes","descripcion":"Video mostrando la vibración o ruido anormal"},{"etapa":"durante","descripcion":"Foto de rodamientos desgastados o componente dañado"},{"etapa":"despues","descripcion":"Video del equipo operando sin vibración"}]'::jsonb,
 '["Rodamientos de reemplazo","Bases antivibratorias","Tornillería","Grasa para rodamientos"]'::jsonb),

('manejadora_aire', 'Falla de sensor o controlador',
 'Sensor de temperatura reporta lecturas erráticas o fuera de rango. Controlador local no responde o muestra error. Pérdida de comunicación con BMS. Secuencia de operación incorrecta por lectura errónea de sensores.',
 '[{"etapa":"antes","descripcion":"Foto del sensor o controlador con error"},{"etapa":"durante","descripcion":"Foto de lectura del sensor vs referencia"},{"etapa":"despues","descripcion":"Foto del sensor o controlador nuevo funcionando"}]'::jsonb,
 '["Sensor de temperatura de reemplazo","Controlador de reemplazo (si aplica)","Cable de comunicación"]'::jsonb);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- SELECT tipo_equipo_slug, tipo_mantenimiento, count(*) FROM plantillas_pasos WHERE tipo_equipo_slug = 'manejadora_aire' GROUP BY 1, 2;
-- Expected: manejadora_aire/preventivo: 12
--
-- SELECT tipo_equipo_slug, count(*) FROM fallas_correctivas WHERE tipo_equipo_slug = 'manejadora_aire' GROUP BY 1;
-- Expected: manejadora_aire: 8
-- ============================================================================
