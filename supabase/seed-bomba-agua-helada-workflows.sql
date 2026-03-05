-- ============================================================================
-- OMLEB HVAC — Seed: Bomba de Agua Helada Guided Maintenance Workflow Templates
-- ============================================================================
-- Run this AFTER migration-workflows.sql and migration-20-equipment-taxonomy.sql
-- Seeds 8 preventive steps and 6 corrective issues.
--
-- Data source: ASHRAE 180, pump manufacturer manuals (Grundfos, Bell & Gossett, Armstrong)
-- Equipment type: Bomba de Agua Helada (Chilled Water Pump)
-- NOTE: tipos_equipo slug 'bomba_agua_helada' already exists from migration-20
-- ============================================================================

-- ============================================================================
-- PREVENTIVE: BOMBA DE AGUA HELADA (8 steps)
-- ============================================================================

INSERT INTO public.plantillas_pasos (tipo_equipo_slug, tipo_mantenimiento, orden, nombre, procedimiento, evidencia_requerida, lecturas_requeridas, es_obligatorio) VALUES

('bomba_agua_helada', 'preventivo', 1, 'Seguridad: Desenergizar y Lock-Out/Tag-Out',
 'Apagar la bomba desde el tablero de control o variador de frecuencia (VFD). Desconectar el interruptor principal. Verificar ausencia de voltaje en terminales con multímetro. Cerrar válvulas de aislamiento de succión y descarga. Verificar que la presión residual en la bomba se haya liberado. Aplicar Lock-Out/Tag-Out.',
 '[{"etapa":"antes","descripcion":"Foto de la bomba en operación"},{"etapa":"despues","descripcion":"Foto del interruptor en OFF con etiqueta de seguridad"},{"etapa":"despues","descripcion":"Foto de válvulas de aislamiento cerradas"}]'::jsonb,
 '[{"nombre":"Voltaje en terminales","unidad":"V","rango_min":0,"rango_max":0}]'::jsonb,
 true),

('bomba_agua_helada', 'preventivo', 2, 'Inspección visual general',
 'Inspeccionar la bomba y motor por fugas de agua, corrosión, o daño mecánico. Verificar anclaje y base de la bomba. Verificar alineación visual motor-bomba (no debe haber desplazamiento visible). Inspeccionar acoplamiento flexible. Verificar que no haya vibración excesiva en la base. Inspeccionar aislamiento térmico de tuberías conectadas.',
 '[{"etapa":"antes","descripcion":"Foto panorámica de la bomba y motor"},{"etapa":"antes","descripcion":"Foto de cualquier fuga, corrosión o daño visible"}]'::jsonb,
 '[]'::jsonb,
 true),

('bomba_agua_helada', 'preventivo', 3, 'Verificación de sellos mecánicos o empaque',
 'Inspeccionar sello mecánico por fugas de agua en el eje. Una fuga menor (goteo leve) puede ser normal en arranque, pero no debe persistir. Verificar que no haya residuos minerales o corrosión en el área del sello. Si usa empaques (packing), verificar ajuste — debe permitir 1-2 gotas por minuto como lubricación. Reemplazar sello mecánico si la fuga es excesiva.',
 '[{"etapa":"antes","descripcion":"Foto del área del sello mecánico mostrando condición"},{"etapa":"antes","descripcion":"Foto de cualquier fuga visible en el eje"},{"etapa":"despues","descripcion":"Foto del sello nuevo instalado (si se reemplazó)"}]'::jsonb,
 '[]'::jsonb,
 true),

('bomba_agua_helada', 'preventivo', 4, 'Inspección y lubricación de rodamientos',
 'Verificar temperatura de rodamientos del motor y de la bomba con termómetro infrarrojo. Temperatura no debe exceder 70°C por encima de la temperatura ambiente. Escuchar por ruidos anormales (rechinido, traqueteo, zumbido). Verificar vibración con la mano o medidor de vibración si está disponible. Lubricar rodamientos con grasa según especificación del fabricante (no sobre-lubricar).',
 '[{"etapa":"durante","descripcion":"Foto de lectura de temperatura de rodamientos"},{"etapa":"durante","descripcion":"Foto del proceso de lubricación"}]'::jsonb,
 '[{"nombre":"Temp. rodamiento motor","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temp. rodamiento bomba","unidad":"°C","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('bomba_agua_helada', 'preventivo', 5, 'Medición de amperaje y voltaje del motor',
 'Medir amperaje de operación del motor en cada fase y comparar con FLA de placa. Medir voltaje entre fases y verificar desbalance (máximo 2%). Si la bomba tiene variador de frecuencia (VFD), verificar frecuencia de operación, voltaje de salida y corriente del VFD. Verificar que el motor no esté sobre-cargado.',
 '[{"etapa":"durante","descripcion":"Foto de lectura de amperaje por fase"},{"etapa":"durante","descripcion":"Foto de lectura de voltaje entre fases"},{"etapa":"durante","descripcion":"Foto de pantalla del VFD (si aplica)"}]'::jsonb,
 '[{"nombre":"Amperaje fase 1","unidad":"A","rango_min":null,"rango_max":null},{"nombre":"Amperaje fase 2","unidad":"A","rango_min":null,"rango_max":null},{"nombre":"Amperaje fase 3","unidad":"A","rango_min":null,"rango_max":null},{"nombre":"Voltaje L1-L2","unidad":"V","rango_min":null,"rango_max":null},{"nombre":"Voltaje L2-L3","unidad":"V","rango_min":null,"rango_max":null},{"nombre":"Voltaje L1-L3","unidad":"V","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('bomba_agua_helada', 'preventivo', 6, 'Verificación de alineación motor-bomba',
 'Verificar alineación entre motor y bomba usando regla de alineación, reloj comparador, o alineador láser. Verificar alineación angular y paralela. La desalineación causa vibración, desgaste prematuro de rodamientos, sellos y acoplamiento. Verificar estado del acoplamiento flexible — buscar desgaste, agrietamiento o deformación. Reemplazar inserto del acoplamiento si está desgastado.',
 '[{"etapa":"durante","descripcion":"Foto del proceso de verificación de alineación"},{"etapa":"durante","descripcion":"Foto del acoplamiento flexible mostrando condición"}]'::jsonb,
 '[]'::jsonb,
 true),

('bomba_agua_helada', 'preventivo', 7, 'Verificación de presiones y flujo de agua',
 'Energizar bomba para mediciones. Leer manómetros de presión en succión y descarga. Calcular presión diferencial (TDH). Verificar que el flujo de agua sea adecuado (puede requerir medición con caudalímetro o lectura del BMS). Verificar que la presión de succión no sea demasiado baja (riesgo de cavitación). Verificar operación de válvulas de balance y check.',
 '[{"etapa":"durante","descripcion":"Foto de lectura de manómetro de succión"},{"etapa":"durante","descripcion":"Foto de lectura de manómetro de descarga"}]'::jsonb,
 '[{"nombre":"Presión succión","unidad":"PSI","rango_min":null,"rango_max":null},{"nombre":"Presión descarga","unidad":"PSI","rango_min":null,"rango_max":null},{"nombre":"Presión diferencial","unidad":"PSI","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('bomba_agua_helada', 'preventivo', 8, 'Prueba de operación y verificación de vibración',
 'Con la bomba en operación, verificar que funcione sin ruidos anormales ni vibraciones excesivas. Verificar que no haya cavitación (ruido de grava/piedras dentro de la bomba). Verificar que la temperatura del motor no exceda los límites. Verificar que los manómetros muestren presiones estables. Verificar operación correcta del VFD si aplica. Documentar lecturas finales.',
 '[{"etapa":"despues","descripcion":"Foto de la bomba en operación normal"},{"etapa":"despues","descripcion":"Foto de manómetros mostrando presiones estables"},{"etapa":"despues","descripcion":"Video de la bomba operando (10-15 seg)"}]'::jsonb,
 '[]'::jsonb,
 true);

-- ============================================================================
-- CORRECTIVE: BOMBA DE AGUA HELADA (6 issues)
-- ============================================================================

INSERT INTO public.fallas_correctivas (tipo_equipo_slug, nombre, diagnostico, evidencia_requerida, materiales_tipicos) VALUES

('bomba_agua_helada', 'Fuga por sello mecánico',
 'Fuga de agua continua y excesiva por el eje de la bomba. Charco de agua debajo de la bomba. Sello mecánico desgastado, dañado, o con depósitos minerales. La fuga no se detiene después del arranque. Posible corrosión o daño en la camisa del eje.',
 '[{"etapa":"antes","descripcion":"Foto de la fuga por el sello mecánico"},{"etapa":"durante","descripcion":"Foto del sello mecánico retirado mostrando desgaste"},{"etapa":"despues","descripcion":"Foto del sello nuevo instalado sin fuga"}]'::jsonb,
 '["Sello mecánico de reemplazo (según modelo y diámetro de eje)","Empaque/O-rings","Camisa de eje (si está dañada)"]'::jsonb),

('bomba_agua_helada', 'Rodamientos desgastados / Vibración excesiva',
 'Vibración excesiva en la bomba y/o motor. Ruido de rechinido, traqueteo o zumbido proveniente de los rodamientos. Temperatura de rodamientos elevada. Desgaste visible en el eje o carcasa del rodamiento. La vibración puede transmitirse a la tubería y estructura.',
 '[{"etapa":"antes","descripcion":"Video mostrando la vibración excesiva"},{"etapa":"durante","descripcion":"Foto de rodamientos desgastados"},{"etapa":"despues","descripcion":"Video de la bomba operando sin vibración"}]'::jsonb,
 '["Rodamientos de reemplazo (motor y/o bomba)","Grasa para rodamientos","Acoplamiento flexible (si dañado por vibración)"]'::jsonb),

('bomba_agua_helada', 'Motor quemado / Amperaje excesivo',
 'Motor de la bomba no arranca o se dispara al arrancar. Olor a quemado. Amperaje excesivo en una o más fases. Resistencia de aislamiento baja (megóhmetro). Posible falla por sobre-carga, bajo voltaje, desbalance de fases, o falta de lubricación.',
 '[{"etapa":"antes","descripcion":"Foto del motor que no opera"},{"etapa":"durante","descripcion":"Foto de lectura de resistencia de aislamiento"},{"etapa":"despues","descripcion":"Foto del motor nuevo instalado y operando"}]'::jsonb,
 '["Motor de reemplazo (según HP, RPM, voltaje y frame)","Acoplamiento flexible","Rodamientos"]'::jsonb),

('bomba_agua_helada', 'Desalineación motor-bomba',
 'Vibración excesiva localizada en el acoplamiento. Desgaste prematuro del inserto del acoplamiento flexible. Ruido mecánico en zona del acoplamiento. Fuga prematura de sello mecánico. Causada por asentamiento de base, movimiento por vibración, o instalación incorrecta.',
 '[{"etapa":"antes","descripcion":"Foto del acoplamiento desgastado"},{"etapa":"durante","descripcion":"Foto del proceso de alineación con láser o regla"},{"etapa":"despues","descripcion":"Foto del acoplamiento nuevo y alineación verificada"}]'::jsonb,
 '["Inserto de acoplamiento flexible de reemplazo","Lainas (shims) para alineación","Acoplamiento completo (si dañado)"]'::jsonb),

('bomba_agua_helada', 'Bajo flujo / Bomba cavitando',
 'Flujo de agua insuficiente en el sistema. Presión de descarga baja. Ruido de cavitación (como grava o piedras dentro de la bomba). Presión de succión muy baja o negativa. Posible filtro de succión obstruido, válvula de succión parcialmente cerrada, aire atrapado en la bomba, o impulsor desgastado.',
 '[{"etapa":"antes","descripcion":"Foto de lectura de presión de succión (muy baja)"},{"etapa":"antes","descripcion":"Foto de lectura de presión de descarga"},{"etapa":"durante","descripcion":"Foto del impulsor (si se desmonta) o filtro obstruido"},{"etapa":"despues","descripcion":"Foto de presiones normales después de reparación"}]'::jsonb,
 '["Filtro de succión (strainer)","Impulsor de reemplazo (si desgastado)","Válvula de purga de aire","Empaques"]'::jsonb),

('bomba_agua_helada', 'Falla eléctrica / Contactor o protección térmica',
 'Bomba no arranca. Contactor no cierra o contactos quemados/soldados. Protección térmica (overload) disparada repetidamente. Posible cortocircuito en cableado, falla a tierra del motor, o VFD con error. Breaker se dispara al intentar arrancar.',
 '[{"etapa":"antes","descripcion":"Foto del contactor o protección térmica dañada"},{"etapa":"durante","descripcion":"Foto de lectura de amperaje de arranque"},{"etapa":"despues","descripcion":"Foto del componente eléctrico reemplazado y bomba operando"}]'::jsonb,
 '["Contactor de reemplazo","Protección térmica (overload) de reemplazo","Breaker","Cableado eléctrico"]'::jsonb);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- SELECT tipo_equipo_slug, tipo_mantenimiento, count(*) FROM plantillas_pasos WHERE tipo_equipo_slug = 'bomba_agua_helada' GROUP BY 1, 2;
-- Expected: bomba_agua_helada/preventivo: 8
--
-- SELECT tipo_equipo_slug, count(*) FROM fallas_correctivas WHERE tipo_equipo_slug = 'bomba_agua_helada' GROUP BY 1;
-- Expected: bomba_agua_helada: 6
-- ============================================================================
