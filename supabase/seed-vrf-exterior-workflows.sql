-- ============================================================================
-- OMLEB HVAC — Seed: VRF Exterior (Condensadora) Guided Maintenance Workflow Templates
-- ============================================================================
-- Run this AFTER migration-workflows.sql and migration-20-equipment-taxonomy.sql
-- Seeds 14 preventive steps and 14 corrective issues.
--
-- Data source: ASHRAE 180, manufacturer manuals (Daikin, LG Multi V, Mitsubishi City Multi)
-- Equipment type: VRF Condensadora (Exterior)
-- NOTE: tipos_equipo slug 'vrf_exterior' already exists from migration-20
-- ============================================================================

-- ============================================================================
-- PREVENTIVE: VRF EXTERIOR (14 steps)
-- ============================================================================

INSERT INTO public.plantillas_pasos (tipo_equipo_slug, tipo_mantenimiento, orden, nombre, procedimiento, evidencia_requerida, lecturas_requeridas, es_obligatorio) VALUES

('vrf_exterior', 'preventivo', 1, 'Seguridad: Desenergizar equipo y Lock-Out/Tag-Out',
 'Apagar el sistema completo desde el controlador centralizado. Desconectar el breaker principal del módulo exterior. Verificar ausencia de voltaje en terminales principales con multímetro. Verificar desbalance de voltaje entre fases (máximo 2%). Aplicar Lock-Out/Tag-Out.',
 '[{"etapa":"antes","descripcion":"Foto del equipo en operación"},{"etapa":"antes","descripcion":"Foto del breaker en ON"},{"etapa":"despues","descripcion":"Foto del breaker en OFF con etiqueta"},{"etapa":"durante","descripcion":"Foto de lectura de voltaje entre fases"}]'::jsonb,
 '[{"nombre":"Voltaje L1-L2","unidad":"V","rango_min":187,"rango_max":253},{"nombre":"Voltaje L2-L3","unidad":"V","rango_min":187,"rango_max":253},{"nombre":"Voltaje L1-L3","unidad":"V","rango_min":187,"rango_max":253},{"nombre":"Desbalance de voltaje","unidad":"%","rango_min":0,"rango_max":2}]'::jsonb,
 true),

('vrf_exterior', 'preventivo', 2, 'Inspección visual general de la unidad exterior',
 'Inspeccionar gabinete por daños, corrosión, decoloración o vandalismo. Verificar que los paneles estén correctamente fijados. Revisar base y anclaje del equipo. Verificar que no haya obstrucciones alrededor del equipo (mínimo 50cm de espacio libre). Inspeccionar por presencia de objetos extraños, nidos de animales o vegetación. Verificar estado de la pintura y protección anticorrosiva.',
 '[{"etapa":"antes","descripcion":"Foto panorámica del equipo y su entorno"},{"etapa":"antes","descripcion":"Foto de cualquier daño, corrosión u obstrucción"}]'::jsonb,
 '[]'::jsonb,
 true),

('vrf_exterior', 'preventivo', 3, 'Inspección y limpieza de serpentines del condensador',
 'Inspeccionar serpentines por acumulación de polvo, basura, hojas, pelusa o suciedad. Verificar paso de luz con linterna. Aspirar lado exterior. Aplicar limpiador espumante no ácido. Enjuagar con agua a baja presión (NUNCA alta presión — daña aletas). Peinar aletas dobladas. Verificar que no haya daño estructural en el serpentín.',
 '[{"etapa":"antes","descripcion":"Foto del serpentín sucio"},{"etapa":"durante","descripcion":"Foto de la limpieza"},{"etapa":"despues","descripcion":"Foto del serpentín limpio con luz pasando"}]'::jsonb,
 '[]'::jsonb,
 true),

('vrf_exterior', 'preventivo', 4, 'Inspección y limpieza de ventiladores del condensador',
 'Inspeccionar aspas por daños, acumulación de suciedad o desbalance. Limpiar aspas con cepillo suave. Verificar que cada ventilador gire libremente. Verificar motor de ventilador por ruidos o vibraciones anormales. Medir amperaje de cada motor.',
 '[{"etapa":"antes","descripcion":"Foto de ventiladores mostrando condición"},{"etapa":"despues","descripcion":"Foto de ventiladores limpios"},{"etapa":"durante","descripcion":"Foto de lectura de amperaje"}]'::jsonb,
 '[{"nombre":"Amperaje motor ventilador 1","unidad":"A","rango_min":null,"rango_max":null},{"nombre":"Amperaje motor ventilador 2","unidad":"A","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('vrf_exterior', 'preventivo', 5, 'Inspección de compresores inverter',
 'Verificar que los compresores no presenten ruidos anormales (golpeteo, traqueteo, chirrido). Inspeccionar visualmente por fugas de aceite. Medir amperaje de operación de cada compresor y comparar con datos de placa. Verificar temperatura de descarga. Verificar nivel de aceite en mirilla (si disponible). Verificar operación del calentador de cárter.',
 '[{"etapa":"durante","descripcion":"Foto de lectura de amperaje por compresor"},{"etapa":"durante","descripcion":"Foto de mirilla de aceite (si disponible)"},{"etapa":"durante","descripcion":"Foto de temperatura de descarga"}]'::jsonb,
 '[{"nombre":"Amperaje compresor 1","unidad":"A","rango_min":null,"rango_max":null},{"nombre":"Amperaje compresor 2","unidad":"A","rango_min":null,"rango_max":null},{"nombre":"Temp. descarga compresor 1","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temp. descarga compresor 2","unidad":"°C","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('vrf_exterior', 'preventivo', 6, 'Verificación de carga de refrigerante',
 'Conectar manifold de presiones. Medir presión de succión y descarga. Calcular sobrecalentamiento y subenfriamiento. Comparar valores con tablas del fabricante para las condiciones actuales de operación. Documentar lecturas. Si los valores están fuera de rango, investigar causa (fuga, restricción, sobrecarga).',
 '[{"etapa":"durante","descripcion":"Foto de manifold mostrando presiones"},{"etapa":"durante","descripcion":"Foto de las condiciones de operación (temp. ambiente, temp. suministro)"}]'::jsonb,
 '[{"nombre":"Presión succión","unidad":"PSI","rango_min":null,"rango_max":null},{"nombre":"Presión descarga","unidad":"PSI","rango_min":null,"rango_max":null},{"nombre":"Sobrecalentamiento","unidad":"°C","rango_min":5,"rango_max":12},{"nombre":"Subenfriamiento","unidad":"°C","rango_min":5,"rango_max":10}]'::jsonb,
 true),

('vrf_exterior', 'preventivo', 7, 'Detección de fugas de refrigerante',
 'Inspeccionar visualmente todas las conexiones por manchas de aceite. Utilizar detector electrónico de fugas en todas las uniones, válvulas y conexiones flare/soldadas. Si se detecta fuga, marcar ubicación y documentar. Verificar válvulas de servicio por fugas. Verificar uniones de campo (brazed/flare joints).',
 '[{"etapa":"durante","descripcion":"Foto del detector en uso"},{"etapa":"durante","descripcion":"Foto de cualquier fuga encontrada (manchas de aceite, lectura del detector)"}]'::jsonb,
 '[]'::jsonb,
 true),

('vrf_exterior', 'preventivo', 8, 'Inspección de tarjeta inversora (PCB inverter)',
 'Inspeccionar tarjeta inversora por signos de sobrecalentamiento, quemaduras, decoloración o humedad. Verificar que los ventiladores de enfriamiento de la tarjeta funcionen correctamente. Verificar conexiones eléctricas. Verificar que los capacitores no presenten hinchazón o fuga. Leer y documentar errores almacenados en el historial.',
 '[{"etapa":"durante","descripcion":"Foto de la tarjeta inversora"},{"etapa":"durante","descripcion":"Foto de los LEDs indicadores"},{"etapa":"durante","descripcion":"Foto del historial de errores"}]'::jsonb,
 '[]'::jsonb,
 true),

('vrf_exterior', 'preventivo', 9, 'Verificación de comunicación del bus de red',
 'Verificar comunicación entre módulo exterior y todas las unidades interiores conectadas. Confirmar que todas las direcciones de red estén correctamente configuradas. Verificar cableado de comunicación (polaridad, continuidad, blindaje). Utilizar software del fabricante (LGMV, Daikin DCS, Mitsubishi MelAce) para verificar estado del sistema. Documentar cualquier alarma o código de error.',
 '[{"etapa":"durante","descripcion":"Foto de la pantalla del software de diagnóstico mostrando estado del sistema"},{"etapa":"durante","descripcion":"Foto del panel de control mostrando unidades conectadas"}]'::jsonb,
 '[]'::jsonb,
 true),

('vrf_exterior', 'preventivo', 10, 'Inspección eléctrica completa',
 'Inspeccionar contactores, relés y fusibles. Verificar apriete de terminales eléctricas. Medir resistencia de aislamiento de compresores (megóhmetro). Verificar operación de presostatos de alta y baja presión. Verificar calentador de cárter. Inspeccionar cableado por daño, desgaste o roedores.',
 '[{"etapa":"durante","descripcion":"Foto de componentes eléctricos"},{"etapa":"durante","descripcion":"Foto de lectura de megóhmetro (si aplica)"}]'::jsonb,
 '[{"nombre":"Resistencia aislamiento compresor 1","unidad":"MΩ","rango_min":1,"rango_max":null},{"nombre":"Resistencia aislamiento compresor 2","unidad":"MΩ","rango_min":1,"rango_max":null}]'::jsonb,
 true),

('vrf_exterior', 'preventivo', 11, 'Verificación de controles de seguridad',
 'Verificar operación de presostato de alta presión. Verificar operación de presostato de baja presión. Verificar protección por sobre-corriente (overload). Verificar protección por sobre-temperatura de descarga. Verificar protección por falla de fase y desbalance de voltaje. Documentar set points de cada protección.',
 '[{"etapa":"durante","descripcion":"Foto de presostatos y protecciones"}]'::jsonb,
 '[]'::jsonb,
 true),

('vrf_exterior', 'preventivo', 12, 'Inspección de tuberías de refrigerante y aislamiento',
 'Inspeccionar tuberías de líquido y succión entre el módulo exterior y las unidades interiores. Verificar estado del aislamiento térmico. Verificar soportes de tubería. Buscar signos de vibración excesiva o rozamiento contra estructura. Verificar que las tuberías expuestas a intemperie tengan protección UV.',
 '[{"etapa":"antes","descripcion":"Foto de tuberías y aislamiento"},{"etapa":"antes","descripcion":"Foto de cualquier daño o deterioro"}]'::jsonb,
 '[]'::jsonb,
 true),

('vrf_exterior', 'preventivo', 13, 'Verificación de sistema de recuperación de aceite',
 'Verificar operación del sistema de retorno de aceite (oil return). Verificar que la trampa de aceite esté limpia y funcional. Verificar que no haya acumulación excesiva de aceite en el separador. En sistemas con múltiples compresores, verificar ecualización de aceite. Verificar color y condición del aceite en mirilla.',
 '[{"etapa":"durante","descripcion":"Foto de mirilla de aceite mostrando nivel y color"}]'::jsonb,
 '[]'::jsonb,
 true),

('vrf_exterior', 'preventivo', 14, 'Re-energización, prueba operacional y documentación',
 'Restaurar energía eléctrica. Arrancar sistema desde el controlador centralizado. Verificar arranque secuencial de compresores. Monitorear presiones de operación durante 15 minutos. Verificar que todas las unidades interiores respondan. Verificar que los ventiladores del condensador operen correctamente. Verificar ausencia de ruidos anormales. Documentar lecturas finales. Verificar historial de errores limpio.',
 '[{"etapa":"despues","descripcion":"Foto del equipo en operación"},{"etapa":"despues","descripcion":"Foto de presiones estabilizadas"},{"etapa":"despues","descripcion":"Video del equipo funcionando (10-15 seg)"}]'::jsonb,
 '[{"nombre":"Presión succión final","unidad":"PSI","rango_min":null,"rango_max":null},{"nombre":"Presión descarga final","unidad":"PSI","rango_min":null,"rango_max":null},{"nombre":"Temp. ambiente","unidad":"°C","rango_min":null,"rango_max":null}]'::jsonb,
 true);

-- ============================================================================
-- CORRECTIVE: VRF EXTERIOR (14 issues)
-- ============================================================================

INSERT INTO public.fallas_correctivas (tipo_equipo_slug, nombre, diagnostico, evidencia_requerida, materiales_tipicos) VALUES

('vrf_exterior', 'Falla de compresor inverter',
 'Compresor no arranca, ruido de golpeteo, error de sobre-corriente o sobre-temperatura en pantalla. Amperaje fuera de rango. Resistencia de devanados anormal. Posible falla mecánica interna o de tarjeta inversora.',
 '[{"etapa":"antes","descripcion":"Foto del error en pantalla"},{"etapa":"durante","descripcion":"Foto de lectura de amperaje"},{"etapa":"durante","descripcion":"Foto de lectura de resistencia de devanados"},{"etapa":"despues","descripcion":"Foto del compresor nuevo instalado"}]'::jsonb,
 '["Compresor de reemplazo","Aceite refrigerante","Filtro deshidratador","Refrigerante","Kit de soldadura"]'::jsonb),

('vrf_exterior', 'Falla de tarjeta inversora (IPM/PCB)',
 'Códigos de error de inverter en pantalla. Compresor no modula velocidad. Pérdida de capacidad variable. Componentes visiblemente dañados en la tarjeta (quemaduras, capacitores hinchados). Ventilador de enfriamiento de tarjeta no funciona.',
 '[{"etapa":"antes","descripcion":"Foto de la tarjeta inversora dañada"},{"etapa":"antes","descripcion":"Foto de códigos de error"},{"etapa":"despues","descripcion":"Foto de tarjeta nueva instalada y sistema operando"}]'::jsonb,
 '["Tarjeta inversora de reemplazo (según modelo y marca)"]'::jsonb),

('vrf_exterior', 'Fuga de refrigerante en circuito',
 'Capacidad reducida. Presiones de operación anormales. Manchas de aceite visibles en conexiones o soldaduras. Alarma de baja presión en el sistema. Detector electrónico indica presencia de refrigerante.',
 '[{"etapa":"antes","descripcion":"Foto de la fuga o manchas de aceite"},{"etapa":"durante","descripcion":"Foto de lectura de presiones"},{"etapa":"durante","descripcion":"Foto del detector de fugas indicando fuga"},{"etapa":"despues","descripcion":"Foto de la reparación completada y presiones normales"}]'::jsonb,
 '["Refrigerante R410A/R32","Kit de soldadura","Detector de fugas electrónico","Nitrógeno OFN","Válvulas Schrader"]'::jsonb),

('vrf_exterior', 'Error de comunicación entre módulos (U4/E3/1102)',
 'Pérdida de comunicación con una o más unidades interiores. Sistema no arranca o arranca parcialmente. Error persistente en pantalla del controlador. Comunicación intermitente.',
 '[{"etapa":"antes","descripcion":"Foto del error en pantalla"},{"etapa":"antes","descripcion":"Foto del cableado de comunicación"},{"etapa":"despues","descripcion":"Foto de comunicación restablecida en todas las unidades"}]'::jsonb,
 '["Cable de comunicación","Terminales","Tarjeta de control de reemplazo (si aplica)"]'::jsonb),

('vrf_exterior', 'Falla de ventilador del condensador',
 'Ventilador no arranca, ruido anormal durante operación, vibración excesiva. Posible motor quemado, aspas dañadas o desbalanceadas, rodamientos desgastados.',
 '[{"etapa":"antes","descripcion":"Foto/video del ventilador con falla"},{"etapa":"durante","descripcion":"Foto de lectura de amperaje del motor"},{"etapa":"despues","descripcion":"Foto del ventilador reparado o reemplazado funcionando"}]'::jsonb,
 '["Motor de ventilador de reemplazo","Aspas de ventilador","Capacitor (si aplica)"]'::jsonb),

('vrf_exterior', 'Presostato de alta presión disparado',
 'Sistema se apaga por sobre-presión. Posible serpentín de condensador sucio, ventilador defectuoso, sobrecarga de refrigerante, o temperatura ambiente extrema. Presión de descarga excede límite de seguridad.',
 '[{"etapa":"antes","descripcion":"Foto de lectura de presiones"},{"etapa":"antes","descripcion":"Foto de condición del serpentín condensador"},{"etapa":"despues","descripcion":"Foto de presiones normales después de reparación"}]'::jsonb,
 '["Según diagnóstico específico"]'::jsonb),

('vrf_exterior', 'Presostato de baja presión disparado',
 'Sistema se apaga por baja presión. Posible fuga de refrigerante, restricción en línea de líquido, EEV defectuosa en alguna unidad interior, o filtro deshidratador obstruido.',
 '[{"etapa":"antes","descripcion":"Foto de lectura de presiones"},{"etapa":"durante","descripcion":"Foto de conexiones inspeccionadas"},{"etapa":"despues","descripcion":"Foto de presiones normales después de reparación"}]'::jsonb,
 '["Según diagnóstico específico"]'::jsonb),

('vrf_exterior', 'Desbalance de fases / Problema de voltaje',
 'Compresores no arrancan o se apagan intermitentemente. Error de voltaje en pantalla. Desbalance de voltaje entre fases mayor al 2%. Protección de falla de fase activada.',
 '[{"etapa":"antes","descripcion":"Foto de lecturas de voltaje entre fases"},{"etapa":"despues","descripcion":"Foto de voltaje corregido y balanceado"}]'::jsonb,
 '["Protector de voltaje","Corrección en acometida eléctrica"]'::jsonb),

('vrf_exterior', 'Migración de aceite / Bajo nivel de aceite',
 'Compresor ruidoso o con golpeteo. Nivel de aceite bajo o no visible en mirilla. Aceite contaminado (color oscuro). Falla prematura de compresor por lubricación insuficiente. Aceite acumulado en trampas de tubería.',
 '[{"etapa":"antes","descripcion":"Foto de mirilla de aceite mostrando nivel bajo"},{"etapa":"durante","descripcion":"Foto del proceso de adición de aceite"},{"etapa":"despues","descripcion":"Foto de mirilla con nivel correcto"}]'::jsonb,
 '["Aceite refrigerante (POE según especificación del fabricante)","Filtro de aceite","Trampa de aceite"]'::jsonb),

('vrf_exterior', 'Error de sensor de presión o temperatura',
 'Lecturas erráticas en pantalla del controlador. Sistema no modula correctamente. Códigos de error de sensor. Compresor opera fuera de parámetros por lectura incorrecta de sensor.',
 '[{"etapa":"antes","descripcion":"Foto de lectura del sensor vs referencia"},{"etapa":"antes","descripcion":"Foto del código de error"},{"etapa":"despues","descripcion":"Foto del sensor nuevo instalado con lectura correcta"}]'::jsonb,
 '["Sensor de reemplazo (según modelo y ubicación)"]'::jsonb),

('vrf_exterior', 'Falla de válvula reversible (sistemas heat pump)',
 'No cambia de modo frío a calor o viceversa. Fugas internas en la válvula de 4 vías. Presiones anormales en ambos modos de operación. Solenoide de la válvula no energiza.',
 '[{"etapa":"antes","descripcion":"Foto de la válvula reversible"},{"etapa":"durante","descripcion":"Foto de presiones en ambos modos de operación"},{"etapa":"despues","descripcion":"Foto de la válvula nueva instalada y sistema operando en ambos modos"}]'::jsonb,
 '["Válvula reversible de 4 vías de reemplazo","Kit de soldadura","Refrigerante","Nitrógeno"]'::jsonb),

('vrf_exterior', 'Obstrucción en filtro deshidratador',
 'Diferencial de temperatura excesivo a través del filtro deshidratador. Restricción de flujo de refrigerante. Formación de escarcha en el filtro. Capacidad de enfriamiento reducida.',
 '[{"etapa":"antes","descripcion":"Foto de lectura de temperaturas antes y después del filtro"},{"etapa":"despues","descripcion":"Foto del filtro nuevo instalado"}]'::jsonb,
 '["Filtro deshidratador de reemplazo (según diámetro de tubería)","Kit de soldadura","Nitrógeno"]'::jsonb),

('vrf_exterior', 'Falla eléctrica / Breaker se dispara',
 'Sistema pierde energía intermitente o permanentemente. Breaker térmico-magnético se dispara al arrancar compresores. Posible cortocircuito, sobre-corriente, o falla a tierra.',
 '[{"etapa":"antes","descripcion":"Foto del breaker disparado"},{"etapa":"durante","descripcion":"Foto de lectura de amperaje de arranque"},{"etapa":"despues","descripcion":"Foto del sistema operando con breaker estable"}]'::jsonb,
 '["Breaker de reemplazo","Cableado eléctrico","Contactor"]'::jsonb),

('vrf_exterior', 'Ruido o vibración excesiva en módulo exterior',
 'Golpeteo, traqueteo o vibración transmitida a estructura del edificio. Puede ser causado por compresores, ventiladores, tornillería floja, tuberías sin soporte, o bases antivibratorias deterioradas.',
 '[{"etapa":"antes","descripcion":"Video mostrando el ruido o vibración"},{"etapa":"despues","descripcion":"Video del equipo operando sin vibración después de reparación"}]'::jsonb,
 '["Bases antivibratorias","Tornillería","Amortiguadores de vibración","Soportes de tubería"]'::jsonb);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- SELECT tipo_equipo_slug, tipo_mantenimiento, count(*) FROM plantillas_pasos WHERE tipo_equipo_slug = 'vrf_exterior' GROUP BY 1, 2;
-- Expected: vrf_exterior/preventivo: 14
--
-- SELECT tipo_equipo_slug, count(*) FROM fallas_correctivas WHERE tipo_equipo_slug = 'vrf_exterior' GROUP BY 1;
-- Expected: vrf_exterior: 14
-- ============================================================================
