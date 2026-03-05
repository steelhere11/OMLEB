-- ============================================================================
-- OMLEB HVAC — Seed: Paquete / Rooftop Guided Maintenance Workflow Templates
-- ============================================================================
-- Run this AFTER migration-workflows.sql and migration-20-equipment-taxonomy.sql
-- Seeds 14 preventive steps and 12 corrective issues.
--
-- Data source: ASHRAE 180, NREL RTU Maintenance Guide, manufacturer manuals (Carrier, Lennox)
-- Equipment type: Unidad Paquete / Rooftop
-- NOTE: tipos_equipo slug 'paquete_rooftop' already exists from migration-20
-- ============================================================================

-- ============================================================================
-- PREVENTIVE: PAQUETE ROOFTOP (14 steps)
-- ============================================================================

INSERT INTO public.plantillas_pasos (tipo_equipo_slug, tipo_mantenimiento, orden, nombre, procedimiento, evidencia_requerida, lecturas_requeridas, es_obligatorio) VALUES

('paquete_rooftop', 'preventivo', 1, 'Seguridad: Desenergizar equipo y Lock-Out/Tag-Out',
 'Apagar el equipo desde el termostato o BMS. Desconectar el interruptor de desconexión principal (disconnect). Verificar ausencia de voltaje con multímetro. Aplicar Lock-Out/Tag-Out. Cerrar suministro de gas si aplica.',
 '[{"etapa":"antes","descripcion":"Foto del equipo en operación"},{"etapa":"despues","descripcion":"Foto del disconnect en OFF con etiqueta de seguridad"}]'::jsonb,
 '[{"nombre":"Voltaje en terminales","unidad":"V","rango_min":0,"rango_max":0}]'::jsonb,
 true),

('paquete_rooftop', 'preventivo', 2, 'Inspección visual general del gabinete y base',
 'Inspeccionar gabinete por daños, corrosión, huecos, sellos deteriorados. Verificar que todos los paneles estén seguros. Inspeccionar base y curb cap por integridad y sellos contra agua. Verificar drenajes del gabinete. Buscar signos de entrada de agua, roedores o insectos.',
 '[{"etapa":"antes","descripcion":"Foto panorámica del equipo en azotea"},{"etapa":"antes","descripcion":"Foto de cualquier daño, corrosión o sellos deteriorados"},{"etapa":"antes","descripcion":"Foto del curb cap y base"}]'::jsonb,
 '[]'::jsonb,
 true),

('paquete_rooftop', 'preventivo', 3, 'Inspección y reemplazo de filtros de aire',
 'Retirar filtros de aire del banco de filtros. Inspeccionar por acumulación excesiva. Reemplazar todos los filtros con tamaño y rating MERV correcto. Verificar sellos de los marcos de filtros. Verificar que no haya bypass de aire alrededor de los filtros.',
 '[{"etapa":"antes","descripcion":"Foto de filtros sucios"},{"etapa":"durante","descripcion":"Foto de filtros retirados mostrando acumulación"},{"etapa":"despues","descripcion":"Foto de filtros nuevos instalados"}]'::jsonb,
 '[]'::jsonb,
 true),

('paquete_rooftop', 'preventivo', 4, 'Inspección y limpieza del serpentín evaporador',
 'Inspeccionar serpentín del evaporador por suciedad y obstrucción. Verificar paso de luz con linterna. Aspirar con cepillo suave. Aplicar limpiador espumante no ácido si hay acumulación significativa. Enjuagar con agua a baja presión. Verificar charola de condensados. Verificar línea de drenaje libre.',
 '[{"etapa":"antes","descripcion":"Foto del serpentín evaporador mostrando condición"},{"etapa":"despues","descripcion":"Foto del serpentín limpio"}]'::jsonb,
 '[]'::jsonb,
 true),

('paquete_rooftop', 'preventivo', 5, 'Inspección y limpieza del serpentín condensador',
 'Inspeccionar serpentín del condensador por suciedad, hojas, basura y aletas dobladas. Aspirar lado exterior. Aplicar limpiador espumante. Enjuagar con agua a baja presión. Peinar aletas dobladas con peine de aletas.',
 '[{"etapa":"antes","descripcion":"Foto del serpentín condensador sucio"},{"etapa":"despues","descripcion":"Foto del serpentín limpio"}]'::jsonb,
 '[]'::jsonb,
 true),

('paquete_rooftop', 'preventivo', 6, 'Inspección del sistema de blower (ventilador de suministro)',
 'Inspeccionar rueda del blower (fan wheel) por acumulación de suciedad. Limpiar si es necesario. Verificar que la rueda esté centrada en la carcasa (housing). Medir amperaje del motor del blower. Verificar lubricación de rodamientos del motor y eje (si aplica). Verificar que no haya ruidos o vibraciones.',
 '[{"etapa":"antes","descripcion":"Foto del blower mostrando condición"},{"etapa":"despues","descripcion":"Foto del blower limpio"},{"etapa":"durante","descripcion":"Foto de lectura de amperaje del motor"}]'::jsonb,
 '[{"nombre":"Amperaje motor blower","unidad":"A","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('paquete_rooftop', 'preventivo', 7, 'Inspección de bandas (belts) y poleas',
 'Inspeccionar bandas por grietas, deshilachado, desgaste o elongación. Verificar tensión de la banda — debe deflectarse aprox. 1 pulgada en el punto medio. Verificar alineación de poleas. Inspeccionar poleas por desgaste en la ranura. Reemplazar bandas si están dañadas. NOTA: Reemplazar bandas al menos una vez al año como medida preventiva.',
 '[{"etapa":"antes","descripcion":"Foto de las bandas mostrando condición"},{"etapa":"despues","descripcion":"Foto de banda nueva instalada (si se reemplazó)"}]'::jsonb,
 '[]'::jsonb,
 true),

('paquete_rooftop', 'preventivo', 8, 'Inspección del economizador',
 'Verificar operación de dampers del economizador (abrir y cerrar). Verificar actuador del damper. Verificar sensor de temperatura exterior. Verificar ajuste mínimo de aire exterior. Verificar que las aspas del damper sellen correctamente cuando están cerradas. Lubricar articulaciones del damper. Verificar que el control del economizador responda a cambios de temperatura.',
 '[{"etapa":"durante","descripcion":"Foto del damper en posición abierta y cerrada"},{"etapa":"durante","descripcion":"Foto del actuador"}]'::jsonb,
 '[]'::jsonb,
 true),

('paquete_rooftop', 'preventivo', 9, 'Inspección del compresor y circuito de refrigeración',
 'Medir amperaje del compresor y comparar con RLA de placa. Verificar presiones de succión y descarga. Calcular sobrecalentamiento y subenfriamiento. Verificar operación del calentador de cárter. Inspeccionar por ruidos o vibraciones. Inspeccionar contactores y capacitores visualmente.',
 '[{"etapa":"durante","descripcion":"Foto de lectura de amperaje del compresor"},{"etapa":"durante","descripcion":"Foto de manifold mostrando presiones"}]'::jsonb,
 '[{"nombre":"Amperaje compresor","unidad":"A","rango_min":null,"rango_max":null},{"nombre":"Presión succión","unidad":"PSI","rango_min":null,"rango_max":null},{"nombre":"Presión descarga","unidad":"PSI","rango_min":null,"rango_max":null},{"nombre":"Sobrecalentamiento","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Subenfriamiento","unidad":"°C","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('paquete_rooftop', 'preventivo', 10, 'Detección de fugas de refrigerante',
 'Inspeccionar visualmente todas las conexiones por manchas de aceite. Utilizar detector electrónico en conexiones y uniones. Documentar fugas encontradas. Verificar válvulas de servicio.',
 '[{"etapa":"durante","descripcion":"Foto del detector en uso"},{"etapa":"durante","descripcion":"Foto de fuga si se encuentra"}]'::jsonb,
 '[]'::jsonb,
 true),

('paquete_rooftop', 'preventivo', 11, 'Inspección del sistema de calefacción (gas o eléctrico)',
 'Si es gas: verificar presión de gas (entrada y manifold), inspeccionar quemadores por acumulación o daño, verificar ignición (chispa o hot surface igniter), inspeccionar intercambiador de calor por grietas o corrosión, verificar venteo de gases de combustión. Si es eléctrico: verificar resistencias, verificar secuenciadores, medir amperaje. Verificar operación de termostato de límite de alta temperatura.',
 '[{"etapa":"durante","descripcion":"Foto de quemadores o resistencias"},{"etapa":"durante","descripcion":"Foto de intercambiador de calor (si gas)"}]'::jsonb,
 '[{"nombre":"Presión gas entrada","unidad":"in. w.c.","rango_min":null,"rango_max":null},{"nombre":"Temp. diferencial calefacción","unidad":"°C","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('paquete_rooftop', 'preventivo', 12, 'Inspección eléctrica completa',
 'Verificar apriete de terminales. Inspeccionar contactores, relés, fusibles por desgaste o daño. Medir voltaje en todas las fases. Verificar puesta a tierra. Verificar protecciones de sobre-corriente. Limpiar polvo del panel eléctrico.',
 '[{"etapa":"durante","descripcion":"Foto del panel eléctrico"},{"etapa":"despues","descripcion":"Foto del panel limpio"}]'::jsonb,
 '[{"nombre":"Voltaje L1-L2","unidad":"V","rango_min":null,"rango_max":null},{"nombre":"Voltaje L2-L3","unidad":"V","rango_min":null,"rango_max":null},{"nombre":"Voltaje L1-L3","unidad":"V","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('paquete_rooftop', 'preventivo', 13, 'Inspección de charola de condensados y drenaje',
 'Inspeccionar charola de condensados por acumulación, corrosión, o daño. Limpiar charola con solución antibacterial. Verificar que la línea de drenaje esté libre. Verificar que la trampa de drenaje (p-trap) contenga agua. Verificar que el drenaje secundario (si existe) esté funcional.',
 '[{"etapa":"antes","descripcion":"Foto de la charola mostrando condición"},{"etapa":"despues","descripcion":"Foto de charola limpia y drenaje verificado"}]'::jsonb,
 '[]'::jsonb,
 true),

('paquete_rooftop', 'preventivo', 14, 'Prueba de operación completa y cierre',
 'Restaurar energía y gas. Arrancar equipo en modo enfriamiento y verificar operación normal. Cambiar a modo calefacción y verificar. Verificar operación del economizador. Verificar termostato o control BMS. Monitorear operación por 15 minutos. Cerrar todos los paneles. Verificar ausencia de alarmas.',
 '[{"etapa":"despues","descripcion":"Foto del equipo en operación"},{"etapa":"despues","descripcion":"Foto del termostato mostrando temperatura"}]'::jsonb,
 '[{"nombre":"Temp. suministro enfriamiento","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temp. suministro calefacción","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temp. retorno","unidad":"°C","rango_min":null,"rango_max":null}]'::jsonb,
 true);

-- ============================================================================
-- CORRECTIVE: PAQUETE ROOFTOP (12 issues)
-- ============================================================================

INSERT INTO public.fallas_correctivas (tipo_equipo_slug, nombre, diagnostico, evidencia_requerida, materiales_tipicos) VALUES

('paquete_rooftop', 'Banda (belt) rota o desgastada',
 'Sin flujo de aire en el sistema de ductos. Blower no gira. Ruido de chirrido antes de la ruptura. Banda visiblemente rota, agrietada, o desgastada. Equipo funciona pero no entrega aire al espacio.',
 '[{"etapa":"antes","descripcion":"Foto de la banda rota o desgastada"},{"etapa":"antes","descripcion":"Foto de la polea mostrando condición"},{"etapa":"despues","descripcion":"Foto de banda nueva instalada y tensionada"}]'::jsonb,
 '["Banda de reemplazo (según número y tamaño)","Polea (si está desgastada)"]'::jsonb),

('paquete_rooftop', 'Compresor no arranca / Falla de compresor',
 'Sin enfriamiento. Compresor no energiza o se dispara al arrancar. Amperaje anormal (excesivo o cero). Ruidos de golpeteo o rechinido. Protección térmica disparada. Posible falla mecánica, eléctrica, o de capacitor/contactor.',
 '[{"etapa":"antes","descripcion":"Foto del compresor"},{"etapa":"durante","descripcion":"Foto de lectura de amperaje"},{"etapa":"durante","descripcion":"Foto de lectura de resistencia de devanados"},{"etapa":"despues","descripcion":"Foto del compresor reparado o reemplazado operando"}]'::jsonb,
 '["Compresor de reemplazo","Capacitor","Contactor","Aceite refrigerante","Filtro deshidratador","Refrigerante"]'::jsonb),

('paquete_rooftop', 'Economizador trabado / Damper no opera',
 'Equipo no utiliza free cooling cuando las condiciones ambientales lo permiten. Damper permanece abierto en invierno — puede congelar serpentín evaporador. Actuador del damper no se mueve o no responde a señal de control. Articulaciones del damper oxidadas o trabadas.',
 '[{"etapa":"antes","descripcion":"Foto del damper trabado"},{"etapa":"antes","descripcion":"Foto del actuador"},{"etapa":"despues","descripcion":"Foto del damper operando correctamente"}]'::jsonb,
 '["Actuador de damper de reemplazo","Lubricante para articulaciones","Sensor de temperatura exterior (si dañado)"]'::jsonb),

('paquete_rooftop', 'Fuga de refrigerante',
 'Capacidad de enfriamiento reducida. Presiones de succión y descarga anormales. Manchas de aceite en conexiones. Formación de escarcha en líneas o serpentín. Alarma de baja presión.',
 '[{"etapa":"antes","descripcion":"Foto de la fuga o manchas de aceite"},{"etapa":"durante","descripcion":"Foto de lectura de presiones"},{"etapa":"despues","descripcion":"Foto de reparación completada y presiones normales"}]'::jsonb,
 '["Refrigerante","Kit de soldadura","Detector de fugas electrónico","Nitrógeno OFN"]'::jsonb),

('paquete_rooftop', 'Motor de blower quemado',
 'Sin flujo de aire en ductos. Olor a quemado proveniente del equipo. Amperaje del motor en cero. Motor no gira. Posible falla por sobre-carga, bajo voltaje, o falta de lubricación en rodamientos.',
 '[{"etapa":"antes","descripcion":"Foto del motor quemado"},{"etapa":"durante","descripcion":"Foto de lectura de resistencia del motor"},{"etapa":"despues","descripcion":"Foto del motor nuevo instalado y operando"}]'::jsonb,
 '["Motor de blower de reemplazo (según HP, RPM y frame)","Capacitor de reemplazo","Bandas nuevas"]'::jsonb),

('paquete_rooftop', 'Falla de ignición / Quemador no enciende',
 'Sin calefacción. Error de ignición en secuencia de arranque. Olor a gas sin combustión. Ignitor (chispa o HSI) no genera ignición. Válvula de gas no abre. Sensor de flama no detecta llama.',
 '[{"etapa":"antes","descripcion":"Foto del módulo de ignición mostrando error"},{"etapa":"durante","descripcion":"Foto del ignitor y quemadores"},{"etapa":"despues","descripcion":"Foto de quemadores encendidos y operando"}]'::jsonb,
 '["Ignitor de reemplazo (HSI o chispa según modelo)","Sensor de flama","Válvula de gas","Módulo de ignición"]'::jsonb),

('paquete_rooftop', 'Intercambiador de calor agrietado',
 'Riesgo de monóxido de carbono en el aire de suministro. Olor a combustión o gases en el espacio acondicionado. Hollín visible en el intercambiador o alrededor del gabinete. Grietas visibles al inspeccionar con linterna. RIESGO DE SEGURIDAD — equipo debe apagarse inmediatamente.',
 '[{"etapa":"antes","descripcion":"Foto del intercambiador mostrando grietas o daño"},{"etapa":"antes","descripcion":"Foto de hollín o evidencia de combustión"},{"etapa":"despues","descripcion":"Foto del intercambiador nuevo instalado"}]'::jsonb,
 '["Intercambiador de calor de reemplazo (según modelo)","Sellador resistente a alta temperatura"]'::jsonb),

('paquete_rooftop', 'Falla de capacitor (compresor o motor)',
 'Compresor o motor de ventilador/blower no arranca. Zumba pero no gira. Capacitor visiblemente hinchado, con fuga de aceite, o reventado. Lectura de microfaradios fuera de tolerancia (±5%).',
 '[{"etapa":"antes","descripcion":"Foto del capacitor dañado"},{"etapa":"durante","descripcion":"Foto de lectura de microfaradios"},{"etapa":"despues","descripcion":"Foto del capacitor nuevo instalado"}]'::jsonb,
 '["Capacitor de reemplazo (según microfaradios y voltaje)"]'::jsonb),

('paquete_rooftop', 'Falla de contactor',
 'Compresor o motor no energiza al recibir señal de arranque. Contactos del contactor visiblemente quemados, desgastados o soldados. Bobina del contactor no se magnetiza.',
 '[{"etapa":"antes","descripcion":"Foto del contactor dañado mostrando contactos"},{"etapa":"despues","descripcion":"Foto del contactor nuevo instalado"}]'::jsonb,
 '["Contactor de reemplazo (según amperaje y voltaje de bobina)"]'::jsonb),

('paquete_rooftop', 'Drenaje obstruido / Fuga de agua',
 'Agua goteando al interior del edificio a través del ducto o techo. Charola de condensados desbordada. Línea de drenaje obstruida por lodo, algas o escombros. Trampa de drenaje (p-trap) seca.',
 '[{"etapa":"antes","descripcion":"Foto de la fuga de agua o charola desbordada"},{"etapa":"durante","descripcion":"Foto del proceso de destape de drenaje"},{"etapa":"despues","descripcion":"Foto del drenaje limpio con flujo libre verificado"}]'::jsonb,
 '["Kit de limpieza de drenaje","Tabletas bactericidas","Nitrógeno o aire comprimido"]'::jsonb),

('paquete_rooftop', 'Termostato o control no responde',
 'Sin control de temperatura. Pantalla del termostato apagada o sin respuesta. Equipo no enciende o no apaga. Lectura de temperatura incorrecta. Posible falla de baterías, cableado, transformador, o del termostato mismo.',
 '[{"etapa":"antes","descripcion":"Foto del termostato sin funcionar o con error"},{"etapa":"antes","descripcion":"Foto del cableado del termostato"},{"etapa":"despues","descripcion":"Foto del termostato nuevo o reparado funcionando"}]'::jsonb,
 '["Termostato de reemplazo (según compatibilidad)","Baterías","Cable de control","Transformador (si aplica)"]'::jsonb),

('paquete_rooftop', 'Ruido o vibración excesiva',
 'Componentes sueltos dentro del gabinete. Rodamientos del blower o motor desgastados. Blower desbalanceado por acumulación de suciedad. Tornillería de paneles floja. Vibración transmitida a la estructura del edificio.',
 '[{"etapa":"antes","descripcion":"Video mostrando ruido o vibración anormal"},{"etapa":"durante","descripcion":"Foto de componentes sueltos o dañados identificados"},{"etapa":"despues","descripcion":"Video del equipo operando sin vibración después de reparación"}]'::jsonb,
 '["Rodamientos de reemplazo","Tornillería","Bases antivibratorias","Amortiguadores de vibración"]'::jsonb);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- SELECT tipo_equipo_slug, tipo_mantenimiento, count(*) FROM plantillas_pasos WHERE tipo_equipo_slug = 'paquete_rooftop' GROUP BY 1, 2;
-- Expected: paquete_rooftop/preventivo: 14
--
-- SELECT tipo_equipo_slug, count(*) FROM fallas_correctivas WHERE tipo_equipo_slug = 'paquete_rooftop' GROUP BY 1;
-- Expected: paquete_rooftop: 12
-- ============================================================================
