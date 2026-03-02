-- ============================================================================
-- OMLEB HVAC — Seed: Fan Coil Guided Maintenance Workflow Templates
-- ============================================================================
-- Run this AFTER migration-workflows.sql in Supabase SQL Editor.
-- Seeds 1 equipment type, 10 preventive steps, and 11 corrective issues.
--
-- Data source: HVAC Fan Coil Maintenance Best Practices
-- Equipment type: Fan Coil (chilled water)
-- ============================================================================

-- ============================================================================
-- EQUIPMENT TYPE: FAN COIL
-- ============================================================================

INSERT INTO public.tipos_equipo (slug, nombre, is_system)
VALUES ('fan_coil', 'Fan Coil', true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PREVENTIVE: FAN COIL (10 steps)
-- ============================================================================

INSERT INTO public.plantillas_pasos (tipo_equipo_slug, tipo_mantenimiento, orden, nombre, procedimiento, evidencia_requerida, lecturas_requeridas, es_obligatorio) VALUES

('fan_coil', 'preventivo', 1, 'Seguridad: Desenergizar equipo y Lock-Out/Tag-Out',
 'Apagar el equipo desde el termostato o control local. Apagar el interruptor termomagnético (breaker) del circuito. Verificar ausencia de voltaje con multímetro. Cerrar válvulas de aislamiento de agua helada. Aplicar procedimiento Lock-Out/Tag-Out.',
 '[{"etapa":"antes","descripcion":"Foto del equipo encendido y en operación"},{"etapa":"antes","descripcion":"Foto del breaker en posición ON"},{"etapa":"despues","descripcion":"Foto del breaker en OFF con etiqueta de seguridad"},{"etapa":"despues","descripcion":"Foto de válvulas de agua cerradas"}]'::jsonb,
 '[{"nombre":"Voltaje en terminales","unidad":"V","rango_min":0,"rango_max":0}]'::jsonb,
 true),

('fan_coil', 'preventivo', 2, 'Inspección visual general',
 'Examinar gabinete exterior por daños, corrosión, manchas de agua o decoloración. Verificar que el equipo esté bien montado y nivelado. Revisar que no haya obstrucciones en las rejillas de suministro y retorno. Inspeccionar estado general de pintura y acabados.',
 '[{"etapa":"antes","descripcion":"Foto general frontal del equipo"},{"etapa":"antes","descripcion":"Foto de cualquier daño visible, corrosión o anomalía"},{"etapa":"antes","descripcion":"Foto de rejillas de suministro y retorno"}]'::jsonb,
 '[]'::jsonb,
 true),

('fan_coil', 'preventivo', 3, 'Inspección y reemplazo de filtros de aire',
 'Retirar los filtros de aire del gabinete. Inspeccionar por acumulación de polvo, roturas o deformación. Lavar con agua tibia y jabón neutro si son reutilizables. Dejar secar completamente antes de reinstalar. Reemplazar si están dañados o si son desechables y superan su vida útil.',
 '[{"etapa":"antes","descripcion":"Foto de filtros sucios instalados"},{"etapa":"durante","descripcion":"Foto de filtros retirados mostrando acumulación de suciedad"},{"etapa":"despues","descripcion":"Foto de filtros limpios o nuevos reinstalados"}]'::jsonb,
 '[]'::jsonb,
 true),

('fan_coil', 'preventivo', 4, 'Inspección y limpieza del ventilador y motor',
 'Inspeccionar aspas del ventilador por acumulación de polvo y suciedad. Limpiar aspas con cepillo suave y aspiradora. Verificar que el ventilador gire libremente sin roces ni vibraciones. Revisar estado de baleros/rodamientos del motor. Medir amperaje del motor y comparar con datos de placa. Medir voltaje de alimentación.',
 '[{"etapa":"antes","descripcion":"Foto del ventilador mostrando condición"},{"etapa":"despues","descripcion":"Foto del ventilador limpio"},{"etapa":"durante","descripcion":"Foto de lectura de amperaje del motor"},{"etapa":"durante","descripcion":"Foto de lectura de voltaje"}]'::jsonb,
 '[{"nombre":"Amperaje motor","unidad":"A","rango_min":null,"rango_max":null},{"nombre":"Voltaje alimentación","unidad":"V","rango_min":187,"rango_max":253}]'::jsonb,
 true),

('fan_coil', 'preventivo', 5, 'Inspección y limpieza del serpentín de enfriamiento',
 'Inspeccionar serpentín por acumulación de polvo, pelusa y suciedad. Verificar paso de luz a través de las aletas con linterna. Aspirar con cepillo suave para remover polvo suelto. Aplicar limpiador espumante no ácido si hay acumulación significativa. Enjuagar con agua a baja presión. Peinar aletas dobladas con peine de aletas (fin comb).',
 '[{"etapa":"antes","descripcion":"Foto del serpentín sucio (con linterna mostrando obstrucción)"},{"etapa":"durante","descripcion":"Foto de la aplicación de limpiador o aspirado"},{"etapa":"despues","descripcion":"Foto del serpentín limpio con luz pasando a través"}]'::jsonb,
 '[]'::jsonb,
 true),

('fan_coil', 'preventivo', 6, 'Inspección y limpieza de charola de condensado y línea de drenaje',
 'Inspeccionar charola de condensados por agua estancada, lodo, algas u hongos. Limpiar charola con solución de cloro diluido o limpiador antibacterial. Colocar tableta bactericida en charola. Verificar que la línea de drenaje no esté obstruida. Soplar con nitrógeno o aire comprimido para destapar si es necesario. Aplicar solución de vinagre/cloro en línea de drenaje. Verificar flujo libre de agua. Inspeccionar por signos de corrosión o deterioro.',
 '[{"etapa":"antes","descripcion":"Foto de la charola mostrando condición (sucia/limpia)"},{"etapa":"durante","descripcion":"Foto de la limpieza y destape de drenaje"},{"etapa":"despues","descripcion":"Foto de charola limpia con tableta bactericida colocada"},{"etapa":"despues","descripcion":"Foto verificando flujo libre de drenaje"}]'::jsonb,
 '[]'::jsonb,
 true),

('fan_coil', 'preventivo', 7, 'Verificación de termostato, válvula de 3 vías y actuador',
 'Verificar operación del termostato o control de temperatura. Confirmar que el set point sea correcto. Inspeccionar válvula de 3 vías por fugas o goteos. Verificar que el actuador abra y cierre correctamente al variar el set point. Verificar señal de control al actuador. Confirmar que el flujo de agua helada se regule proporcionalmente.',
 '[{"etapa":"durante","descripcion":"Foto del termostato mostrando set point"},{"etapa":"durante","descripcion":"Foto de la válvula de 3 vías y actuador"},{"etapa":"durante","descripcion":"Foto del actuador en posición abierta y cerrada"}]'::jsonb,
 '[]'::jsonb,
 true),

('fan_coil', 'preventivo', 8, 'Inspección de tubería de agua helada y válvulas de aislamiento',
 'Inspeccionar tuberías de entrada y salida de agua helada por fugas o condensación. Verificar estado del aislamiento térmico de tuberías. Operar válvulas de aislamiento (abrir y cerrar) para confirmar funcionamiento. Verificar empaques y conexiones. Inspeccionar por corrosión o deterioro en válvulas y accesorios.',
 '[{"etapa":"antes","descripcion":"Foto de las tuberías de agua helada y su aislamiento"},{"etapa":"antes","descripcion":"Foto de las válvulas de aislamiento"},{"etapa":"antes","descripcion":"Foto de cualquier fuga, condensación o daño en aislamiento"}]'::jsonb,
 '[]'::jsonb,
 true),

('fan_coil', 'preventivo', 9, 'Verificación de flujo de aire y temperaturas',
 'Energizar el equipo temporalmente para mediciones. Abrir válvulas de agua helada. Medir temperatura del aire de suministro en la rejilla de salida. Medir temperatura del aire de retorno en la rejilla de entrada. Medir temperatura del agua de entrada al serpentín. Medir temperatura del agua de salida del serpentín. Verificar que el diferencial de temperatura del aire sea adecuado. Verificar flujo de aire uniforme en todas las salidas.',
 '[{"etapa":"durante","descripcion":"Foto de lectura de temperatura de aire de suministro"},{"etapa":"durante","descripcion":"Foto de lectura de temperatura de aire de retorno"},{"etapa":"durante","descripcion":"Foto de lectura de temperatura de agua de entrada"},{"etapa":"durante","descripcion":"Foto de lectura de temperatura de agua de salida"}]'::jsonb,
 '[{"nombre":"Temp. aire suministro","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temp. aire retorno","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temp. agua entrada","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temp. agua salida","unidad":"°C","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('fan_coil', 'preventivo', 10, 'Re-energización, prueba operacional y documentación',
 'Restaurar energía eléctrica al equipo. Abrir válvulas de agua helada completamente. Encender equipo desde termostato y verificar arranque normal. Verificar operación del ventilador en todas las velocidades disponibles. Confirmar que el actuador y la válvula de 3 vías respondan al termostato. Monitorear operación por 10-15 minutos. Verificar ausencia de ruidos anormales, vibraciones o fugas. Cerrar paneles y dejar equipo en operación normal.',
 '[{"etapa":"despues","descripcion":"Foto del equipo cerrado y en operación normal"},{"etapa":"despues","descripcion":"Video de 10-15 segundos del equipo funcionando"},{"etapa":"despues","descripcion":"Foto del termostato mostrando temperatura alcanzada"}]'::jsonb,
 '[]'::jsonb,
 true);

-- ============================================================================
-- CORRECTIVE: FAN COIL (11 common issues)
-- ============================================================================

INSERT INTO public.fallas_correctivas (tipo_equipo_slug, nombre, diagnostico, evidencia_requerida, materiales_tipicos) VALUES

('fan_coil', 'Motor de ventilador no arranca',
 'Ventilador no gira al encender el equipo. Sin flujo de aire. Posible falla de motor, capacitor, o conexión eléctrica. Verificar voltaje en terminales del motor, estado del capacitor, y continuidad del cableado.',
 '[{"etapa":"antes","descripcion":"Foto del motor sin funcionar"},{"etapa":"antes","descripcion":"Foto de lectura de voltaje en terminales"},{"etapa":"durante","descripcion":"Foto de lectura de amperaje o resistencia del motor"},{"etapa":"despues","descripcion":"Foto del motor nuevo instalado y funcionando"}]'::jsonb,
 '["Motor de ventilador de reemplazo","Capacitor de reemplazo","Cable eléctrico","Terminales"]'::jsonb),

('fan_coil', 'Exceso de vibración o ruido en ventilador',
 'Ruido anormal de vibración, traqueteo, rozamiento o chirrido durante operación. Puede ser causado por aspas desbalanceadas, baleros desgastados, tornillería floja o acumulación de suciedad en el ventilador.',
 '[{"etapa":"antes","descripcion":"Video mostrando la vibración y el ruido anormal"},{"etapa":"antes","descripcion":"Foto de cualquier componente suelto o dañado"},{"etapa":"despues","descripcion":"Video del equipo funcionando sin ruido después de reparación"}]'::jsonb,
 '["Baleros/rodamientos de reemplazo","Tornillería","Bases antivibratorias","Aspas de ventilador (si están dañadas)"]'::jsonb),

('fan_coil', 'Unidad no enfría adecuadamente',
 'El equipo opera pero no alcanza la temperatura deseada. Flujo de aire tibio o insuficiente. Posibles causas: filtros sucios, serpentín obstruido, bajo flujo de agua helada, válvula de 3 vías no abre, actuador defectuoso, o temperatura de agua helada fuera de rango.',
 '[{"etapa":"antes","descripcion":"Foto de lectura de temperatura de aire de suministro"},{"etapa":"antes","descripcion":"Foto de lectura de temperatura de agua de entrada"},{"etapa":"durante","descripcion":"Foto de filtros o serpentín si están sucios"},{"etapa":"durante","descripcion":"Foto de la válvula de 3 vías y actuador"},{"etapa":"despues","descripcion":"Foto de temperaturas normales después de reparación"}]'::jsonb,
 '["Filtros de reemplazo","Limpiador de serpentín","Actuador de reemplazo","Válvula de 3 vías de reemplazo"]'::jsonb),

('fan_coil', 'Fuga de agua en charola de condensado',
 'Agua goteando del equipo o charola de condensados desbordándose. Manchas de agua en techo, pared o piso debajo del equipo. Puede ser causado por charola dañada, corroída, desnivelada, o drenaje obstruido.',
 '[{"etapa":"antes","descripcion":"Foto de la fuga de agua visible"},{"etapa":"antes","descripcion":"Foto de la charola mostrando daño o acumulación"},{"etapa":"antes","descripcion":"Foto de manchas de agua en techo o pared"},{"etapa":"despues","descripcion":"Foto de charola reparada o reemplazada sin fuga"}]'::jsonb,
 '["Charola de condensado de reemplazo","Sellador","Tabletas bactericidas","Kit de limpieza de drenaje"]'::jsonb),

('fan_coil', 'Filtro obstruido o dañado',
 'Filtro de aire con acumulación excesiva de polvo, pelusa o suciedad. Filtro roto, deformado o colapsado. Causa reducción de flujo de aire, disminución de eficiencia y posible congelamiento del serpentín.',
 '[{"etapa":"antes","descripcion":"Foto del filtro obstruido o dañado"},{"etapa":"antes","descripcion":"Foto mostrando la acumulación de suciedad"},{"etapa":"despues","descripcion":"Foto del filtro nuevo instalado"}]'::jsonb,
 '["Filtros de aire de reemplazo (según dimensiones del equipo)"]'::jsonb),

('fan_coil', 'Serpentín congelado',
 'Serpentín de enfriamiento cubierto de hielo o escarcha. Flujo de aire muy reducido o nulo. Agua excesiva al descongelar. Puede indicar filtro sucio, bajo flujo de aire, temperatura de agua helada muy baja, o falla en control de temperatura.',
 '[{"etapa":"antes","descripcion":"Foto del serpentín congelado"},{"etapa":"durante","descripcion":"Foto durante el proceso de descongelamiento"},{"etapa":"despues","descripcion":"Foto del serpentín descongelado y limpio"}]'::jsonb,
 '["Limpiador de serpentín","Filtros de reemplazo","Termostato de reemplazo (si aplica)"]'::jsonb),

('fan_coil', 'Válvula de 3 vías no opera correctamente',
 'Válvula no abre o no cierra completamente. Flujo de agua helada no se regula. Equipo enfría constantemente o no enfría. Fuga por el cuerpo o empaques de la válvula. Vástago trabado o corroído.',
 '[{"etapa":"antes","descripcion":"Foto de la válvula de 3 vías"},{"etapa":"antes","descripcion":"Foto de cualquier fuga visible"},{"etapa":"durante","descripcion":"Foto de la válvula desmontada o del vástago"},{"etapa":"despues","descripcion":"Foto de la válvula nueva o reparada instalada"}]'::jsonb,
 '["Válvula de 3 vías de reemplazo (según diámetro y conexión)","Empaques","Adaptadores","Teflón"]'::jsonb),

('fan_coil', 'Actuador defectuoso',
 'Actuador no responde a la señal del termostato. Vástago del actuador no se mueve. Posición del actuador no corresponde con la demanda de enfriamiento. Motor del actuador quemado o trabado.',
 '[{"etapa":"antes","descripcion":"Foto del actuador sin responder"},{"etapa":"antes","descripcion":"Foto de lectura de señal de control"},{"etapa":"despues","descripcion":"Foto del actuador nuevo instalado y funcionando"}]'::jsonb,
 '["Actuador de reemplazo (según modelo y señal de control)","Cableado de control"]'::jsonb),

('fan_coil', 'Fuga en tubería de agua helada',
 'Fuga visible de agua en conexiones, uniones o tubería. Charcos de agua debajo o alrededor del equipo. Aislamiento húmedo o dañado. Presión del sistema de agua bajando. Corrosión en accesorios o válvulas.',
 '[{"etapa":"antes","descripcion":"Foto de la fuga de agua visible"},{"etapa":"antes","descripcion":"Foto de la conexión o tubería dañada"},{"etapa":"antes","descripcion":"Foto del aislamiento húmedo o dañado"},{"etapa":"despues","descripcion":"Foto de la reparación completada sin fuga"}]'::jsonb,
 '["Empaques y sellos","Tubería/accesorios de reemplazo","Soldadura o conectores","Aislamiento térmico","Teflón","Herramienta de plomería"]'::jsonb),

('fan_coil', 'Termostato no responde',
 'Termostato no enciende o pantalla apagada. No envía señal al equipo. Lectura de temperatura incorrecta. Equipo no responde a cambios de set point. Posible falla de baterías, cableado o del termostato mismo.',
 '[{"etapa":"antes","descripcion":"Foto del termostato sin funcionar o con error"},{"etapa":"antes","descripcion":"Foto del cableado del termostato"},{"etapa":"despues","descripcion":"Foto del termostato nuevo o reparado funcionando"}]'::jsonb,
 '["Termostato de reemplazo (según modelo y compatibilidad)","Baterías","Cable de control","Transformador (si aplica)"]'::jsonb),

('fan_coil', 'Drenaje obstruido / desbordamiento',
 'Línea de drenaje tapada por lodo, algas o biofilm. Charola de condensados se desborda. Agua goteando del equipo. Olor a humedad o moho proveniente del equipo. Puede causar daños a techo, pared o mobiliario.',
 '[{"etapa":"antes","descripcion":"Foto de la charola desbordada o agua goteando"},{"etapa":"antes","descripcion":"Foto de la línea de drenaje obstruida"},{"etapa":"durante","descripcion":"Foto del proceso de destape y limpieza"},{"etapa":"despues","descripcion":"Foto del drenaje limpio con flujo libre verificado"}]'::jsonb,
 '["Kit de limpieza de drenaje","Bomba de vacío para drenaje","Tabletas bactericidas","Solución de cloro/vinagre","Nitrógeno o aire comprimido"]'::jsonb);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run these queries to verify the seed was applied correctly:
--
-- SELECT slug, nombre FROM tipos_equipo WHERE slug = 'fan_coil';
-- Expected: 1 row (fan_coil, Fan Coil)
--
-- SELECT tipo_equipo_slug, tipo_mantenimiento, count(*) FROM plantillas_pasos WHERE tipo_equipo_slug = 'fan_coil' GROUP BY 1, 2;
-- Expected: fan_coil/preventivo: 10
--
-- SELECT tipo_equipo_slug, count(*) FROM fallas_correctivas WHERE tipo_equipo_slug = 'fan_coil' GROUP BY 1;
-- Expected: fan_coil: 11
--
-- Total counts after all seeds:
-- SELECT tipo_equipo_slug, tipo_mantenimiento, count(*) FROM plantillas_pasos GROUP BY 1, 2 ORDER BY 1, 2;
-- Expected: mini_split_interior/preventivo: 13, mini_split_exterior/preventivo: 10, mini_chiller/preventivo: 14, fan_coil/preventivo: 10
--
-- SELECT tipo_equipo_slug, count(*) FROM fallas_correctivas GROUP BY 1 ORDER BY 1;
-- Expected: mini_split_interior: 10, mini_split_exterior: 5, mini_chiller: 12, fan_coil: 11
--
-- SELECT count(*) FROM tipos_equipo;
-- Expected: 5 (mini_split_interior, mini_split_exterior, mini_chiller, otro, fan_coil)
-- ============================================================================
