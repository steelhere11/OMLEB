-- ============================================================================
-- OMLEB HVAC — Seed: Chiller Enfriado por Agua Guided Maintenance Workflow Templates
-- ============================================================================
-- Run this AFTER migration-workflows.sql and migration-20-equipment-taxonomy.sql
-- Seeds 15 preventive steps and 12 corrective issues.
--
-- Data source: ASHRAE 180, manufacturer manuals (Carrier, Trane, York/Johnson Controls)
-- Equipment type: Chiller Enfriado por Agua (Water-Cooled Chiller)
-- NOTE: tipos_equipo slug 'chiller_agua' already exists from migration-20
-- Derived from chiller_aire with condenser coil/fan steps replaced by
-- water-cooled condenser tube inspection, condenser water quality, and pump verification.
-- ============================================================================

-- ============================================================================
-- PREVENTIVE: CHILLER AGUA (15 steps)
-- ============================================================================

INSERT INTO public.plantillas_pasos (tipo_equipo_slug, tipo_mantenimiento, orden, nombre, procedimiento, evidencia_requerida, lecturas_requeridas, es_obligatorio) VALUES

('chiller_agua', 'preventivo', 1, 'Seguridad: Desenergizar equipo y Lock-Out/Tag-Out',
 'Apagar el chiller desde el panel de control. Desconectar el interruptor principal. Verificar ausencia de voltaje en terminales con multímetro. Verificar desbalance de voltaje entre fases. Cerrar válvulas de aislamiento de agua helada y agua de condensador. Aplicar Lock-Out/Tag-Out.',
 '[{"etapa":"antes","descripcion":"Foto del panel de control del chiller en operación"},{"etapa":"despues","descripcion":"Foto del interruptor en OFF con etiqueta de seguridad"}]'::jsonb,
 '[{"nombre":"Voltaje L1-L2","unidad":"V","rango_min":null,"rango_max":null},{"nombre":"Voltaje L2-L3","unidad":"V","rango_min":null,"rango_max":null},{"nombre":"Voltaje L1-L3","unidad":"V","rango_min":null,"rango_max":null},{"nombre":"Desbalance de voltaje","unidad":"%","rango_min":0,"rango_max":2}]'::jsonb,
 true),

('chiller_agua', 'preventivo', 2, 'Inspección visual general',
 'Inspeccionar gabinete, estructura y base por daños o corrosión. Verificar anclaje. Verificar espacio de acceso alrededor del equipo (especialmente lado de tubos del condensador para pull de tubos). Buscar fugas de aceite, agua o refrigerante. Inspeccionar estado de pintura y protección anticorrosiva. Verificar que paneles de acceso estén correctamente fijados.',
 '[{"etapa":"antes","descripcion":"Foto panorámica del chiller"},{"etapa":"antes","descripcion":"Foto de cualquier daño o anomalía"}]'::jsonb,
 '[]'::jsonb,
 true),

('chiller_agua', 'preventivo', 3, 'Inspección de tubos del condensador (casco y tubos)',
 'Drenar el lado de agua del condensador. Retirar tapas del cabezal del condensador. Inspeccionar visualmente los tubos por incrustaciones, corrosión, depósitos minerales o biológicos. Limpiar tubos con cepillos mecánicos (brush cleaning) o sistema de limpieza automática (si existe). Verificar estado de las placas de tubos (tube sheets). Documentar condición de los tubos. Para mantenimiento mayor: realizar prueba de eddy current para verificar espesor de pared de tubos.',
 '[{"etapa":"antes","descripcion":"Foto de los tubos del condensador mostrando condición"},{"etapa":"durante","descripcion":"Foto del proceso de limpieza con cepillos"},{"etapa":"despues","descripcion":"Foto de los tubos limpios"}]'::jsonb,
 '[]'::jsonb,
 true),

('chiller_agua', 'preventivo', 4, 'Inspección de compresores',
 'Verificar operación de cada compresor (scroll, tornillo o centrífugo según modelo). Medir amperaje de operación y comparar con RLA de placa. Verificar temperatura de descarga. Verificar nivel y condición de aceite en mirilla. Verificar operación de calentador de cárter. Inspeccionar por ruidos o vibraciones anormales. Medir resistencia de aislamiento con megóhmetro.',
 '[{"etapa":"durante","descripcion":"Foto de amperaje por compresor"},{"etapa":"durante","descripcion":"Foto de mirilla de aceite"},{"etapa":"durante","descripcion":"Foto de lectura de megóhmetro"}]'::jsonb,
 '[{"nombre":"Amperaje compresor 1","unidad":"A","rango_min":null,"rango_max":null},{"nombre":"Amperaje compresor 2","unidad":"A","rango_min":null,"rango_max":null},{"nombre":"Temp. descarga 1","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temp. descarga 2","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Resist. aislamiento 1","unidad":"MΩ","rango_min":1,"rango_max":null},{"nombre":"Resist. aislamiento 2","unidad":"MΩ","rango_min":1,"rango_max":null}]'::jsonb,
 true),

('chiller_agua', 'preventivo', 5, 'Verificación de carga de refrigerante por circuito',
 'Conectar manifold. Medir presiones de succión y descarga por cada circuito de refrigerante. Calcular sobrecalentamiento y subenfriamiento. Comparar con datos del fabricante para las condiciones actuales (temperaturas de agua de entrada). Si un circuito muestra valores fuera de rango, investigar causa.',
 '[{"etapa":"durante","descripcion":"Foto de presiones por circuito"}]'::jsonb,
 '[{"nombre":"Presión succión circuito 1","unidad":"PSI","rango_min":null,"rango_max":null},{"nombre":"Presión descarga circuito 1","unidad":"PSI","rango_min":null,"rango_max":null},{"nombre":"SH circuito 1","unidad":"°C","rango_min":5,"rango_max":12},{"nombre":"SC circuito 1","unidad":"°C","rango_min":5,"rango_max":10},{"nombre":"Presión succión circuito 2","unidad":"PSI","rango_min":null,"rango_max":null},{"nombre":"Presión descarga circuito 2","unidad":"PSI","rango_min":null,"rango_max":null},{"nombre":"SH circuito 2","unidad":"°C","rango_min":5,"rango_max":12},{"nombre":"SC circuito 2","unidad":"°C","rango_min":5,"rango_max":10}]'::jsonb,
 true),

('chiller_agua', 'preventivo', 6, 'Detección de fugas de refrigerante',
 'Inspeccionar visualmente por manchas de aceite en todas las conexiones, soldaduras y válvulas. Utilizar detector electrónico de fugas. Verificar válvulas de servicio. Documentar cualquier fuga encontrada. En chillers con refrigerante de baja presión (R-123/R-1233zd), verificar sistema de purga de aire.',
 '[{"etapa":"durante","descripcion":"Foto del detector en uso"},{"etapa":"durante","descripcion":"Foto de fuga si se encuentra"}]'::jsonb,
 '[]'::jsonb,
 true),

('chiller_agua', 'preventivo', 7, 'Inspección del circuito de agua helada (evaporador)',
 'Verificar flujo de agua helada a través del evaporador. Medir temperatura de agua de entrada y salida. Calcular delta T de agua (típicamente 5°C). Inspeccionar por fugas en conexiones de agua. Verificar presión del circuito de agua. Inspeccionar válvula de alivio.',
 '[{"etapa":"durante","descripcion":"Foto de termómetro en entrada y salida de agua helada"},{"etapa":"durante","descripcion":"Foto de manómetro de presión"}]'::jsonb,
 '[{"nombre":"Temp. agua helada entrada","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temp. agua helada salida","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Delta T agua helada","unidad":"°C","rango_min":4,"rango_max":7}]'::jsonb,
 true),

('chiller_agua', 'preventivo', 8, 'Verificación de circuito de agua de condensador',
 'Verificar flujo de agua de condensador. Medir temperatura de agua de entrada y salida del condensador. Calcular delta T de agua de condensador. Verificar presión del circuito. Inspeccionar por fugas en conexiones. Verificar operación de la bomba de agua de condensador (flujo y presión adecuados).',
 '[{"etapa":"durante","descripcion":"Foto de lectura de temperatura de agua de condensador (entrada/salida)"},{"etapa":"durante","descripcion":"Foto de manómetros del circuito de condensador"}]'::jsonb,
 '[{"nombre":"Temp. agua condensador entrada","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temp. agua condensador salida","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Delta T agua condensador","unidad":"°C","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('chiller_agua', 'preventivo', 9, 'Verificación de calidad de agua de condensador',
 'Tomar muestra de agua del circuito de condensador. Medir pH (rango aceptable 7.0–9.0). Medir conductividad. Verificar nivel de inhibidores de corrosión. Verificar presencia de biocida. Inspeccionar visualmente color y turbidez del agua. Si hay torre de enfriamiento, verificar que el tratamiento de agua esté activo. Documentar lecturas.',
 '[{"etapa":"durante","descripcion":"Foto de lectura de pH del agua"},{"etapa":"durante","descripcion":"Foto de lectura de conductividad"},{"etapa":"durante","descripcion":"Foto del color del agua de condensador"}]'::jsonb,
 '[{"nombre":"pH agua condensador","unidad":"pH","rango_min":7.0,"rango_max":9.0},{"nombre":"Conductividad","unidad":"μS/cm","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('chiller_agua', 'preventivo', 10, 'Inspección eléctrica completa',
 'Inspeccionar panel eléctrico. Verificar apriete de terminales. Inspeccionar contactores por desgaste o quemaduras. Verificar fusibles. Inspeccionar cableado por daños. Verificar puesta a tierra. Limpiar polvo del interior del panel.',
 '[{"etapa":"durante","descripcion":"Foto del panel eléctrico"},{"etapa":"despues","descripcion":"Foto del panel limpio"}]'::jsonb,
 '[]'::jsonb,
 true),

('chiller_agua', 'preventivo', 11, 'Verificación de válvulas de expansión (TXV/EEV)',
 'Verificar operación de cada válvula de expansión. Medir sobrecalentamiento en la succión de cada circuito. Si es TXV, verificar ajuste del bulbo sensor. Si es EEV, verificar señal del controlador y respuesta del motor paso a paso. Verificar filtro de línea de líquido.',
 '[{"etapa":"durante","descripcion":"Foto de las válvulas de expansión"}]'::jsonb,
 '[]'::jsonb,
 true),

('chiller_agua', 'preventivo', 12, 'Verificación de controles de seguridad',
 'Verificar operación de presostato de alta y baja presión. Verificar protección anti-congelamiento del evaporador. Verificar protección por sobre-corriente. Verificar protección por falta de flujo de agua (flow switch) en ambos circuitos de agua. Verificar sensor de temperatura de descarga. Documentar set points.',
 '[{"etapa":"durante","descripcion":"Foto de presostatos y protecciones"},{"etapa":"durante","descripcion":"Foto de flow switches"}]'::jsonb,
 '[]'::jsonb,
 true),

('chiller_agua', 'preventivo', 13, 'Inspección de válvula de purga y deareador',
 'Verificar operación de la válvula de purga de aire del sistema (si aplica en chillers de baja presión). Verificar que no haya aire acumulado en el sistema de refrigerante. Inspeccionar deareador del circuito de agua (si existe). Verificar operación de la bomba de vacío de purga. Verificar que no haya presencia de no-condensables en el refrigerante.',
 '[{"etapa":"durante","descripcion":"Foto del sistema de purga"},{"etapa":"durante","descripcion":"Foto del indicador de presión de purga"}]'::jsonb,
 '[]'::jsonb,
 false),

('chiller_agua', 'preventivo', 14, 'Verificación de operación del controlador / BMS',
 'Verificar lecturas del panel de control del chiller. Verificar set points de temperatura de agua helada. Verificar programación de horarios si aplica. Verificar comunicación con BMS o sistema de automatización. Leer y documentar historial de alarmas y errores. Verificar operación de la pantalla y botones del controlador.',
 '[{"etapa":"durante","descripcion":"Foto del panel de control mostrando lecturas"},{"etapa":"durante","descripcion":"Foto del historial de errores"}]'::jsonb,
 '[{"nombre":"Set point agua helada","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temp. agua helada real","unidad":"°C","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('chiller_agua', 'preventivo', 15, 'Prueba de operación completa y cierre',
 'Restaurar energía y abrir válvulas de agua (helada y condensador). Verificar que bombas de agua de condensador y agua helada estén operando. Arrancar chiller y verificar secuencia de arranque normal. Monitorear presiones de operación en todos los circuitos. Verificar que las temperaturas de agua converjan al set point. Monitorear por 15-20 minutos. Verificar ausencia de alarmas, ruidos o fugas. Cerrar paneles.',
 '[{"etapa":"despues","descripcion":"Foto del panel de control mostrando operación normal"},{"etapa":"despues","descripcion":"Foto de presiones estabilizadas"},{"etapa":"despues","descripcion":"Video del equipo operando"}]'::jsonb,
 '[{"nombre":"Temp. agua helada salida final","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Presión succión final circ. 1","unidad":"PSI","rango_min":null,"rango_max":null},{"nombre":"Presión descarga final circ. 1","unidad":"PSI","rango_min":null,"rango_max":null}]'::jsonb,
 true);

-- ============================================================================
-- CORRECTIVE: CHILLER AGUA (12 issues)
-- ============================================================================

INSERT INTO public.fallas_correctivas (tipo_equipo_slug, nombre, diagnostico, evidencia_requerida, materiales_tipicos) VALUES

('chiller_agua', 'Falla de compresor',
 'Compresor no arranca, amperaje excesivo, ruidos de golpeteo, disparo de protecciones térmicas. Resistencia de aislamiento baja. Posible falla mecánica interna, devanados quemados, o válvulas dañadas.',
 '[{"etapa":"antes","descripcion":"Foto del compresor con falla"},{"etapa":"durante","descripcion":"Foto de lectura de amperaje y resistencia"},{"etapa":"despues","descripcion":"Foto del compresor nuevo instalado y operando"}]'::jsonb,
 '["Compresor de reemplazo","Aceite refrigerante","Filtro deshidratador","Refrigerante","Kit de soldadura"]'::jsonb),

('chiller_agua', 'Fuga de refrigerante en circuito',
 'Presiones bajas en uno o más circuitos. Capacidad de enfriamiento reducida. Manchas de aceite en conexiones o soldaduras. Alarma de baja presión activada.',
 '[{"etapa":"antes","descripcion":"Foto de la fuga o manchas de aceite"},{"etapa":"durante","descripcion":"Foto de lectura de presiones"},{"etapa":"despues","descripcion":"Foto de la reparación y presiones normales"}]'::jsonb,
 '["Refrigerante","Kit de soldadura","Detector de fugas electrónico","Nitrógeno OFN"]'::jsonb),

('chiller_agua', 'Tubos del condensador obstruidos / Incrustaciones',
 'Presión de descarga elevada. Delta T de agua de condensador reducido. Incrustaciones minerales (calcio, silicatos) o depósitos biológicos en los tubos. Eficiencia del chiller reducida. Consumo de energía incrementado.',
 '[{"etapa":"antes","descripcion":"Foto de los tubos con incrustaciones"},{"etapa":"durante","descripcion":"Foto del proceso de limpieza mecánica o química"},{"etapa":"despues","descripcion":"Foto de los tubos limpios"}]'::jsonb,
 '["Cepillos mecánicos para limpieza de tubos","Solución de limpieza química (si aplica)","Empaques para tapas de cabezal"]'::jsonb),

('chiller_agua', 'Falla de bomba de agua de condensador',
 'Bomba de agua de condensador no arranca o flujo insuficiente. Alarma de bajo flujo en chiller. Presión de descarga elevada por falta de enfriamiento. Flow switch del condensador no cierra.',
 '[{"etapa":"antes","descripcion":"Foto de la bomba que no opera"},{"etapa":"durante","descripcion":"Foto de lectura de amperaje de la bomba"},{"etapa":"despues","descripcion":"Foto de la bomba reparada o reemplazada operando"}]'::jsonb,
 '["Motor de bomba de reemplazo","Sello mecánico","Rodamientos","Impulsor (si desgastado)"]'::jsonb),

('chiller_agua', 'Contaminación de agua de condensador',
 'Agua de condensador con color verde/marrón, turbia o con olor. Presencia de algas, legionella u otros microorganismos. pH fuera de rango. Incrustaciones aceleradas. Riesgo de salud (legionella). Tratamiento de agua insuficiente o inactivo.',
 '[{"etapa":"antes","descripcion":"Foto del color del agua de condensador"},{"etapa":"durante","descripcion":"Foto de lectura de pH y conductividad"},{"etapa":"despues","descripcion":"Foto del agua tratada y clara"}]'::jsonb,
 '["Biocida","Inhibidor de corrosión","Anti-incrustante","Equipo de tratamiento de agua"]'::jsonb),

('chiller_agua', 'Bajo flujo de agua helada / Falla de flow switch',
 'Alarma de bajo flujo de agua helada. Delta T excesivo entre entrada y salida del evaporador. Bomba de agua helada no opera o flujo insuficiente. Flow switch no cierra o cableado dañado.',
 '[{"etapa":"antes","descripcion":"Foto de la alarma de bajo flujo"},{"etapa":"durante","descripcion":"Foto del flow switch y conexiones"},{"etapa":"despues","descripcion":"Foto de flujo normal restablecido"}]'::jsonb,
 '["Flow switch de reemplazo","Cable eléctrico","Filtro de agua"]'::jsonb),

('chiller_agua', 'Falla de válvula de expansión (TXV/EEV)',
 'Sobrecalentamiento excesivo o nulo en uno o más circuitos. Restricción de flujo de refrigerante. Capacidad reducida. Bulbo sensor suelto o dañado (TXV). Motor paso a paso no responde (EEV).',
 '[{"etapa":"antes","descripcion":"Foto de la válvula de expansión"},{"etapa":"durante","descripcion":"Foto de lectura de sobrecalentamiento"},{"etapa":"despues","descripcion":"Foto de la válvula nueva instalada"}]'::jsonb,
 '["Válvula de expansión de reemplazo","Filtro de línea de líquido","Kit de soldadura"]'::jsonb),

('chiller_agua', 'Falla de tarjeta de control / Controlador',
 'Pantalla del controlador sin datos o apagada. Error persistente no resuelto por reset. Controlador no responde a comandos. Comunicación perdida con BMS. Componentes visiblemente dañados.',
 '[{"etapa":"antes","descripcion":"Foto de la pantalla con error o apagada"},{"etapa":"despues","descripcion":"Foto del controlador operando normalmente"}]'::jsonb,
 '["Tarjeta de control de reemplazo (según modelo)","Controlador de reemplazo (si aplica)"]'::jsonb),

('chiller_agua', 'Desbalance de fases / Problema de voltaje',
 'Compresores no arrancan o se apagan intermitentemente. Protección de voltaje activada. Desbalance entre fases mayor al 2%. Voltaje fuera de rango operativo.',
 '[{"etapa":"antes","descripcion":"Foto de lecturas de voltaje entre fases"},{"etapa":"despues","descripcion":"Foto de voltaje corregido"}]'::jsonb,
 '["Protector de voltaje","Corrección en acometida eléctrica"]'::jsonb),

('chiller_agua', 'Congelamiento del evaporador',
 'Protección anti-freeze activada. Temperatura de agua de salida por debajo de 3°C. Posible bajo flujo de agua, baja carga de refrigerante, falla de válvula de expansión, o set point demasiado bajo.',
 '[{"etapa":"antes","descripcion":"Foto de la alarma de anti-freeze"},{"etapa":"durante","descripcion":"Foto de lectura de temperatura de agua"},{"etapa":"despues","descripcion":"Foto de temperaturas normales"}]'::jsonb,
 '["Según diagnóstico específico","Glicol (si se requiere protección anticongelante)"]'::jsonb),

('chiller_agua', 'Fuga interna en tubos del condensador',
 'Contaminación cruzada entre agua de condensador y refrigerante. Presión anormal del circuito de agua o refrigerante. Burbujas de refrigerante en el agua o agua/humedad en el circuito de refrigerante. Requiere prueba de estanqueidad (pressure test) o prueba de tinte en los tubos.',
 '[{"etapa":"antes","descripcion":"Foto de evidencia de contaminación cruzada"},{"etapa":"durante","descripcion":"Foto de prueba de estanqueidad de tubos"},{"etapa":"despues","descripcion":"Foto de tubos taponeados o reemplazados"}]'::jsonb,
 '["Tapones para tubos (tube plugs)","Kit de prueba de presión","Refrigerante","Filtro deshidratador"]'::jsonb),

('chiller_agua', 'Fuga de agua en conexiones',
 'Fuga de agua visible en bridas, conexiones victaulic, válvulas o empaques. Charco de agua debajo del chiller. Presión del circuito de agua disminuyendo. Posible corrosión o deterioro de empaques.',
 '[{"etapa":"antes","descripcion":"Foto de la fuga de agua visible"},{"etapa":"despues","descripcion":"Foto de la reparación completada sin fuga"}]'::jsonb,
 '["Empaques y sellos","Tornillería para bridas","Conexiones victaulic","Sellador de rosca","Teflón"]'::jsonb);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- SELECT tipo_equipo_slug, tipo_mantenimiento, count(*) FROM plantillas_pasos WHERE tipo_equipo_slug = 'chiller_agua' GROUP BY 1, 2;
-- Expected: chiller_agua/preventivo: 15
--
-- SELECT tipo_equipo_slug, count(*) FROM fallas_correctivas WHERE tipo_equipo_slug = 'chiller_agua' GROUP BY 1;
-- Expected: chiller_agua: 12
-- ============================================================================
