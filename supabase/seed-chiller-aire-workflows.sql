-- ============================================================================
-- OMLEB HVAC — Seed: Chiller Enfriado por Aire Guided Maintenance Workflow Templates
-- ============================================================================
-- Run this AFTER migration-workflows.sql and migration-20-equipment-taxonomy.sql
-- Seeds 16 preventive steps and 14 corrective issues.
--
-- Data source: ASHRAE 180, manufacturer manuals (Carrier, Daikin/McQuay, Lennox)
-- Equipment type: Chiller Enfriado por Aire
-- NOTE: tipos_equipo slug 'chiller_aire' already exists from migration-20
-- ============================================================================

-- ============================================================================
-- PREVENTIVE: CHILLER AIRE (16 steps)
-- ============================================================================

INSERT INTO public.plantillas_pasos (tipo_equipo_slug, tipo_mantenimiento, orden, nombre, procedimiento, evidencia_requerida, lecturas_requeridas, es_obligatorio) VALUES

('chiller_aire', 'preventivo', 1, 'Seguridad: Desenergizar equipo y Lock-Out/Tag-Out',
 'Apagar el chiller desde el panel de control. Desconectar el interruptor principal. Verificar ausencia de voltaje en terminales con multímetro. Verificar desbalance de voltaje entre fases. Cerrar válvulas de aislamiento de agua. Aplicar Lock-Out/Tag-Out.',
 '[{"etapa":"antes","descripcion":"Foto del panel de control del chiller en operación"},{"etapa":"despues","descripcion":"Foto del interruptor en OFF con etiqueta"}]'::jsonb,
 '[{"nombre":"Voltaje L1-L2","unidad":"V","rango_min":null,"rango_max":null},{"nombre":"Voltaje L2-L3","unidad":"V","rango_min":null,"rango_max":null},{"nombre":"Voltaje L1-L3","unidad":"V","rango_min":null,"rango_max":null},{"nombre":"Desbalance de voltaje","unidad":"%","rango_min":0,"rango_max":2}]'::jsonb,
 true),

('chiller_aire', 'preventivo', 2, 'Inspección visual general',
 'Inspeccionar gabinete, estructura y base por daños o corrosión. Verificar anclaje. Verificar espacio libre alrededor del equipo. Buscar fugas de aceite, agua o refrigerante. Inspeccionar estado de pintura y protección anticorrosiva. Verificar que paneles de acceso estén correctamente fijados.',
 '[{"etapa":"antes","descripcion":"Foto panorámica del chiller"},{"etapa":"antes","descripcion":"Foto de cualquier daño o anomalía"}]'::jsonb,
 '[]'::jsonb,
 true),

('chiller_aire', 'preventivo', 3, 'Inspección y limpieza de serpentines del condensador',
 'Inspeccionar serpentines de condensador por suciedad, hojas, basura, aletas dobladas. Aspirar lado exterior. Aplicar limpiador espumante. Enjuagar con agua a baja presión. Peinar aletas dobladas. Verificar que todos los lados del condensador estén accesibles y limpios.',
 '[{"etapa":"antes","descripcion":"Foto de serpentines sucios"},{"etapa":"despues","descripcion":"Foto de serpentines limpios"}]'::jsonb,
 '[]'::jsonb,
 true),

('chiller_aire', 'preventivo', 4, 'Inspección y limpieza de ventiladores del condensador',
 'Inspeccionar aspas de cada ventilador. Limpiar acumulación de suciedad. Verificar que giren libremente. Medir amperaje de cada motor. Verificar que no haya vibraciones o ruidos anormales. Verificar operación en todas las velocidades si aplica.',
 '[{"etapa":"durante","descripcion":"Foto de lectura de amperaje por ventilador"}]'::jsonb,
 '[{"nombre":"Amperaje ventilador 1","unidad":"A","rango_min":null,"rango_max":null},{"nombre":"Amperaje ventilador 2","unidad":"A","rango_min":null,"rango_max":null},{"nombre":"Amperaje ventilador 3","unidad":"A","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('chiller_aire', 'preventivo', 5, 'Inspección de compresores',
 'Verificar operación de cada compresor. Medir amperaje de operación y comparar con RLA de placa. Verificar temperatura de descarga. Verificar nivel y condición de aceite en mirilla. Verificar operación de calentador de cárter. Inspeccionar por ruidos o vibraciones anormales. Medir resistencia de aislamiento con megóhmetro.',
 '[{"etapa":"durante","descripcion":"Foto de amperaje por compresor"},{"etapa":"durante","descripcion":"Foto de mirilla de aceite"},{"etapa":"durante","descripcion":"Foto de lectura de megóhmetro"}]'::jsonb,
 '[{"nombre":"Amperaje compresor 1","unidad":"A","rango_min":null,"rango_max":null},{"nombre":"Amperaje compresor 2","unidad":"A","rango_min":null,"rango_max":null},{"nombre":"RLA placa comp. 1","unidad":"A","rango_min":null,"rango_max":null},{"nombre":"RLA placa comp. 2","unidad":"A","rango_min":null,"rango_max":null},{"nombre":"Temp. descarga 1","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temp. descarga 2","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Resist. aislamiento 1","unidad":"MΩ","rango_min":1,"rango_max":null},{"nombre":"Resist. aislamiento 2","unidad":"MΩ","rango_min":1,"rango_max":null}]'::jsonb,
 true),

('chiller_aire', 'preventivo', 6, 'Verificación de carga de refrigerante por circuito',
 'Conectar manifold. Medir presiones de succión y descarga por cada circuito de refrigerante. Calcular sobrecalentamiento y subenfriamiento. Comparar con datos del fabricante. Si un circuito muestra valores fuera de rango, investigar causa.',
 '[{"etapa":"durante","descripcion":"Foto de presiones por circuito"}]'::jsonb,
 '[{"nombre":"Presión succión circuito 1","unidad":"PSI","rango_min":null,"rango_max":null},{"nombre":"Presión descarga circuito 1","unidad":"PSI","rango_min":null,"rango_max":null},{"nombre":"SH circuito 1","unidad":"°C","rango_min":5,"rango_max":12},{"nombre":"SC circuito 1","unidad":"°C","rango_min":5,"rango_max":10},{"nombre":"Presión succión circuito 2","unidad":"PSI","rango_min":null,"rango_max":null},{"nombre":"Presión descarga circuito 2","unidad":"PSI","rango_min":null,"rango_max":null},{"nombre":"SH circuito 2","unidad":"°C","rango_min":5,"rango_max":12},{"nombre":"SC circuito 2","unidad":"°C","rango_min":5,"rango_max":10}]'::jsonb,
 true),

('chiller_aire', 'preventivo', 7, 'Detección de fugas de refrigerante',
 'Inspeccionar visualmente por manchas de aceite. Utilizar detector electrónico en todas las conexiones, válvulas, y uniones. Verificar válvulas de servicio. Documentar cualquier fuga encontrada.',
 '[{"etapa":"durante","descripcion":"Foto del detector en uso"},{"etapa":"durante","descripcion":"Foto de fuga si se encuentra"}]'::jsonb,
 '[]'::jsonb,
 true),

('chiller_aire', 'preventivo', 8, 'Inspección del circuito de agua (evaporador/intercambiador)',
 'Verificar flujo de agua a través del evaporador. Medir temperatura de agua de entrada y salida. Calcular delta T de agua (típicamente 5°C). Verificar operación de la bomba de agua integrada (si aplica). Inspeccionar por fugas en conexiones de agua. Verificar presión del circuito de agua. Inspeccionar válvula de alivio.',
 '[{"etapa":"durante","descripcion":"Foto de termómetro en entrada y salida de agua"},{"etapa":"durante","descripcion":"Foto de manómetro de presión de agua"}]'::jsonb,
 '[{"nombre":"Temp. agua entrada","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temp. agua salida","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Delta T agua","unidad":"°C","rango_min":4,"rango_max":7},{"nombre":"Presión circuito agua","unidad":"PSI","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('chiller_aire', 'preventivo', 9, 'Inspección eléctrica completa',
 'Inspeccionar panel eléctrico. Verificar apriete de terminales. Inspeccionar contactores por desgaste o quemaduras. Verificar fusibles. Inspeccionar cableado por daños. Verificar puesta a tierra. Limpiar polvo del interior del panel.',
 '[{"etapa":"durante","descripcion":"Foto del panel eléctrico"},{"etapa":"despues","descripcion":"Foto del panel limpio"}]'::jsonb,
 '[]'::jsonb,
 true),

('chiller_aire', 'preventivo', 10, 'Verificación de válvulas de expansión (TXV/EEV)',
 'Verificar operación de cada válvula de expansión. Medir sobrecalentamiento en la succión de cada circuito. Si es TXV, verificar ajuste del bulbo sensor. Si es EEV, verificar señal del controlador y respuesta del motor paso a paso. Verificar filtro de línea de líquido.',
 '[{"etapa":"durante","descripcion":"Foto de las válvulas de expansión"}]'::jsonb,
 '[]'::jsonb,
 true),

('chiller_aire', 'preventivo', 11, 'Verificación de controles de seguridad',
 'Verificar operación de presostato de alta y baja presión. Verificar protección anti-congelamiento del evaporador. Verificar protección por sobre-corriente. Verificar protección por falta de flujo de agua (flow switch). Verificar sensor de temperatura de descarga. Documentar set points.',
 '[{"etapa":"durante","descripcion":"Foto de presostatos y protecciones"}]'::jsonb,
 '[]'::jsonb,
 true),

('chiller_aire', 'preventivo', 12, 'Limpieza del filtro de agua',
 'Cerrar válvulas de aislamiento de agua. Drenar presión residual. Retirar y limpiar filtro Y (strainer) de la línea de agua. Inspeccionar malla por roturas o acumulación de sedimento. Reinstalar y verificar ausencia de fugas.',
 '[{"etapa":"antes","descripcion":"Foto del filtro sucio"},{"etapa":"despues","descripcion":"Foto del filtro limpio"}]'::jsonb,
 '[]'::jsonb,
 true),

('chiller_aire', 'preventivo', 13, 'Verificación de operación del controlador / BMS',
 'Verificar lecturas del panel de control del chiller. Verificar set points de temperatura de agua. Verificar programación de horarios si aplica. Verificar comunicación con BMS o sistema de automatización si existe. Leer y documentar historial de alarmas y errores. Verificar operación de la pantalla y botones del controlador.',
 '[{"etapa":"durante","descripcion":"Foto del panel de control mostrando lecturas"},{"etapa":"durante","descripcion":"Foto del historial de errores"}]'::jsonb,
 '[{"nombre":"Set point agua","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temp. agua real","unidad":"°C","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('chiller_aire', 'preventivo', 14, 'Verificación del sistema de tratamiento de agua',
 'Verificar nivel de inhibidores de corrosión. Verificar pH del agua del circuito. Verificar conductividad del agua. Agregar químicos de tratamiento si es necesario. Documentar lecturas de calidad de agua.',
 '[{"etapa":"durante","descripcion":"Foto de lectura de pH/conductividad del agua"}]'::jsonb,
 '[{"nombre":"pH del agua","unidad":"pH","rango_min":7.0,"rango_max":9.0},{"nombre":"Conductividad","unidad":"μS/cm","rango_min":null,"rango_max":null}]'::jsonb,
 false),

('chiller_aire', 'preventivo', 15, 'Inspección de aislamiento térmico de tuberías',
 'Inspeccionar aislamiento de tuberías de agua helada por deterioro, humedad, o daño mecánico. Verificar que no haya condensación en tuberías descubiertas. Reparar aislamiento dañado. Verificar protección UV en secciones expuestas a intemperie.',
 '[{"etapa":"antes","descripcion":"Foto de aislamiento mostrando condición"}]'::jsonb,
 '[]'::jsonb,
 true),

('chiller_aire', 'preventivo', 16, 'Prueba de operación completa y cierre',
 'Restaurar energía y abrir válvulas de agua. Arrancar chiller y verificar secuencia de arranque normal. Monitorear presiones de operación en ambos circuitos. Verificar que las temperaturas de agua converjan al set point. Monitorear por 15-20 minutos. Verificar ausencia de alarmas, ruidos o fugas. Cerrar paneles y dejar en operación normal.',
 '[{"etapa":"despues","descripcion":"Foto del panel de control mostrando operación normal"},{"etapa":"despues","descripcion":"Foto de presiones estabilizadas"},{"etapa":"despues","descripcion":"Video del equipo operando"}]'::jsonb,
 '[{"nombre":"Temp. agua salida final","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Presión succión final circ. 1","unidad":"PSI","rango_min":null,"rango_max":null},{"nombre":"Presión descarga final circ. 1","unidad":"PSI","rango_min":null,"rango_max":null}]'::jsonb,
 true);

-- ============================================================================
-- CORRECTIVE: CHILLER AIRE (14 issues)
-- ============================================================================

INSERT INTO public.fallas_correctivas (tipo_equipo_slug, nombre, diagnostico, evidencia_requerida, materiales_tipicos) VALUES

('chiller_aire', 'Falla de compresor',
 'Compresor no arranca, amperaje excesivo, ruidos de golpeteo, disparo de protecciones térmicas. Resistencia de aislamiento baja. Posible falla mecánica interna, devanados quemados, o válvulas dañadas.',
 '[{"etapa":"antes","descripcion":"Foto del compresor con falla"},{"etapa":"durante","descripcion":"Foto de lectura de amperaje y resistencia"},{"etapa":"despues","descripcion":"Foto del compresor nuevo instalado y operando"}]'::jsonb,
 '["Compresor de reemplazo","Aceite refrigerante","Filtro deshidratador","Refrigerante","Kit de soldadura"]'::jsonb),

('chiller_aire', 'Fuga de refrigerante en circuito',
 'Presiones bajas en uno o más circuitos. Capacidad de enfriamiento reducida. Manchas de aceite visibles en conexiones o soldaduras. Alarma de baja presión activada.',
 '[{"etapa":"antes","descripcion":"Foto de la fuga o manchas de aceite"},{"etapa":"durante","descripcion":"Foto de lectura de presiones"},{"etapa":"despues","descripcion":"Foto de la reparación y presiones normales"}]'::jsonb,
 '["Refrigerante","Kit de soldadura","Detector de fugas electrónico","Nitrógeno OFN"]'::jsonb),

('chiller_aire', 'Falla de ventilador del condensador',
 'Motor de ventilador no arranca. Vibraciones o ruidos anormales. Aspas dañadas o desbalanceadas. Amperaje fuera de rango. Sobre-presión en condensador por falta de flujo de aire.',
 '[{"etapa":"antes","descripcion":"Foto/video del ventilador con falla"},{"etapa":"durante","descripcion":"Foto de lectura de amperaje"},{"etapa":"despues","descripcion":"Foto del ventilador reparado o reemplazado"}]'::jsonb,
 '["Motor de ventilador de reemplazo","Aspas de ventilador","Capacitor"]'::jsonb),

('chiller_aire', 'Bajo flujo de agua / Falla de flow switch',
 'Alarma de bajo flujo de agua. Delta T excesivo entre entrada y salida del evaporador. Bomba de agua no opera o flujo insuficiente. Flow switch no cierra o cableado dañado.',
 '[{"etapa":"antes","descripcion":"Foto de la alarma de bajo flujo"},{"etapa":"durante","descripcion":"Foto del flow switch y conexiones"},{"etapa":"despues","descripcion":"Foto de flujo normal restablecido"}]'::jsonb,
 '["Flow switch de reemplazo","Cable eléctrico","Filtro de agua"]'::jsonb),

('chiller_aire', 'Falla de válvula de expansión (TXV/EEV)',
 'Sobrecalentamiento excesivo o nulo en uno o más circuitos. Restricción de flujo de refrigerante. Bulbo sensor suelto o dañado (TXV). Motor paso a paso no responde (EEV). Capacidad reducida.',
 '[{"etapa":"antes","descripcion":"Foto de la válvula de expansión"},{"etapa":"durante","descripcion":"Foto de lectura de sobrecalentamiento"},{"etapa":"despues","descripcion":"Foto de la válvula nueva instalada"}]'::jsonb,
 '["Válvula de expansión de reemplazo (TXV o EEV según modelo)","Filtro de línea de líquido","Kit de soldadura"]'::jsonb),

('chiller_aire', 'Contactor o relay quemado',
 'Compresor o ventilador no energiza al recibir señal de arranque. Contactos del contactor visiblemente quemados, desgastados o soldados. Relay de control no opera o bobina quemada.',
 '[{"etapa":"antes","descripcion":"Foto del contactor o relay dañado"},{"etapa":"despues","descripcion":"Foto del componente nuevo instalado"}]'::jsonb,
 '["Contactor de reemplazo (según amperaje y voltaje)","Relay de reemplazo","Cable eléctrico"]'::jsonb),

('chiller_aire', 'Capacitor dañado',
 'Motor de ventilador o compresor no arranca, zumba pero no gira. Capacitor visiblemente hinchado, con fuga de aceite, o con lecturas de microfaradios fuera de tolerancia (±5%).',
 '[{"etapa":"antes","descripcion":"Foto del capacitor dañado"},{"etapa":"durante","descripcion":"Foto de lectura de microfaradios"},{"etapa":"despues","descripcion":"Foto del capacitor nuevo instalado"}]'::jsonb,
 '["Capacitor de reemplazo (según microfaradios y voltaje)"]'::jsonb),

('chiller_aire', 'Presostato de alta/baja presión disparado',
 'Sistema se apaga por sobre-presión o sub-presión en uno o más circuitos. Causas posibles: serpentín condensador sucio, ventilador defectuoso, sobrecarga/falta de refrigerante, restricción, o falla de componente.',
 '[{"etapa":"antes","descripcion":"Foto de lectura de presiones"},{"etapa":"antes","descripcion":"Foto de la condición del equipo"},{"etapa":"despues","descripcion":"Foto de presiones normales después de reparación"}]'::jsonb,
 '["Según diagnóstico específico"]'::jsonb),

('chiller_aire', 'Fuga de agua en conexiones o intercambiador',
 'Charco de agua debajo del chiller. Presión del circuito de agua disminuyendo. Fuga visible en bridas, conexiones victaulic, o empaques del evaporador. Posible corrosión en tubería.',
 '[{"etapa":"antes","descripcion":"Foto de la fuga de agua visible"},{"etapa":"antes","descripcion":"Foto de la conexión o componente dañado"},{"etapa":"despues","descripcion":"Foto de la reparación completada sin fuga"}]'::jsonb,
 '["Empaques y sellos","Tornillería para bridas","Conexiones victaulic","Sellador de rosca"]'::jsonb),

('chiller_aire', 'Falla de tarjeta de control / Controlador',
 'Pantalla del controlador sin datos o apagada. Error persistente no resuelto por reset. Controlador no responde a comandos. Comunicación perdida con BMS. Componentes visiblemente dañados en la tarjeta.',
 '[{"etapa":"antes","descripcion":"Foto de la pantalla con error o apagada"},{"etapa":"antes","descripcion":"Foto de la tarjeta de control"},{"etapa":"despues","descripcion":"Foto del controlador operando normalmente"}]'::jsonb,
 '["Tarjeta de control de reemplazo (según modelo)","Controlador de reemplazo (si aplica)"]'::jsonb),

('chiller_aire', 'Serpentín condensador dañado / Aletas severamente aplastadas',
 'Restricción de flujo de aire severa por aletas aplastadas en más del 30% de la superficie. Sobre-presión de descarga. Posible daño por impacto, granizo, o vandalismo. Corrosión severa del serpentín.',
 '[{"etapa":"antes","descripcion":"Foto del serpentín dañado mostrando extensión del daño"},{"etapa":"despues","descripcion":"Foto del serpentín reparado o reemplazado"}]'::jsonb,
 '["Serpentín de reemplazo (si el daño es irreparable)","Peine de aletas","Limpiador de serpentín"]'::jsonb),

('chiller_aire', 'Desbalance de fases / Problema de voltaje',
 'Compresores no arrancan o se apagan intermitentemente. Protección de voltaje activada. Desbalance entre fases mayor al 2%. Voltaje fuera de rango operativo.',
 '[{"etapa":"antes","descripcion":"Foto de lecturas de voltaje entre fases"},{"etapa":"despues","descripcion":"Foto de voltaje corregido"}]'::jsonb,
 '["Protector de voltaje","Corrección en acometida eléctrica"]'::jsonb),

('chiller_aire', 'Congelamiento del evaporador',
 'Protección anti-freeze activada. Temperatura de agua de salida por debajo de 3°C. Posible bajo flujo de agua, baja carga de refrigerante, falla de válvula de expansión, o set point demasiado bajo.',
 '[{"etapa":"antes","descripcion":"Foto de la alarma de anti-freeze"},{"etapa":"durante","descripcion":"Foto de lectura de temperatura de agua"},{"etapa":"despues","descripcion":"Foto de temperaturas normales después de corrección"}]'::jsonb,
 '["Según diagnóstico específico","Glicol (si se requiere protección anticongelante)"]'::jsonb),

('chiller_aire', 'Falla de intercambiador de calor',
 'Fuga interna entre circuito de agua y refrigerante. Contaminación cruzada (burbujas de refrigerante en agua o agua en circuito de refrigerante). Presión anormal del circuito de agua. Requiere prueba de estanqueidad del intercambiador.',
 '[{"etapa":"antes","descripcion":"Foto de evidencia de contaminación cruzada"},{"etapa":"durante","descripcion":"Foto de prueba de estanqueidad del intercambiador"},{"etapa":"despues","descripcion":"Foto del intercambiador nuevo o reparado"}]'::jsonb,
 '["Intercambiador de calor de reemplazo","Refrigerante","Kit de soldadura","Nitrógeno"]'::jsonb);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- SELECT tipo_equipo_slug, tipo_mantenimiento, count(*) FROM plantillas_pasos WHERE tipo_equipo_slug = 'chiller_aire' GROUP BY 1, 2;
-- Expected: chiller_aire/preventivo: 16
--
-- SELECT tipo_equipo_slug, count(*) FROM fallas_correctivas WHERE tipo_equipo_slug = 'chiller_aire' GROUP BY 1;
-- Expected: chiller_aire: 14
-- ============================================================================
