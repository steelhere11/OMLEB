-- ============================================================================
-- OMLEB HVAC — Seed: VRF Interior Guided Maintenance Workflow Templates
-- ============================================================================
-- Run this AFTER migration-workflows.sql and migration-20-equipment-taxonomy.sql
-- Seeds 12 preventive steps and 12 corrective issues.
--
-- Data source: ASHRAE 180, manufacturer manuals (Daikin, LG, Mitsubishi)
-- Equipment type: VRF Unidad Interior
-- NOTE: tipos_equipo slug 'vrf_interior' already exists from migration-20
-- ============================================================================

-- ============================================================================
-- PREVENTIVE: VRF INTERIOR (12 steps)
-- ============================================================================

INSERT INTO public.plantillas_pasos (tipo_equipo_slug, tipo_mantenimiento, orden, nombre, procedimiento, evidencia_requerida, lecturas_requeridas, es_obligatorio) VALUES

('vrf_interior', 'preventivo', 1, 'Seguridad: Desenergizar unidad interior',
 'Apagar la unidad desde el control remoto o controlador centralizado. Verificar que el equipo deja de operar. Desconectar el breaker del circuito de la unidad interior. Verificar ausencia de voltaje en terminales con multímetro. Aplicar Lock-Out/Tag-Out.',
 '[{"etapa":"antes","descripcion":"Foto del equipo encendido"},{"etapa":"antes","descripcion":"Foto del breaker en ON"},{"etapa":"despues","descripcion":"Foto del breaker en OFF con etiqueta de seguridad"}]'::jsonb,
 '[{"nombre":"Voltaje en terminales","unidad":"V","rango_min":0,"rango_max":0}]'::jsonb,
 true),

('vrf_interior', 'preventivo', 2, 'Inspección visual general de la unidad',
 'Examinar gabinete por daños, decoloración o manchas de agua. Verificar que el equipo esté bien montado y nivelado. Revisar que no haya obstrucciones en rejillas de suministro y retorno. Verificar estado de acabados y pintura. Revisar que no haya fugas de agua en conexiones de refrigerante.',
 '[{"etapa":"antes","descripcion":"Foto frontal del equipo"},{"etapa":"antes","descripcion":"Foto de cualquier daño visible o anomalía"}]'::jsonb,
 '[]'::jsonb,
 true),

('vrf_interior', 'preventivo', 3, 'Inspección y limpieza/reemplazo de filtros de aire',
 'Retirar filtros de aire. Inspeccionar por acumulación de polvo, roturas o deformación. Lavar con agua tibia y jabón neutro si son reutilizables. Dejar secar completamente antes de reinstalar. Reemplazar si están dañados o son desechables.',
 '[{"etapa":"antes","descripcion":"Foto de filtros sucios"},{"etapa":"durante","descripcion":"Foto de filtros retirados"},{"etapa":"despues","descripcion":"Foto de filtros limpios o nuevos instalados"}]'::jsonb,
 '[]'::jsonb,
 true),

('vrf_interior', 'preventivo', 4, 'Inspección y limpieza del serpentín evaporador',
 'Abrir panel de acceso. Inspeccionar serpentín por acumulación de polvo, pelusa y suciedad. Verificar paso de luz con linterna. Aspirar con cepillo suave. Aplicar limpiador espumante no ácido si hay acumulación significativa. Peinar aletas dobladas con peine de aletas.',
 '[{"etapa":"antes","descripcion":"Foto del serpentín mostrando condición"},{"etapa":"durante","descripcion":"Foto de la limpieza"},{"etapa":"despues","descripcion":"Foto del serpentín limpio"}]'::jsonb,
 '[]'::jsonb,
 true),

('vrf_interior', 'preventivo', 5, 'Inspección y limpieza del ventilador y motor',
 'Inspeccionar aspas del ventilador (turbina o tipo centrífugo) por acumulación de polvo. Limpiar con cepillo y aspiradora. Verificar que gire libremente sin roces ni vibraciones. Medir amperaje del motor. Verificar que no haya ruidos anormales.',
 '[{"etapa":"antes","descripcion":"Foto del ventilador mostrando condición"},{"etapa":"despues","descripcion":"Foto del ventilador limpio"},{"etapa":"durante","descripcion":"Foto de lectura de amperaje"}]'::jsonb,
 '[{"nombre":"Amperaje motor","unidad":"A","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('vrf_interior', 'preventivo', 6, 'Inspección y limpieza de charola de condensados y línea de drenaje',
 'Inspeccionar charola por agua estancada, lodo, algas u hongos. Limpiar con solución antibacterial. Colocar tableta bactericida. Verificar que la línea de drenaje no esté obstruida. Soplar con nitrógeno o aire comprimido si es necesario. Verificar flujo libre de agua. Inspeccionar bomba de condensados si aplica.',
 '[{"etapa":"antes","descripcion":"Foto de la charola mostrando condición"},{"etapa":"durante","descripcion":"Foto de la limpieza"},{"etapa":"despues","descripcion":"Foto de charola limpia y drenaje verificado"}]'::jsonb,
 '[]'::jsonb,
 true),

('vrf_interior', 'preventivo', 7, 'Verificación de válvula de expansión electrónica (EEV)',
 'Verificar operación de la válvula de expansión electrónica. Confirmar que el motor paso a paso del EEV responde a señales del controlador. Verificar que la apertura del EEV sea proporcional a la demanda. Revisar conexiones del cableado del EEV. Verificar que no haya obstrucción en el filtro de la línea de líquido.',
 '[{"etapa":"durante","descripcion":"Foto de la EEV y conexiones"},{"etapa":"durante","descripcion":"Foto mostrando señal de apertura en el controlador"}]'::jsonb,
 '[]'::jsonb,
 true),

('vrf_interior', 'preventivo', 8, 'Verificación de sensores de temperatura',
 'Verificar lectura de sensor de temperatura del aire de retorno. Comparar con termómetro de referencia. Verificar lectura de sensor de temperatura de la tubería. Verificar que la diferencia no exceda ±1°C. Reportar si hay desviación excesiva — puede causar operación errática del sistema.',
 '[{"etapa":"durante","descripcion":"Foto de lectura del sensor vs termómetro de referencia"}]'::jsonb,
 '[{"nombre":"Temp. sensor retorno","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temp. referencia retorno","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temp. sensor tubería","unidad":"°C","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('vrf_interior', 'preventivo', 9, 'Verificación de tarjeta de control y comunicación',
 'Inspeccionar tarjeta PCB por signos de daño, quemaduras, humedad o corrosión. Verificar que los LEDs indicadores muestren operación normal. Verificar comunicación con la unidad exterior y el controlador centralizado. Confirmar dirección de red (address) del equipo en el bus de comunicación. Revisar cables de comunicación por daños o conexiones flojas. Leer y documentar cualquier código de error almacenado.',
 '[{"etapa":"durante","descripcion":"Foto de la tarjeta PCB mostrando LEDs"},{"etapa":"durante","descripcion":"Foto de la pantalla del controlador mostrando comunicación OK"}]'::jsonb,
 '[]'::jsonb,
 true),

('vrf_interior', 'preventivo', 10, 'Inspección de conexiones de refrigerante',
 'Inspeccionar tuberías de refrigerante (líquido y succión) por fugas, daños o deterioro del aislamiento. Verificar estado del aislamiento térmico. Buscar manchas de aceite que indiquen fuga de refrigerante. Verificar que las tuberías estén correctamente soportadas.',
 '[{"etapa":"antes","descripcion":"Foto de las tuberías y aislamiento"},{"etapa":"antes","descripcion":"Foto de cualquier mancha de aceite o daño"}]'::jsonb,
 '[]'::jsonb,
 true),

('vrf_interior', 'preventivo', 11, 'Verificación de louvers/aspas de dirección de aire',
 'Verificar que las aspas de dirección de aire se muevan libremente en todas las posiciones. Verificar operación del motor de las aspas. Limpiar aspas si están sucias. Verificar que la dirección de aire sea la programada.',
 '[{"etapa":"despues","descripcion":"Foto de aspas en posición de operación"}]'::jsonb,
 '[]'::jsonb,
 false),

('vrf_interior', 'preventivo', 12, 'Re-energización, prueba operacional y documentación',
 'Restaurar energía eléctrica. Encender la unidad desde el controlador. Verificar arranque normal. Verificar operación del ventilador en todas las velocidades. Confirmar que la EEV responda a la demanda. Medir temperatura de suministro de aire. Monitorear operación por 10 minutos. Verificar ausencia de ruidos anormales, vibraciones o códigos de error. Cerrar paneles.',
 '[{"etapa":"despues","descripcion":"Foto del equipo en operación normal"},{"etapa":"despues","descripcion":"Foto del controlador mostrando temperatura"}]'::jsonb,
 '[{"nombre":"Temp. aire suministro","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temp. aire retorno","unidad":"°C","rango_min":null,"rango_max":null}]'::jsonb,
 true);

-- ============================================================================
-- CORRECTIVE: VRF INTERIOR (12 issues)
-- ============================================================================

INSERT INTO public.fallas_correctivas (tipo_equipo_slug, nombre, diagnostico, evidencia_requerida, materiales_tipicos) VALUES

('vrf_interior', 'Fuga de refrigerante en unidad interior',
 'Manchas de aceite en conexiones de refrigerante, reducción de capacidad de enfriamiento/calefacción, formación de hielo en tubería de succión. Posible fuga en conexión flare, soldadura o válvula de servicio.',
 '[{"etapa":"antes","descripcion":"Foto de la fuga o manchas de aceite"},{"etapa":"durante","descripcion":"Foto de lectura de presiones"},{"etapa":"despues","descripcion":"Foto de la reparación completada"}]'::jsonb,
 '["Kit de soldadura","Refrigerante R410A/R32","Detector de fugas electrónico","Nitrógeno OFN","Válvulas Schrader"]'::jsonb),

('vrf_interior', 'Motor de ventilador no arranca',
 'Ventilador no gira al encender el equipo. Sin flujo de aire. Posible falla de motor, tarjeta de control, o conexión eléctrica. Verificar voltaje en terminales del motor, continuidad del cableado y señal de la tarjeta.',
 '[{"etapa":"antes","descripcion":"Foto del motor sin funcionar"},{"etapa":"antes","descripcion":"Foto de lectura de amperaje o resistencia del motor"},{"etapa":"despues","descripcion":"Foto del motor nuevo instalado y funcionando"}]'::jsonb,
 '["Motor de ventilador de reemplazo","Cable eléctrico","Terminales"]'::jsonb),

('vrf_interior', 'EEV no opera correctamente',
 'Unidad no enfría o calienta adecuadamente. Ruido de pulsación en la válvula de expansión electrónica. Motor paso a paso no responde a señales del controlador. Sobrecalentamiento o subenfriamiento fuera de rango.',
 '[{"etapa":"antes","descripcion":"Foto de la EEV"},{"etapa":"durante","descripcion":"Foto de lectura de sobrecalentamiento/subenfriamiento"},{"etapa":"despues","descripcion":"Foto de la EEV nueva instalada"}]'::jsonb,
 '["EEV de reemplazo (según modelo)","Filtro de línea de líquido","Kit de soldadura"]'::jsonb),

('vrf_interior', 'Error de comunicación (código U4/F1/1102)',
 'Unidad muestra error de comunicación en pantalla. No responde al controlador centralizado. Desconexión intermitente del bus de red. Posible falla en cableado de comunicación, polaridad invertida, o tarjeta PCB dañada.',
 '[{"etapa":"antes","descripcion":"Foto del código de error en pantalla"},{"etapa":"antes","descripcion":"Foto del cableado de comunicación"},{"etapa":"despues","descripcion":"Foto de comunicación restablecida"}]'::jsonb,
 '["Cable de comunicación","Terminales","Tarjeta PCB de reemplazo (si aplica)"]'::jsonb),

('vrf_interior', 'Sensor de temperatura dañado',
 'Lecturas de temperatura erráticas en el controlador. Unidad cicla frecuentemente (encendido/apagado). No alcanza el set point programado. Desviación mayor a ±2°C respecto al termómetro de referencia.',
 '[{"etapa":"antes","descripcion":"Foto de lectura del sensor vs termómetro de referencia"},{"etapa":"despues","descripcion":"Foto del sensor nuevo instalado con lectura correcta"}]'::jsonb,
 '["Sensor de temperatura de reemplazo (según modelo)"]'::jsonb),

('vrf_interior', 'Tarjeta de control (PCB) dañada',
 'Unidad no enciende o muestra error persistente. Componentes visiblemente quemados o hinchados en la tarjeta. LEDs indicadores apagados o en patrón de error. No responde a ningún comando del controlador.',
 '[{"etapa":"antes","descripcion":"Foto de la tarjeta PCB dañada"},{"etapa":"antes","descripcion":"Foto de la pantalla mostrando error"},{"etapa":"despues","descripcion":"Foto de la tarjeta nueva instalada y funcionando"}]'::jsonb,
 '["Tarjeta PCB de reemplazo (según modelo y marca)"]'::jsonb),

('vrf_interior', 'Drenaje obstruido / Fuga de agua',
 'Agua goteando del equipo. Charola de condensados desbordada. Manchas de agua en techo, pared o piso debajo del equipo. Línea de drenaje tapada por lodo, algas o biofilm. Olor a humedad o moho.',
 '[{"etapa":"antes","descripcion":"Foto de la fuga de agua visible"},{"etapa":"antes","descripcion":"Foto de la obstrucción en drenaje"},{"etapa":"despues","descripcion":"Foto del drenaje limpio con flujo libre verificado"}]'::jsonb,
 '["Kit de limpieza de drenaje","Tabletas bactericidas","Bomba de condensados (si aplica)","Nitrógeno o aire comprimido"]'::jsonb),

('vrf_interior', 'Serpentín evaporador congelado',
 'Serpentín de enfriamiento cubierto de hielo o escarcha. Flujo de aire muy reducido o nulo. Agua excesiva al descongelar. Puede indicar filtro sucio, bajo flujo de aire, baja carga de refrigerante, o falla en EEV.',
 '[{"etapa":"antes","descripcion":"Foto del serpentín congelado"},{"etapa":"durante","descripcion":"Foto durante el descongelamiento"},{"etapa":"despues","descripcion":"Foto del serpentín descongelado y limpio"}]'::jsonb,
 '["Limpiador de serpentín","Filtros de reemplazo"]'::jsonb),

('vrf_interior', 'Ruido excesivo / Vibración',
 'Ruido de traqueteo, rozamiento o chirrido durante operación. Puede ser causado por aspas desbalanceadas, rodamientos desgastados, tornillería floja, acumulación de suciedad en ventilador, o vibración transmitida por tuberías.',
 '[{"etapa":"antes","descripcion":"Video mostrando el ruido o vibración anormal"},{"etapa":"despues","descripcion":"Video del equipo funcionando sin ruido después de reparación"}]'::jsonb,
 '["Tornillería","Bases antivibratorias","Aspas de ventilador (si dañadas)","Rodamientos"]'::jsonb),

('vrf_interior', 'Filtro de aire obstruido o dañado',
 'Filtro de aire con acumulación excesiva de polvo, pelusa o suciedad. Filtro roto, deformado o colapsado. Causa reducción de flujo de aire, disminución de eficiencia y posible congelamiento del serpentín.',
 '[{"etapa":"antes","descripcion":"Foto del filtro obstruido o dañado"},{"etapa":"despues","descripcion":"Foto del filtro nuevo instalado"}]'::jsonb,
 '["Filtros de aire de reemplazo (según dimensiones del equipo)"]'::jsonb),

('vrf_interior', 'Unidad no enfría/calienta adecuadamente',
 'Flujo de aire tibio o a temperatura ambiente. No alcanza la temperatura deseada. Causas múltiples: filtro sucio, serpentín obstruido, EEV defectuosa, baja carga de refrigerante, error de comunicación con unidad exterior, sensor dañado.',
 '[{"etapa":"antes","descripcion":"Foto de lectura de temperatura de suministro"},{"etapa":"durante","descripcion":"Foto de componentes sospechosos (filtro, serpentín, EEV)"},{"etapa":"despues","descripcion":"Foto de temperaturas normales después de reparación"}]'::jsonb,
 '["Según diagnóstico específico"]'::jsonb),

('vrf_interior', 'Control remoto / Controlador no responde',
 'Pantalla del control remoto apagada o sin respuesta. No envía señal al equipo. Lectura de temperatura incorrecta. Equipo no responde a cambios de set point. Posible falla de baterías, receptor IR, cableado o del controlador.',
 '[{"etapa":"antes","descripcion":"Foto del controlador sin funcionar o con error"},{"etapa":"despues","descripcion":"Foto del controlador nuevo o reparado funcionando"}]'::jsonb,
 '["Controlador de reemplazo (según modelo y marca)","Baterías","Cable de control"]'::jsonb);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- SELECT tipo_equipo_slug, tipo_mantenimiento, count(*) FROM plantillas_pasos WHERE tipo_equipo_slug = 'vrf_interior' GROUP BY 1, 2;
-- Expected: vrf_interior/preventivo: 12
--
-- SELECT tipo_equipo_slug, count(*) FROM fallas_correctivas WHERE tipo_equipo_slug = 'vrf_interior' GROUP BY 1;
-- Expected: vrf_interior: 12
-- ============================================================================
