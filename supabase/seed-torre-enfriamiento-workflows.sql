-- ============================================================================
-- OMLEB HVAC — Seed: Torre de Enfriamiento Guided Maintenance Workflow Templates
-- ============================================================================
-- Run this AFTER migration-workflows.sql and migration-20-equipment-taxonomy.sql
-- Seeds 10 preventive steps and 8 corrective issues.
--
-- Data source: ASHRAE 180, CTI (Cooling Technology Institute) guidelines,
-- manufacturer manuals (Marley/SPX, BAC, Evapco)
-- Equipment type: Torre de Enfriamiento (Cooling Tower)
-- NOTE: tipos_equipo slug 'torre_enfriamiento' already exists from migration-20
-- ============================================================================

-- ============================================================================
-- PREVENTIVE: TORRE DE ENFRIAMIENTO (10 steps)
-- ============================================================================

INSERT INTO public.plantillas_pasos (tipo_equipo_slug, tipo_mantenimiento, orden, nombre, procedimiento, evidencia_requerida, lecturas_requeridas, es_obligatorio) VALUES

('torre_enfriamiento', 'preventivo', 1, 'Seguridad: Desenergizar y Lock-Out/Tag-Out',
 'Apagar ventilador(es) de la torre desde el tablero de control. Desconectar interruptor principal. Verificar ausencia de voltaje en terminales del motor con multímetro. Cerrar válvulas de aislamiento de agua de entrada y salida. Esperar a que el ventilador se detenga completamente. Aplicar Lock-Out/Tag-Out. PRECAUCIÓN: Usar equipo de protección personal para trabajo en altura si la torre está elevada.',
 '[{"etapa":"antes","descripcion":"Foto de la torre en operación"},{"etapa":"despues","descripcion":"Foto del interruptor en OFF con etiqueta de seguridad"}]'::jsonb,
 '[{"nombre":"Voltaje en terminales","unidad":"V","rango_min":0,"rango_max":0}]'::jsonb,
 true),

('torre_enfriamiento', 'preventivo', 2, 'Inspección visual general',
 'Inspeccionar estructura de la torre (acero galvanizado, fibra de vidrio, o concreto) por daños, corrosión, o deterioro. Verificar paneles laterales y louvers de entrada de aire. Verificar estado del eliminador de gotas (drift eliminator). Inspeccionar accesos y escaleras. Buscar signos de fugas de agua, crecimiento de algas, o depósitos minerales en el exterior.',
 '[{"etapa":"antes","descripcion":"Foto panorámica de la torre"},{"etapa":"antes","descripcion":"Foto de cualquier daño, corrosión o deterioro estructural"},{"etapa":"antes","descripcion":"Foto de louvers de entrada de aire"}]'::jsonb,
 '[]'::jsonb,
 true),

('torre_enfriamiento', 'preventivo', 3, 'Inspección y limpieza de relleno (fill media)',
 'Inspeccionar relleno de la torre por obstrucción, depósitos minerales, algas, o deterioro. Verificar que no haya secciones colapsadas o desplazadas. Limpiar con agua a presión moderada si hay acumulación de sedimento o algas. Verificar que la distribución de agua sobre el relleno sea uniforme. Reemplazar secciones de relleno dañadas o deterioradas.',
 '[{"etapa":"antes","descripcion":"Foto del relleno mostrando condición"},{"etapa":"durante","descripcion":"Foto del proceso de limpieza"},{"etapa":"despues","descripcion":"Foto del relleno limpio"}]'::jsonb,
 '[]'::jsonb,
 true),

('torre_enfriamiento', 'preventivo', 4, 'Inspección de ventilador y motor',
 'Inspeccionar aspas del ventilador por daños, grietas, desbalance, o acumulación de depósitos. Verificar ángulo de las aspas. Verificar que el ventilador gire libremente sin roces. Inspeccionar motor por ruidos o vibraciones anormales. Medir amperaje del motor y comparar con datos de placa. Verificar rodamientos del motor. Si tiene reductor de velocidad (gearbox), verificar nivel de aceite y condición.',
 '[{"etapa":"antes","descripcion":"Foto del ventilador mostrando condición de aspas"},{"etapa":"durante","descripcion":"Foto de lectura de amperaje del motor"},{"etapa":"durante","descripcion":"Foto de nivel de aceite del reductor (si aplica)"}]'::jsonb,
 '[{"nombre":"Amperaje motor ventilador","unidad":"A","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('torre_enfriamiento', 'preventivo', 5, 'Verificación de bandas y poleas (si belt-driven)',
 'Inspeccionar bandas por grietas, deshilachado, desgaste o elongación. Verificar tensión de la banda. Verificar alineación de poleas. Inspeccionar poleas por desgaste. Reemplazar bandas si están dañadas. Si la torre usa transmisión directa o reductor de velocidad, verificar alineación y estado del acoplamiento.',
 '[{"etapa":"antes","descripcion":"Foto de bandas y poleas mostrando condición"},{"etapa":"despues","descripcion":"Foto de bandas nuevas instaladas (si se reemplazaron)"}]'::jsonb,
 '[]'::jsonb,
 true),

('torre_enfriamiento', 'preventivo', 6, 'Inspección de sistema de distribución de agua',
 'Inspeccionar boquillas de distribución (spray nozzles) por obstrucción o daño. Verificar que todas las boquillas rocíen uniformemente. Limpiar boquillas obstruidas. Verificar operación del flotador y válvula de reposición de agua (make-up). Verificar nivel de agua en la cuenca — debe estar al nivel correcto del rebosadero. Verificar operación de la válvula de purga (blowdown).',
 '[{"etapa":"durante","descripcion":"Foto de boquillas de distribución rociando"},{"etapa":"durante","descripcion":"Foto del flotador y válvula de reposición"},{"etapa":"durante","descripcion":"Foto del nivel de agua en la cuenca"}]'::jsonb,
 '[]'::jsonb,
 true),

('torre_enfriamiento', 'preventivo', 7, 'Limpieza de cuenca y filtros de succión',
 'Drenar cuenca de la torre si es posible. Remover sedimento, lodo, hojas, y escombros acumulados. Limpiar paredes de la cuenca. Inspeccionar por corrosión o daño estructural en la cuenca. Limpiar filtro de succión (strainer) de la línea de agua. Verificar estado de la válvula de drenaje. Rellenar cuenca con agua fresca.',
 '[{"etapa":"antes","descripcion":"Foto de la cuenca mostrando acumulación de sedimento"},{"etapa":"durante","descripcion":"Foto del proceso de limpieza"},{"etapa":"despues","descripcion":"Foto de la cuenca limpia"},{"etapa":"despues","descripcion":"Foto del filtro de succión limpio"}]'::jsonb,
 '[]'::jsonb,
 true),

('torre_enfriamiento', 'preventivo', 8, 'Verificación de tratamiento químico de agua',
 'Verificar operación del sistema de tratamiento de agua (bomba dosificadora, controlador automático, tanque de químicos). Verificar nivel de biocida — esencial para control de legionella. Verificar nivel de anti-incrustante. Verificar nivel de inhibidor de corrosión. Medir pH del agua (rango 7.0-9.0). Medir conductividad. Verificar ciclos de concentración. Verificar programación del sistema de purga (blowdown).',
 '[{"etapa":"durante","descripcion":"Foto del sistema de tratamiento químico"},{"etapa":"durante","descripcion":"Foto de lectura de pH del agua"},{"etapa":"durante","descripcion":"Foto de lectura de conductividad"}]'::jsonb,
 '[{"nombre":"pH del agua","unidad":"pH","rango_min":7.0,"rango_max":9.0},{"nombre":"Conductividad","unidad":"μS/cm","rango_min":null,"rango_max":null},{"nombre":"Ciclos de concentración","unidad":"texto","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('torre_enfriamiento', 'preventivo', 9, 'Medición de temperaturas de agua',
 'Energizar torre y bomba de agua de condensador para mediciones. Medir temperatura de agua de entrada a la torre (agua caliente del condensador). Medir temperatura de agua de salida de la torre (agua fría hacia el condensador). Calcular rango de la torre (diferencia entre entrada y salida). Medir temperatura de bulbo húmedo del ambiente. Calcular approach (diferencia entre temperatura de salida y bulbo húmedo). Un approach menor a 5°C indica buen rendimiento.',
 '[{"etapa":"durante","descripcion":"Foto de lectura de temperatura de agua de entrada a la torre"},{"etapa":"durante","descripcion":"Foto de lectura de temperatura de agua de salida"},{"etapa":"durante","descripcion":"Foto de lectura de temperatura de bulbo húmedo"}]'::jsonb,
 '[{"nombre":"Temp. agua entrada (caliente)","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temp. agua salida (fría)","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Rango de la torre","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temp. bulbo húmedo","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Approach","unidad":"°C","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('torre_enfriamiento', 'preventivo', 10, 'Prueba de operación completa y verificación de vibración',
 'Con la torre en operación, verificar que todos los ventiladores operen sin vibraciones excesivas ni ruidos anormales. Verificar que la distribución de agua sea uniforme sobre el relleno. Verificar que el eliminador de gotas retenga el arrastre de agua adecuadamente. Verificar que la válvula de reposición mantenga el nivel correcto. Verificar operación de la purga automática. Monitorear por 15 minutos. Documentar lecturas finales.',
 '[{"etapa":"despues","descripcion":"Foto de la torre en operación normal"},{"etapa":"despues","descripcion":"Foto de distribución uniforme de agua sobre el relleno"},{"etapa":"despues","descripcion":"Video de la torre operando (10-15 seg)"}]'::jsonb,
 '[]'::jsonb,
 true);

-- ============================================================================
-- CORRECTIVE: TORRE DE ENFRIAMIENTO (8 issues)
-- ============================================================================

INSERT INTO public.fallas_correctivas (tipo_equipo_slug, nombre, diagnostico, evidencia_requerida, materiales_tipicos) VALUES

('torre_enfriamiento', 'Motor de ventilador no arranca',
 'Motor del ventilador de la torre no arranca o se dispara al arrancar. Sin flujo de aire a través de la torre. Temperatura de agua de salida elevada. Posible motor quemado, contactor dañado, protección térmica disparada, o falla del VFD.',
 '[{"etapa":"antes","descripcion":"Foto del motor que no opera"},{"etapa":"durante","descripcion":"Foto de lectura de amperaje o resistencia del motor"},{"etapa":"despues","descripcion":"Foto del motor reparado o reemplazado operando"}]'::jsonb,
 '["Motor de ventilador de reemplazo","Contactor","Protección térmica","Rodamientos"]'::jsonb),

('torre_enfriamiento', 'Relleno dañado o deteriorado',
 'Secciones de relleno (fill media) colapsadas, rotas, desplazadas, o severamente obstruidas. Distribución de agua no uniforme. Eficiencia de la torre reducida — approach elevado. Deterioro por UV, exposición química, o temperatura excesiva.',
 '[{"etapa":"antes","descripcion":"Foto del relleno dañado o deteriorado"},{"etapa":"despues","descripcion":"Foto del relleno nuevo instalado"}]'::jsonb,
 '["Relleno de reemplazo (según tipo y dimensiones de la torre)","Soportes de relleno"]'::jsonb),

('torre_enfriamiento', 'Boquillas obstruidas — distribución desigual',
 'Boquillas de distribución de agua (spray nozzles) parcial o totalmente obstruidas por depósitos minerales, sedimento, o biofilm. Distribución de agua no uniforme sobre el relleno — zonas secas visibles. Eficiencia de enfriamiento reducida.',
 '[{"etapa":"antes","descripcion":"Foto de boquillas obstruidas"},{"etapa":"antes","descripcion":"Foto mostrando distribución desigual de agua"},{"etapa":"despues","descripcion":"Foto de boquillas limpias o reemplazadas con distribución uniforme"}]'::jsonb,
 '["Boquillas de reemplazo (según modelo y tamaño)","Solución de limpieza de depósitos minerales"]'::jsonb),

('torre_enfriamiento', 'Fuga en cuenca o estructura',
 'Fuga de agua visible en la cuenca, paredes, o uniones estructurales de la torre. Nivel de agua bajando constantemente. Charcos de agua alrededor de la base. Posible corrosión, grietas en fibra de vidrio, o sellos deteriorados.',
 '[{"etapa":"antes","descripcion":"Foto de la fuga de agua visible"},{"etapa":"antes","descripcion":"Foto del área dañada (corrosión, grieta)"},{"etapa":"despues","descripcion":"Foto de la reparación completada sin fuga"}]'::jsonb,
 '["Sellador epóxico para cuenca","Parche de fibra de vidrio (si FRP)","Soldadura (si es acero)","Empaques de reemplazo"]'::jsonb),

('torre_enfriamiento', 'Válvula de flotador defectuosa — sobre-llenado o bajo nivel',
 'Válvula de reposición de agua (make-up) no cierra — sobre-llenado y desperdicio de agua por rebosadero. O no abre — nivel de agua baja, riesgo de cavitación en bomba. Flotador dañado, vástago trabado, o asiento de la válvula desgastado.',
 '[{"etapa":"antes","descripcion":"Foto de la válvula de flotador mostrando problema"},{"etapa":"antes","descripcion":"Foto del nivel de agua incorrecto"},{"etapa":"despues","descripcion":"Foto de la válvula reparada o reemplazada con nivel correcto"}]'::jsonb,
 '["Válvula de flotador de reemplazo","Flotador de reemplazo","Empaques"]'::jsonb),

('torre_enfriamiento', 'Vibración excesiva / Rodamientos desgastados',
 'Vibración excesiva en la torre transmitida a la estructura. Ruido de traqueteo o rechinido del ventilador o motor. Rodamientos del motor con temperatura elevada. Reductor de velocidad (gearbox) con ruidos anormales o vibración. Aspas del ventilador desbalanceadas. Posible base o estructura debilitada.',
 '[{"etapa":"antes","descripcion":"Video mostrando la vibración excesiva"},{"etapa":"durante","descripcion":"Foto de rodamientos o componente dañado identificado"},{"etapa":"despues","descripcion":"Video de la torre operando sin vibración"}]'::jsonb,
 '["Rodamientos de reemplazo","Aceite para reductor de velocidad","Tornillería","Bases antivibratorias","Aspas de ventilador (si dañadas)"]'::jsonb),

('torre_enfriamiento', 'Contaminación biológica (algas, legionella)',
 'Crecimiento visible de algas (color verde) en cuenca, relleno, o paredes de la torre. Biofilm en superficies internas. Olor desagradable. Riesgo de legionella — requiere acción inmediata de desinfección. Tratamiento de agua insuficiente o inactivo. pH y biocida fuera de rango.',
 '[{"etapa":"antes","descripcion":"Foto de crecimiento de algas o biofilm visible"},{"etapa":"durante","descripcion":"Foto del proceso de desinfección"},{"etapa":"durante","descripcion":"Foto de lectura de pH y concentración de biocida"},{"etapa":"despues","descripcion":"Foto de la torre limpia después del tratamiento"}]'::jsonb,
 '["Biocida de choque (shock treatment)","Inhibidor de corrosión","Anti-incrustante","Equipo de protección personal","Limpiador de cuenca"]'::jsonb),

('torre_enfriamiento', 'Corrosión severa en estructura o cuenca',
 'Corrosión avanzada en estructura de acero galvanizado, soportes, tornillería, o cuenca. Debilitamiento estructural visible. Perforaciones o adelgazamiento de material. Puede causar fugas, falla estructural, o colapso parcial.',
 '[{"etapa":"antes","descripcion":"Foto de la corrosión severa mostrando extensión"},{"etapa":"durante","descripcion":"Foto del proceso de reparación o reemplazo de secciones"},{"etapa":"despues","descripcion":"Foto de la estructura reparada con protección anticorrosiva"}]'::jsonb,
 '["Secciones estructurales de reemplazo","Pintura anticorrosiva","Soldadura (si es acero)","Tornillería de acero inoxidable","Recubrimiento epóxico"]'::jsonb);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- SELECT tipo_equipo_slug, tipo_mantenimiento, count(*) FROM plantillas_pasos WHERE tipo_equipo_slug = 'torre_enfriamiento' GROUP BY 1, 2;
-- Expected: torre_enfriamiento/preventivo: 10
--
-- SELECT tipo_equipo_slug, count(*) FROM fallas_correctivas WHERE tipo_equipo_slug = 'torre_enfriamiento' GROUP BY 1;
-- Expected: torre_enfriamiento: 8
-- ============================================================================
