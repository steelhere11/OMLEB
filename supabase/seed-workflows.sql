-- ============================================================================
-- OMLEB HVAC — Seed: Guided Maintenance Workflow Templates
-- ============================================================================
-- Run this AFTER migration-workflows.sql in Supabase SQL Editor.
-- Seeds plantillas_pasos (37 PM steps) and fallas_correctivas (27 issues).
--
-- Data source: HVAC Maintenance Workflow Manual (Feb 2026)
-- Equipment types: Mini Split Interior, Mini Split Exterior, Mini Chiller
-- ============================================================================

-- ============================================================================
-- PREVENTIVE: MINI SPLIT INTERIOR (13 steps)
-- ============================================================================

INSERT INTO public.plantillas_pasos (tipo_equipo_slug, tipo_mantenimiento, orden, nombre, procedimiento, evidencia_requerida, lecturas_requeridas, es_obligatorio) VALUES

('mini_split_interior', 'preventivo', 1, 'Seguridad: Desenergizar equipo',
 'Apagar el equipo desde el control remoto. Apagar el interruptor termomagnético (breaker) del circuito. Verificar ausencia de voltaje con multímetro. Aplicar procedimiento Lock-Out/Tag-Out si aplica.',
 '[{"etapa":"antes","descripcion":"Foto del equipo encendido y funcionando"},{"etapa":"antes","descripcion":"Foto del breaker en posición ON"},{"etapa":"despues","descripcion":"Foto del breaker en OFF"},{"etapa":"despues","descripcion":"Foto de la etiqueta de seguridad colocada"}]'::jsonb,
 '[{"nombre":"Voltaje en terminales","unidad":"V","rango_min":0,"rango_max":0}]'::jsonb,
 true),

-- Updated for Phase 8: placa/nameplate data moved to registration phase
('mini_split_interior', 'preventivo', 2, 'Inspección visual general de la unidad interior',
 'Examinar carcasa exterior por daños, manchas de agua, decoloración. Verificar que el equipo esté bien montado y nivelado. Revisar que no haya obstrucciones en el flujo de aire.',
 '[{"etapa":"antes","descripcion":"Foto general frontal del equipo"},{"etapa":"antes","descripcion":"Foto de cualquier daño visible o anomalía"}]'::jsonb,
 '[]'::jsonb,
 true),

('mini_split_interior', 'preventivo', 3, 'Retiro y limpieza de filtros de aire',
 'Retirar los filtros deslizándolos del marco. Inspeccionar por roturas, deformación o acumulación excesiva. Lavar con agua tibia y jabón neutro. Dejar secar completamente antes de reinstalar. Reemplazar si están dañados.',
 '[{"etapa":"antes","descripcion":"Foto de filtros sucios instalados"},{"etapa":"durante","descripcion":"Foto de filtros retirados mostrando suciedad"},{"etapa":"despues","descripcion":"Foto de filtros limpios y secos antes de reinstalar"}]'::jsonb,
 '[]'::jsonb,
 true),

('mini_split_interior', 'preventivo', 4, 'Apertura de carcasa y acceso a componentes internos',
 'Retirar la cubierta frontal (clips o tornillos según modelo). Retirar panel de louvers/aspas si aplica. Proteger componentes electrónicos y pared con plástico/bolsa de limpieza (Clean Guard/bib kit).',
 '[{"etapa":"durante","descripcion":"Foto del equipo abierto mostrando serpentín y turbina expuestos"},{"etapa":"durante","descripcion":"Foto de la protección colocada (plástico, cubeta)"}]'::jsonb,
 '[]'::jsonb,
 true),

('mini_split_interior', 'preventivo', 5, 'Limpieza del serpentín evaporador (coil)',
 'Inspección visual con linterna: verificar paso de luz a través de las aletas. Aplicar aspiradora con cepillo suave para remover polvo suelto. Aplicar limpiador espumante no ácido (pH neutro) de abajo hacia arriba. Dejar actuar 5-10 minutos. Enjuagar con agua a baja presión (125-200 PSI) de adentro hacia afuera. Peinar aletas dobladas con peine de aletas (fin comb).',
 '[{"etapa":"antes","descripcion":"Foto del serpentín sucio (con linterna mostrando obstrucción)"},{"etapa":"durante","descripcion":"Foto de la aplicación de espuma limpiadora"},{"etapa":"despues","descripcion":"Foto del serpentín limpio con luz pasando a través"}]'::jsonb,
 '[]'::jsonb,
 true),

('mini_split_interior', 'preventivo', 6, 'Limpieza de turbina/ventilador (blower wheel)',
 'Inspeccionar aspas por acumulación de polvo y biofilm. Limpiar con cepillo suave y aspiradora. Aplicar limpiador espumante en aspas si hay acumulación severa. Enjuagar con baja presión. Verificar que gire libre y balanceada (sin roces ni vibraciones).',
 '[{"etapa":"antes","descripcion":"Foto de la turbina sucia con acumulación visible"},{"etapa":"despues","descripcion":"Foto de la turbina limpia"}]'::jsonb,
 '[]'::jsonb,
 true),

('mini_split_interior', 'preventivo', 7, 'Limpieza de charola de condensados (drain pan)',
 'Inspeccionar charola por agua estancada, lodo, algas u hongos. Limpiar con solución de cloro diluido o limpiador antibacterial. Colocar tableta bactericida/Gel Tab en charola. Verificar que la charola esté nivelada y drenando correctamente.',
 '[{"etapa":"antes","descripcion":"Foto de la charola mostrando condición (sucia/limpia)"},{"etapa":"despues","descripcion":"Foto de charola limpia con tableta colocada"}]'::jsonb,
 '[]'::jsonb,
 true),

('mini_split_interior', 'preventivo', 8, 'Limpieza y verificación de línea de drenaje (condensate drain)',
 'Verificar que la línea de drenaje no esté obstruida. Soplar con nitrógeno o aire comprimido para destapar. Aplicar solución de vinagre/cloro para prevenir algas. Verificar flujo libre de agua a través de la línea. Inspeccionar aislamiento de la línea.',
 '[{"etapa":"antes","descripcion":"Foto de la salida de drenaje"},{"etapa":"durante","descripcion":"Foto de la limpieza/destape"},{"etapa":"despues","descripcion":"Foto verificando flujo de agua libre"}]'::jsonb,
 '[]'::jsonb,
 true),

('mini_split_interior', 'preventivo', 9, 'Inspección de conexiones eléctricas internas',
 'Revisar conexiones de terminales por corrosión, aflojamiento o daño. Apretar conexiones sueltas. Verificar estado del cableado (sin quemaduras, pelados, o deterioro). Inspeccionar la tarjeta de control (PCB) por componentes quemados o dañados.',
 '[{"etapa":"antes","descripcion":"Foto del panel eléctrico interior"},{"etapa":"despues","descripcion":"Foto después de apretar conexiones"},{"etapa":"despues","descripcion":"Foto de cualquier daño encontrado"}]'::jsonb,
 '[{"nombre":"Voltaje terminales alimentación","unidad":"V","rango_min":187,"rango_max":253}]'::jsonb,
 true),

('mini_split_interior', 'preventivo', 10, 'Verificación del motor del ventilador (fan motor)',
 'Verificar que el motor arranque sin ruido anormal. Escuchar por rozamientos, vibraciones o chirridos. Revisar estado de baleros/rodamientos. Medir amperaje del motor y comparar con RLA de placa.',
 '[{"etapa":"durante","descripcion":"Video corto del motor en funcionamiento (para captar sonido)"},{"etapa":"durante","descripcion":"Foto de la lectura de amperaje"}]'::jsonb,
 '[{"nombre":"Amperaje motor ventilador","unidad":"A","rango_min":null,"rango_max":null},{"nombre":"RLA de placa","unidad":"A","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('mini_split_interior', 'preventivo', 11, 'Verificación del sensor de temperatura',
 'Inspeccionar sensor por daño físico o desplazamiento. Limpiar sensor con paño suave. Verificar lectura de temperatura comparando con termómetro de referencia.',
 '[{"etapa":"durante","descripcion":"Foto del sensor en su posición"},{"etapa":"durante","descripcion":"Foto de lectura de temperatura comparativa"}]'::jsonb,
 '[{"nombre":"Temperatura sensor","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temperatura referencia","unidad":"°C","rango_min":null,"rango_max":null}]'::jsonb,
 false),

('mini_split_interior', 'preventivo', 12, 'Inspección de louvers/aspas de dirección de aire',
 'Verificar que las aspas se muevan libremente en todas las direcciones. Limpiar aspas con paño húmedo. Verificar funcionamiento del motor del louver. Verificar que no haya roturas o deformación.',
 '[{"etapa":"despues","descripcion":"Foto de louvers limpios y en posición correcta"}]'::jsonb,
 '[]'::jsonb,
 false),

('mini_split_interior', 'preventivo', 13, 'Reensamble y prueba de operación interior',
 'Reinstalar filtros limpios y secos. Reinstalar carcasa y cubiertas. Verificar que todos los clips y tornillos estén colocados. Encender equipo y verificar flujo de aire.',
 '[{"etapa":"despues","descripcion":"Foto del equipo reensamblado y en operación"},{"etapa":"despues","descripcion":"Video de 10 segundos del equipo funcionando"}]'::jsonb,
 '[]'::jsonb,
 true);

-- ============================================================================
-- PREVENTIVE: MINI SPLIT EXTERIOR (10 steps)
-- ============================================================================

INSERT INTO public.plantillas_pasos (tipo_equipo_slug, tipo_mantenimiento, orden, nombre, procedimiento, evidencia_requerida, lecturas_requeridas, es_obligatorio) VALUES

-- Updated for Phase 8: placa/nameplate data moved to registration phase
('mini_split_exterior', 'preventivo', 1, 'Inspección visual de la unidad exterior (condensador)',
 'Examinar carcasa por daños, corrosión, óxido. Verificar que la base/soporte esté nivelada y firme. Verificar mínimo 60 cm de espacio libre alrededor para flujo de aire. Remover hojas, basura, tierra y vegetación del área circundante.',
 '[{"etapa":"antes","descripcion":"Foto general de la unidad exterior y su entorno"},{"etapa":"antes","descripcion":"Foto de cualquier daño o corrosión visible"}]'::jsonb,
 '[]'::jsonb,
 true),

('mini_split_exterior', 'preventivo', 2, 'Limpieza del serpentín condensador (condenser coil)',
 'Inspeccionar aletas por acumulación de polvo, tierra, hojas. Aplicar limpiador para serpentines de condensador. Dejar actuar 5-10 minutos. Enjuagar con manguera de jardín (no hidrolavadora) de adentro hacia afuera. Peinar aletas dobladas con peine de aletas.',
 '[{"etapa":"antes","descripcion":"Foto del serpentín sucio"},{"etapa":"durante","descripcion":"Foto de la aplicación de limpiador"},{"etapa":"despues","descripcion":"Foto del serpentín limpio con aletas rectas"}]'::jsonb,
 '[]'::jsonb,
 true),

('mini_split_exterior', 'preventivo', 3, 'Inspección y limpieza del ventilador del condensador',
 'Inspeccionar aspas del ventilador por daño, grietas o suciedad. Limpiar aspas con paño húmedo. Verificar que gire libremente sin roces. Verificar estado de los baleros del motor. Medir amperaje del motor del ventilador.',
 '[{"etapa":"antes","descripcion":"Foto del ventilador"},{"etapa":"despues","descripcion":"Foto del ventilador limpio"},{"etapa":"durante","descripcion":"Foto de la lectura de amperaje"}]'::jsonb,
 '[{"nombre":"Amperaje motor ventilador","unidad":"A","rango_min":null,"rango_max":null},{"nombre":"RLA de placa","unidad":"A","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('mini_split_exterior', 'preventivo', 4, 'Inspección eléctrica de la unidad exterior',
 'Verificar desconexión eléctrica principal (disconnect). Inspeccionar y apretar todas las conexiones eléctricas. Verificar estado del contactor (sin picaduras ni quemaduras). Medir y registrar capacitancia del capacitor de arranque y marcha. Verificar voltaje de alimentación (debe estar dentro del ±10% del nominal).',
 '[{"etapa":"durante","descripcion":"Foto del panel eléctrico abierto"},{"etapa":"durante","descripcion":"Foto del contactor"},{"etapa":"durante","descripcion":"Foto de la lectura del capacitor"},{"etapa":"durante","descripcion":"Foto de la lectura de voltaje"}]'::jsonb,
 '[{"nombre":"Voltaje L1-L2","unidad":"V","rango_min":187,"rango_max":253},{"nombre":"Capacitor µF medido","unidad":"µF","rango_min":null,"rango_max":null},{"nombre":"Capacitor µF nominal","unidad":"µF","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('mini_split_exterior', 'preventivo', 5, 'Verificación del compresor',
 'Medir amperaje de operación del compresor. Comparar con RLA (Running Load Amps) de la placa. Verificar que no haya vibración excesiva. Escuchar por ruidos anormales (golpeteo, chasquidos). Verificar temperatura del cuerpo del compresor (no debe superar 90°C).',
 '[{"etapa":"durante","descripcion":"Foto/video del compresor en operación"},{"etapa":"durante","descripcion":"Foto de la lectura de amperaje"},{"etapa":"durante","descripcion":"Foto de la lectura de temperatura del cuerpo"}]'::jsonb,
 '[{"nombre":"Amperaje compresor","unidad":"A","rango_min":null,"rango_max":null},{"nombre":"RLA de placa","unidad":"A","rango_min":null,"rango_max":null},{"nombre":"Temperatura cuerpo compresor","unidad":"°C","rango_min":null,"rango_max":90}]'::jsonb,
 true),

('mini_split_exterior', 'preventivo', 6, 'Inspección de líneas de refrigerante (line set)',
 'Inspeccionar línea de succión (gruesa/fría) y línea de líquido (delgada/caliente). Verificar que el aislamiento térmico esté completo e intacto. Revisar conexiones flare por manchas de aceite (indicador de fuga). Verificar que no haya abolladuras ni dobleces en las tuberías.',
 '[{"etapa":"antes","descripcion":"Foto de las líneas de refrigerante mostrando condición del aislamiento"},{"etapa":"antes","descripcion":"Foto de conexiones flare"},{"etapa":"antes","descripcion":"Foto de cualquier mancha de aceite o daño"}]'::jsonb,
 '[]'::jsonb,
 true),

('mini_split_exterior', 'preventivo', 7, 'Verificación de carga de refrigerante (superheat/subcooling)',
 'Conectar manómetros al servicio de alta y baja presión. Dejar el sistema estabilizar 15-20 minutos en operación. Medir presión de succión (baja) y presión de descarga (alta). Medir temperatura de línea de succión con pinza de temperatura. Calcular sobrecalentamiento (superheat). Medir temperatura de línea de líquido. Calcular subenfriamiento (subcooling). Comparar valores con especificaciones del fabricante.',
 '[{"etapa":"durante","descripcion":"Foto de manómetros mostrando presiones"},{"etapa":"durante","descripcion":"Foto de las lecturas de temperatura de líneas"},{"etapa":"durante","descripcion":"Foto de la tabla de cálculo o app con valores de superheat/subcooling"}]'::jsonb,
 '[{"nombre":"Presión succión","unidad":"PSI","rango_min":110,"rango_max":130},{"nombre":"Presión descarga","unidad":"PSI","rango_min":275,"rango_max":400},{"nombre":"Temp. línea succión","unidad":"°F","rango_min":null,"rango_max":null},{"nombre":"Temp. línea líquido","unidad":"°F","rango_min":null,"rango_max":null},{"nombre":"Superheat calculado","unidad":"°F","rango_min":5,"rango_max":15},{"nombre":"Subcooling calculado","unidad":"°F","rango_min":8,"rango_max":14}]'::jsonb,
 true),

('mini_split_exterior', 'preventivo', 8, 'Detección de fugas de refrigerante',
 'Utilizar detector electrónico de fugas en todas las conexiones. Aplicar solución de burbujas en conexiones sospechosas. Inspeccionar visualmente por manchas de aceite. Registrar resultado: fuga encontrada/no encontrada.',
 '[{"etapa":"durante","descripcion":"Foto del proceso de detección de fugas"},{"etapa":"durante","descripcion":"Foto de cualquier fuga detectada (burbujas, aceite)"},{"etapa":"durante","descripcion":"Foto de lectura del detector electrónico"}]'::jsonb,
 '[{"nombre":"Fuga detectada","unidad":"Sí/No","rango_min":null,"rango_max":null},{"nombre":"Ubicación fuga","unidad":"texto","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('mini_split_exterior', 'preventivo', 9, 'Medición de temperaturas de operación (delta T)',
 'Medir temperatura del aire de suministro (salida del evaporador). Medir temperatura del aire de retorno (entrada del evaporador). Calcular diferencial de temperatura (delta T). El delta T debe estar entre 8-12°C (14-22°F) para enfriamiento.',
 '[{"etapa":"durante","descripcion":"Foto de la lectura de temperatura de suministro"},{"etapa":"durante","descripcion":"Foto de la lectura de temperatura de retorno"}]'::jsonb,
 '[{"nombre":"Temp. suministro","unidad":"°F","rango_min":null,"rango_max":null},{"nombre":"Temp. retorno","unidad":"°F","rango_min":null,"rango_max":null},{"nombre":"Delta T","unidad":"°F","rango_min":14,"rango_max":22}]'::jsonb,
 true),

('mini_split_exterior', 'preventivo', 10, 'Prueba completa de operación y cierre',
 'Encender el sistema y verificar operación en modo enfriamiento. Verificar que el control remoto funcione en todos los modos. Escuchar por ruidos anormales en ambas unidades. Verificar que no haya vibraciones excesivas. Dejar operando 15-20 minutos y verificar estabilidad. Cerrar paneles de ambas unidades.',
 '[{"etapa":"despues","descripcion":"Video de 15 segundos de ambas unidades en operación normal"},{"etapa":"despues","descripcion":"Foto del control remoto mostrando temperatura configurada"},{"etapa":"despues","descripcion":"Foto final de ambas unidades cerradas y operando"}]'::jsonb,
 '[{"nombre":"Temperatura ambiente final","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temperatura suministro final","unidad":"°C","rango_min":null,"rango_max":null}]'::jsonb,
 true);

-- ============================================================================
-- PREVENTIVE: MINI CHILLER (14 steps)
-- ============================================================================

INSERT INTO public.plantillas_pasos (tipo_equipo_slug, tipo_mantenimiento, orden, nombre, procedimiento, evidencia_requerida, lecturas_requeridas, es_obligatorio) VALUES

('mini_chiller', 'preventivo', 1, 'Seguridad: Desenergizar equipo y Lock-Out/Tag-Out',
 'Apagar el sistema desde el control principal/BMS. Apagar el interruptor termomagnético principal. Verificar ausencia de voltaje con multímetro. Aplicar candado y etiqueta de seguridad. En mini chillers con múltiples circuitos, verificar TODOS los circuitos.',
 '[{"etapa":"antes","descripcion":"Foto del equipo en operación"},{"etapa":"antes","descripcion":"Foto del panel eléctrico en ON"},{"etapa":"despues","descripcion":"Foto del breaker en OFF con etiqueta LOTO"}]'::jsonb,
 '[{"nombre":"Voltaje verificado","unidad":"V","rango_min":0,"rango_max":0}]'::jsonb,
 true),

-- Updated for Phase 8: placa/nameplate data moved to registration phase
('mini_chiller', 'preventivo', 2, 'Inspección visual general del chiller',
 'Examinar gabinete exterior por daños, corrosión, fugas de agua o aceite. Verificar que la base esté nivelada. Inspeccionar conexiones de tubería de agua (entrada y salida). Verificar estado de aislamiento de tuberías.',
 '[{"etapa":"antes","descripcion":"Foto panorámica del equipo"},{"etapa":"antes","descripcion":"Fotos de cada lado del equipo"},{"etapa":"antes","descripcion":"Foto de cualquier daño, corrosión o fuga"}]'::jsonb,
 '[]'::jsonb,
 true),

('mini_chiller', 'preventivo', 3, 'Inspección y limpieza de serpentines del condensador',
 'Inspeccionar serpentines por acumulación de polvo, tierra, hojas. Verificar aletas por deformación o corrosión. Aplicar limpiador especializado para serpentines. Enjuagar con manguera a presión moderada. Peinar aletas dobladas con peine de aletas. En chillers con múltiples secciones, limpiar TODAS.',
 '[{"etapa":"antes","descripcion":"Foto de cada sección de serpentín (sucio)"},{"etapa":"durante","descripcion":"Foto de aplicación de limpiador"},{"etapa":"despues","descripcion":"Foto de cada sección limpia con aletas rectas"}]'::jsonb,
 '[]'::jsonb,
 true),

('mini_chiller', 'preventivo', 4, 'Inspección y limpieza de ventiladores del condensador',
 'Inspeccionar cada ventilador por daño en aspas, suciedad. Verificar rodamientos por desgaste (ruido, juego). Limpiar aspas con paño y limpiador. Verificar que giren libremente. Medir amperaje de cada motor de ventilador.',
 '[{"etapa":"antes","descripcion":"Foto de cada ventilador"},{"etapa":"despues","descripcion":"Foto de ventiladores limpios"},{"etapa":"durante","descripcion":"Foto de lectura de amperaje por motor"}]'::jsonb,
 '[{"nombre":"Amperaje ventilador 1","unidad":"A","rango_min":null,"rango_max":null},{"nombre":"Amperaje ventilador 2","unidad":"A","rango_min":null,"rango_max":null},{"nombre":"RLA ventiladores","unidad":"A","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('mini_chiller', 'preventivo', 5, 'Inspección del circuito de agua (evaporador/intercambiador)',
 'Verificar temperatura de entrada y salida del agua. El diferencial debe estar entre 5-7°C (10-12°F). Inspeccionar tubería por fugas, corrosión, aislamiento dañado. Verificar presión del agua en el sistema. Verificar operación de la bomba de agua (si es parte del sistema). Verificar flujo de agua.',
 '[{"etapa":"durante","descripcion":"Foto de las conexiones de tubería de agua"},{"etapa":"durante","descripcion":"Foto de manómetros de presión de agua"},{"etapa":"durante","descripcion":"Foto de termómetros de entrada/salida de agua"},{"etapa":"durante","descripcion":"Foto de cualquier fuga detectada"}]'::jsonb,
 '[{"nombre":"Temp. entrada agua","unidad":"°F","rango_min":null,"rango_max":null},{"nombre":"Temp. salida agua","unidad":"°F","rango_min":null,"rango_max":null},{"nombre":"Delta T agua","unidad":"°F","rango_min":10,"rango_max":12},{"nombre":"Presión agua","unidad":"PSI","rango_min":null,"rango_max":null},{"nombre":"Flujo agua","unidad":"GPM","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('mini_chiller', 'preventivo', 6, 'Inspección eléctrica completa',
 'Abrir panel eléctrico principal. Inspeccionar y apretar TODAS las conexiones. Verificar estado de contactores (sin picaduras/quemaduras). Medir capacitores (run y start) de cada compresor. Verificar voltaje en las tres fases (trifásico: L1-L2, L2-L3, L1-L3). Verificar desbalance de voltaje (<2%). Inspeccionar cableado por daño o deterioro.',
 '[{"etapa":"durante","descripcion":"Foto del panel eléctrico abierto"},{"etapa":"durante","descripcion":"Foto de contactores"},{"etapa":"durante","descripcion":"Foto de lectura de capacitores"},{"etapa":"durante","descripcion":"Foto de lecturas de voltaje trifásico"}]'::jsonb,
 '[{"nombre":"Voltaje L1-L2","unidad":"V","rango_min":187,"rango_max":253},{"nombre":"Voltaje L2-L3","unidad":"V","rango_min":187,"rango_max":253},{"nombre":"Voltaje L1-L3","unidad":"V","rango_min":187,"rango_max":253},{"nombre":"Desbalance voltaje","unidad":"%","rango_min":0,"rango_max":2},{"nombre":"Capacitor 1 µF medido","unidad":"µF","rango_min":null,"rango_max":null},{"nombre":"Capacitor 1 µF nominal","unidad":"µF","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('mini_chiller', 'preventivo', 7, 'Verificación de compresores',
 'Medir amperaje de operación de cada compresor. Comparar con RLA de placa. Medir temperatura del cuerpo de cada compresor. Verificar vibración (no excesiva). Escuchar por ruidos anormales. Verificar que el calentador de cárter (crankcase heater) funcione (si aplica).',
 '[{"etapa":"durante","descripcion":"Foto de lectura de amperaje por compresor"},{"etapa":"durante","descripcion":"Foto de temperatura del cuerpo de cada compresor"},{"etapa":"durante","descripcion":"Video corto de compresores en operación (sonido)"}]'::jsonb,
 '[{"nombre":"Amperaje compresor 1","unidad":"A","rango_min":null,"rango_max":null},{"nombre":"RLA compresor 1","unidad":"A","rango_min":null,"rango_max":null},{"nombre":"Amperaje compresor 2","unidad":"A","rango_min":null,"rango_max":null},{"nombre":"RLA compresor 2","unidad":"A","rango_min":null,"rango_max":null},{"nombre":"Temp. cuerpo compresor 1","unidad":"°C","rango_min":null,"rango_max":90},{"nombre":"Temp. cuerpo compresor 2","unidad":"°C","rango_min":null,"rango_max":90}]'::jsonb,
 true),

('mini_chiller', 'preventivo', 8, 'Verificación de carga de refrigerante por circuito',
 'Conectar manómetros a cada circuito de refrigerante. Estabilizar sistema 15-20 min. Medir presiones de alta y baja por circuito. Calcular superheat y subcooling por circuito. Comparar con especificaciones del fabricante. Registrar tipo y cantidad de refrigerante.',
 '[{"etapa":"durante","descripcion":"Foto de manómetros por cada circuito"},{"etapa":"durante","descripcion":"Foto de lecturas de temperatura"},{"etapa":"durante","descripcion":"Foto de cálculos de superheat/subcooling"}]'::jsonb,
 '[{"nombre":"Presión succión circuito 1","unidad":"PSI","rango_min":110,"rango_max":130},{"nombre":"Presión descarga circuito 1","unidad":"PSI","rango_min":275,"rango_max":400},{"nombre":"Superheat circuito 1","unidad":"°F","rango_min":5,"rango_max":15},{"nombre":"Subcooling circuito 1","unidad":"°F","rango_min":8,"rango_max":14},{"nombre":"Presión succión circuito 2","unidad":"PSI","rango_min":110,"rango_max":130},{"nombre":"Presión descarga circuito 2","unidad":"PSI","rango_min":275,"rango_max":400},{"nombre":"Superheat circuito 2","unidad":"°F","rango_min":5,"rango_max":15},{"nombre":"Subcooling circuito 2","unidad":"°F","rango_min":8,"rango_max":14}]'::jsonb,
 true),

('mini_chiller', 'preventivo', 9, 'Detección de fugas de refrigerante',
 'Utilizar detector electrónico en todas las conexiones y soldaduras. Aplicar solución de burbujas en puntos sospechosos. Inspeccionar por manchas de aceite (indicador de fuga). Verificar nivel de aceite del compresor (si tiene visor).',
 '[{"etapa":"durante","descripcion":"Foto del proceso de detección"},{"etapa":"durante","descripcion":"Foto de cualquier fuga encontrada"},{"etapa":"durante","descripcion":"Foto del nivel de aceite (si tiene visor)"}]'::jsonb,
 '[{"nombre":"Fuga circuito 1","unidad":"Sí/No","rango_min":null,"rango_max":null},{"nombre":"Fuga circuito 2","unidad":"Sí/No","rango_min":null,"rango_max":null},{"nombre":"Ubicación fuga","unidad":"texto","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('mini_chiller', 'preventivo', 10, 'Verificación de controles de seguridad',
 'Verificar operación del presostato de alta presión. Verificar operación del presostato de baja presión. Verificar sensor de temperatura de descarga. Verificar sensor de temperatura de agua. Verificar protecciones contra sobrecarga del compresor. Revisar códigos de error en el controlador.',
 '[{"etapa":"durante","descripcion":"Foto del controlador/display mostrando estado normal"},{"etapa":"durante","descripcion":"Foto de cualquier código de error"},{"etapa":"durante","descripcion":"Foto de los presostatos"}]'::jsonb,
 '[{"nombre":"Set point presostato alta","unidad":"PSI","rango_min":null,"rango_max":null},{"nombre":"Set point presostato baja","unidad":"PSI","rango_min":null,"rango_max":null},{"nombre":"Códigos error activos","unidad":"texto","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('mini_chiller', 'preventivo', 11, 'Inspección de válvula de expansión (TXV/EEV)',
 'Verificar operación correcta de la válvula de expansión. Inspeccionar por congelamiento o escarcha en la válvula. Verificar que el bulbo sensor esté bien sujeto y aislado. En válvulas electrónicas (EEV), verificar señal de control.',
 '[{"etapa":"durante","descripcion":"Foto de la válvula de expansión"},{"etapa":"durante","descripcion":"Foto de cualquier congelamiento o anomalía"}]'::jsonb,
 '[{"nombre":"Superheat evaporador","unidad":"°F","rango_min":5,"rango_max":15}]'::jsonb,
 true),

('mini_chiller', 'preventivo', 12, 'Limpieza del filtro de agua (si aplica)',
 'Cerrar válvulas de aislamiento. Retirar y limpiar el filtro/colador de agua. Inspeccionar malla por daños o obstrucciones. Reinstalar y abrir válvulas. Verificar ausencia de fugas.',
 '[{"etapa":"antes","descripcion":"Foto del filtro sucio"},{"etapa":"despues","descripcion":"Foto del filtro limpio reinstalado"}]'::jsonb,
 '[]'::jsonb,
 false),

('mini_chiller', 'preventivo', 13, 'Verificación de operación del controlador/BMS',
 'Verificar set points de temperatura en el controlador. Verificar horarios de encendido/apagado. Verificar comunicación con BMS (si aplica). Registrar todos los parámetros de operación. Verificar historial de alarmas.',
 '[{"etapa":"durante","descripcion":"Foto de la pantalla del controlador con set points"},{"etapa":"durante","descripcion":"Foto del historial de alarmas"}]'::jsonb,
 '[{"nombre":"Set point temperatura","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Temperatura actual agua","unidad":"°C","rango_min":null,"rango_max":null},{"nombre":"Alarmas en historial","unidad":"texto","rango_min":null,"rango_max":null}]'::jsonb,
 true),

('mini_chiller', 'preventivo', 14, 'Prueba de operación completa y cierre',
 'Energizar el equipo. Arrancar sistema y verificar secuencia de arranque. Monitorear presiones y temperaturas durante 20 minutos. Verificar que el diferencial de temperatura del agua sea estable. Verificar que no haya fugas de agua ni refrigerante. Cerrar todos los paneles. Entregar equipo en operación normal.',
 '[{"etapa":"despues","descripcion":"Video de 30 segundos del equipo en operación"},{"etapa":"despues","descripcion":"Foto de presiones estabilizadas"},{"etapa":"despues","descripcion":"Foto de temperaturas de agua estables"},{"etapa":"despues","descripcion":"Foto final del equipo cerrado y operando"}]'::jsonb,
 '[{"nombre":"Presión succión final","unidad":"PSI","rango_min":110,"rango_max":130},{"nombre":"Presión descarga final","unidad":"PSI","rango_min":275,"rango_max":400},{"nombre":"Temp. agua entrada final","unidad":"°F","rango_min":null,"rango_max":null},{"nombre":"Temp. agua salida final","unidad":"°F","rango_min":null,"rango_max":null},{"nombre":"Amperaje compresor(es) final","unidad":"A","rango_min":null,"rango_max":null}]'::jsonb,
 true);

-- ============================================================================
-- CORRECTIVE: MINI SPLIT (15 common issues)
-- ============================================================================

INSERT INTO public.fallas_correctivas (tipo_equipo_slug, nombre, diagnostico, evidencia_requerida, materiales_tipicos) VALUES

('mini_split_interior', 'Fuga de refrigerante',
 'Equipo no enfría o calienta adecuadamente. Hielo en serpentín evaporador o línea de succión. Ruido de siseo o burbujeo. Manchas de aceite en conexiones flare.',
 '[{"etapa":"antes","descripcion":"Foto de hielo en serpentín"},{"etapa":"antes","descripcion":"Foto de manchas de aceite"},{"etapa":"durante","descripcion":"Foto de lectura de presiones bajas"},{"etapa":"durante","descripcion":"Foto de resultado del detector de fugas"},{"etapa":"despues","descripcion":"Foto de reparación completada"}]'::jsonb,
 '["Refrigerante (R-410A o según equipo)","Kit de soldadura/flare","Detector de fugas","Nitrógeno OFN","Válvulas Schrader"]'::jsonb),

('mini_split_interior', 'Compresor dañado / No arranca',
 'Equipo no enciende. Breaker se dispara al encender. Ruido de golpeteo o chasquido. Amperaje excesivo o en corto.',
 '[{"etapa":"antes","descripcion":"Foto de lectura de amperaje anormal"},{"etapa":"antes","descripcion":"Foto de lectura de resistencia de devanados"},{"etapa":"antes","descripcion":"Video del intento de arranque"},{"etapa":"antes","descripcion":"Foto del breaker disparado"},{"etapa":"despues","descripcion":"Foto del compresor nuevo instalado"}]'::jsonb,
 '["Compresor de reemplazo (según modelo)","Capacitor","Contactor","Refrigerante","Aceite POE","Kit de soldadura"]'::jsonb),

('mini_split_interior', 'Capacitor dañado',
 'Motor del ventilador no arranca o arranca lento. Zumbido eléctrico constante. Compresor no arranca pero hace ruido. Capacitor inflado, con fuga de aceite o quemado.',
 '[{"etapa":"antes","descripcion":"Foto del capacitor dañado (inflado/con fuga)"},{"etapa":"antes","descripcion":"Foto de lectura de µF vs. valor nominal"},{"etapa":"despues","descripcion":"Foto del nuevo capacitor instalado"}]'::jsonb,
 '["Capacitor de reemplazo (µF y voltaje según equipo)"]'::jsonb),

('mini_split_interior', 'Contactor dañado / Quemado',
 'Equipo no enciende aunque el termostato manda señal. Contactos visiblemente picados o quemados. Zumbido en el contactor pero no cierra circuito.',
 '[{"etapa":"antes","descripcion":"Foto del contactor dañado con detalle de contactos"},{"etapa":"despues","descripcion":"Foto del contactor nuevo instalado"}]'::jsonb,
 '["Contactor de reemplazo (amperaje según equipo)"]'::jsonb),

('mini_split_interior', 'Drenaje obstruido / Fuga de agua',
 'Agua goteando de la unidad interior. Charola de condensados llena. Manchas de agua en pared o techo. Olor a humedad/moho.',
 '[{"etapa":"antes","descripcion":"Foto de la fuga de agua"},{"etapa":"antes","descripcion":"Foto de la charola llena"},{"etapa":"antes","descripcion":"Foto de manchas en pared"},{"etapa":"despues","descripcion":"Foto del drenaje limpio con flujo libre"}]'::jsonb,
 '["Kit de limpieza de drenaje","Bomba de vacío para drenaje","Tabletas bactericidas","Solución de cloro/vinagre"]'::jsonb),

('mini_split_interior', 'Serpentín evaporador congelado',
 'Serpentín cubierto de hielo. Flujo de aire muy reducido o nulo. Agua excesiva al descongelar. Puede indicar filtro sucio, falta de refrigerante, o falla de ventilador.',
 '[{"etapa":"antes","descripcion":"Foto del serpentín congelado"},{"etapa":"despues","descripcion":"Foto después de descongelar"},{"etapa":"durante","descripcion":"Foto de lectura de presiones"}]'::jsonb,
 '["Limpiador de serpentín","Filtros de reemplazo","Refrigerante (si es por fuga)","Válvula de servicio"]'::jsonb),

('mini_split_interior', 'Motor del ventilador interior dañado',
 'Ventilador no gira o gira muy lento. Ruido de rozamiento, chirrido o vibración excesiva. Flujo de aire muy débil. Amperaje excesivo del motor.',
 '[{"etapa":"antes","descripcion":"Video mostrando el problema (sonido/vibración)"},{"etapa":"antes","descripcion":"Foto de lectura de amperaje anormal"},{"etapa":"antes","descripcion":"Foto del motor dañado"},{"etapa":"despues","descripcion":"Foto del motor nuevo instalado"}]'::jsonb,
 '["Motor de ventilador de reemplazo","Turbina/blower wheel (si está dañada)"]'::jsonb),

('mini_split_interior', 'Tarjeta de control (PCB) dañada',
 'Equipo no responde a control remoto. Códigos de error en display. Comportamiento errático (enciende/apaga solo). LED de diagnóstico parpadea código de error.',
 '[{"etapa":"antes","descripcion":"Foto del código de error en display"},{"etapa":"antes","descripcion":"Foto de la tarjeta PCB con daño visible"},{"etapa":"despues","descripcion":"Foto de la tarjeta nueva instalada"}]'::jsonb,
 '["Tarjeta PCB de reemplazo (según modelo exacto)","Fusibles"]'::jsonb),

('mini_split_interior', 'Sensor de temperatura dañado',
 'Lecturas de temperatura incorrectas. Equipo no alcanza temperatura deseada. Código de error de sensor. Equipo se enciende/apaga frecuentemente (short cycling).',
 '[{"etapa":"antes","descripcion":"Foto del código de error"},{"etapa":"antes","descripcion":"Foto de la lectura del sensor vs. termómetro de referencia"},{"etapa":"despues","descripcion":"Foto del sensor reemplazado"}]'::jsonb,
 '["Sensor de temperatura de reemplazo (NTC/termistor según modelo)"]'::jsonb),

('mini_split_exterior', 'Válvula de reversión dañada (en equipos heat pump)',
 'Equipo enfría pero no calienta (o viceversa). Se escucha clic pero no cambia modo. Fuga en la válvula.',
 '[{"etapa":"antes","descripcion":"Video del intento de cambio de modo"},{"etapa":"durante","descripcion":"Foto de lecturas de presiones en ambos modos"},{"etapa":"durante","descripcion":"Foto de la válvula"},{"etapa":"despues","descripcion":"Foto de la válvula nueva instalada"}]'::jsonb,
 '["Válvula de 4 vías de reemplazo","Kit de soldadura","Refrigerante","Nitrógeno"]'::jsonb),

('mini_split_exterior', 'Vibración excesiva / Ruido anormal',
 'Ruido de vibración, traqueteo o golpeteo. Base o soporte suelto. Aspas del ventilador desbalanceadas. Tornillería floja.',
 '[{"etapa":"antes","descripcion":"Video mostrando la vibración y el ruido"},{"etapa":"antes","descripcion":"Foto de la base/soporte"},{"etapa":"antes","descripcion":"Foto de cualquier componente suelto"},{"etapa":"despues","descripcion":"Foto de la reparación completada"}]'::jsonb,
 '["Bases antivibratorias","Tornillería","Aspas de ventilador (si están dañadas)"]'::jsonb),

('mini_split_exterior', 'Tubería de interconexión dañada / Aislamiento roto',
 'Aislamiento de tuberías deteriorado, roto o faltante. Condensación excesiva en tuberías. Eficiencia reducida del sistema.',
 '[{"etapa":"antes","descripcion":"Foto del aislamiento dañado"},{"etapa":"antes","descripcion":"Foto de la condensación en tuberías"},{"etapa":"despues","descripcion":"Foto del aislamiento nuevo colocado"}]'::jsonb,
 '["Aislamiento térmico (Armaflex o equivalente)","Cinta de aislamiento","Abrazaderas"]'::jsonb),

('mini_split_interior', 'Control remoto no funciona',
 'Equipo no responde al control. Display del control apagado. Sensor IR en la unidad no recibe señal.',
 '[{"etapa":"antes","descripcion":"Foto del control remoto"},{"etapa":"antes","descripcion":"Foto del sensor IR en la unidad"},{"etapa":"despues","descripcion":"Foto del control nuevo funcional"}]'::jsonb,
 '["Baterías","Control remoto de reemplazo (universal o del modelo)","Sensor IR de reemplazo"]'::jsonb),

('mini_split_exterior', 'Falla eléctrica / Breaker se dispara',
 'Breaker se dispara al encender el equipo. Cortocircuito en cableado. Daño en componentes eléctricos. Amperaje excesivo del compresor.',
 '[{"etapa":"antes","descripcion":"Foto del breaker disparado"},{"etapa":"durante","descripcion":"Foto de lectura de aislamiento (Megger)"},{"etapa":"durante","descripcion":"Foto de cableado dañado"},{"etapa":"durante","descripcion":"Foto de amperaje de componentes"},{"etapa":"despues","descripcion":"Foto de la reparación completada"}]'::jsonb,
 '["Cable eléctrico del calibre adecuado","Terminales","Breaker de reemplazo (si está dañado)","Cinta aislante","Conectores"]'::jsonb),

('mini_split_interior', 'Olor a humedad / Presencia de moho',
 'Olor a moho al encender el equipo. Manchas oscuras en serpentín o turbina. Biofilm en charola de condensados. Afecta calidad del aire interior.',
 '[{"etapa":"antes","descripcion":"Foto de moho visible en serpentín"},{"etapa":"antes","descripcion":"Foto de moho en turbina"},{"etapa":"antes","descripcion":"Foto de biofilm en charola"},{"etapa":"despues","descripcion":"Foto de componentes limpios y desinfectados"}]'::jsonb,
 '["Limpiador espumante antibacterial","Desinfectante HVAC","Tabletas bactericidas","Spray anti-moho para serpentines"]'::jsonb);

-- ============================================================================
-- CORRECTIVE: MINI CHILLER (12 common issues)
-- ============================================================================

INSERT INTO public.fallas_correctivas (tipo_equipo_slug, nombre, diagnostico, evidencia_requerida, materiales_tipicos) VALUES

('mini_chiller', 'Fuga de refrigerante en circuito',
 'Presiones de operación bajas. Hielo en componentes del circuito de refrigeración. Capacidad de enfriamiento reducida. Alarma de baja presión. Manchas de aceite en soldaduras o conexiones.',
 '[{"etapa":"antes","descripcion":"Foto de presiones bajas en manómetros"},{"etapa":"antes","descripcion":"Foto de hielo en componentes"},{"etapa":"antes","descripcion":"Foto de manchas de aceite"},{"etapa":"durante","descripcion":"Foto de resultado del detector de fugas"},{"etapa":"antes","descripcion":"Foto de la alarma en el controlador"},{"etapa":"despues","descripcion":"Foto de la reparación completada"}]'::jsonb,
 '["Refrigerante (R-410A o según equipo)","Kit de soldadura","Detector electrónico de fugas","Nitrógeno OFN","Válvulas de servicio"]'::jsonb),

('mini_chiller', 'Compresor en falla',
 'Compresor no arranca o se dispara protección. Amperaje excesivo. Ruido anormal de golpeteo. Breaker del circuito del compresor se dispara. Alarma de sobrecarga o cortocircuito.',
 '[{"etapa":"antes","descripcion":"Foto de lectura de amperaje"},{"etapa":"antes","descripcion":"Foto de código de error"},{"etapa":"durante","descripcion":"Foto de resistencia de devanados (megger)"},{"etapa":"antes","descripcion":"Video del intento de arranque"},{"etapa":"despues","descripcion":"Foto del compresor nuevo instalado"}]'::jsonb,
 '["Compresor de reemplazo","Aceite POE","Refrigerante","Filtro deshidratador","Kit de soldadura"]'::jsonb),

('mini_chiller', 'Falla de ventilador del condensador',
 'Motor del ventilador no gira o gira lento. Presión de descarga alta. Ruido de baleros dañados. Aspas rotas o desbalanceadas.',
 '[{"etapa":"antes","descripcion":"Foto del motor dañado"},{"etapa":"antes","descripcion":"Foto de presiones de descarga altas"},{"etapa":"antes","descripcion":"Video del ventilador con problema"},{"etapa":"durante","descripcion":"Foto de amperaje del motor"},{"etapa":"despues","descripcion":"Foto del motor nuevo instalado"}]'::jsonb,
 '["Motor de ventilador de reemplazo","Aspas de reemplazo","Baleros"]'::jsonb),

('mini_chiller', 'Problema en circuito de agua (bajo flujo)',
 'Diferencial de temperatura del agua anormal (muy alto). Alarma de flujo bajo. Presión de agua insuficiente. Filtro de agua obstruido. Bomba de agua con falla.',
 '[{"etapa":"antes","descripcion":"Foto de lecturas de temperatura del agua (entrada/salida)"},{"etapa":"antes","descripcion":"Foto de manómetros de presión de agua"},{"etapa":"antes","descripcion":"Foto de la alarma en controlador"},{"etapa":"antes","descripcion":"Foto del filtro de agua sucio"},{"etapa":"despues","descripcion":"Foto del filtro limpio/nuevo"}]'::jsonb,
 '["Filtro de agua de reemplazo","Bomba de agua (si aplica)","Empaques y sellos","Válvulas"]'::jsonb),

('mini_chiller', 'Falla de válvula de expansión (TXV/EEV)',
 'Superheat anormal (muy alto o muy bajo). Congelamiento en la válvula. Flujo de refrigerante irregular. Capacidad de enfriamiento fluctuante.',
 '[{"etapa":"antes","descripcion":"Foto de la válvula congelada o con escarcha"},{"etapa":"antes","descripcion":"Foto de lecturas de superheat anormal"},{"etapa":"durante","descripcion":"Foto de presiones inestables"},{"etapa":"despues","descripcion":"Foto de la válvula nueva instalada"}]'::jsonb,
 '["Válvula de expansión de reemplazo","Bulbo sensor","Kit de soldadura","Refrigerante"]'::jsonb),

('mini_chiller', 'Contactor o relay quemado',
 'Circuito no energiza. Contactos visiblemente picados. Zumbido eléctrico sin cierre de circuito. Equipo parcialmente operativo.',
 '[{"etapa":"antes","descripcion":"Foto del contactor/relay dañado"},{"etapa":"antes","descripcion":"Foto de contactos picados"},{"etapa":"despues","descripcion":"Foto del componente nuevo instalado"}]'::jsonb,
 '["Contactor/relay de reemplazo (según especificaciones)"]'::jsonb),

('mini_chiller', 'Capacitor dañado',
 'Motor o compresor no arranca. Zumbido sin arranque. Capacitor inflado o con fuga.',
 '[{"etapa":"antes","descripcion":"Foto del capacitor dañado"},{"etapa":"antes","descripcion":"Foto de lectura de µF"},{"etapa":"despues","descripcion":"Foto del reemplazo instalado"}]'::jsonb,
 '["Capacitor de reemplazo (µF y voltaje correctos)"]'::jsonb),

('mini_chiller', 'Presostato de alta/baja presión disparado',
 'Equipo se detiene por protección. Alarma de alta o baja presión. Puede indicar fuga, serpentín sucio, falta de flujo de aire o agua, o sobrecarga.',
 '[{"etapa":"antes","descripcion":"Foto del código de alarma"},{"etapa":"durante","descripcion":"Foto de presiones de operación"},{"etapa":"durante","descripcion":"Foto del presostato"},{"etapa":"despues","descripcion":"Foto del equipo en operación normal"}]'::jsonb,
 '["Presostato de reemplazo (si está dañado)","Herramienta de diagnóstico"]'::jsonb),

('mini_chiller', 'Fuga de agua en conexiones o intercambiador',
 'Agua visible debajo o alrededor del chiller. Presión del circuito de agua bajando. Charcos o humedad en base del equipo.',
 '[{"etapa":"antes","descripcion":"Foto de la fuga de agua visible"},{"etapa":"antes","descripcion":"Foto de la conexión dañada"},{"etapa":"despues","descripcion":"Foto de la reparación completada"}]'::jsonb,
 '["Empaques y sellos","Tubería/accesorios de reemplazo","Sellador","Herramienta de plomería"]'::jsonb),

('mini_chiller', 'Falla de tarjeta de control / Controlador',
 'Equipo no responde. Pantalla apagada o con error. Comportamiento errático. Comunicación perdida con BMS.',
 '[{"etapa":"antes","descripcion":"Foto de la pantalla con error"},{"etapa":"antes","descripcion":"Foto de la tarjeta con daño visible"},{"etapa":"antes","descripcion":"Foto de LEDs de diagnóstico"},{"etapa":"despues","descripcion":"Foto de la tarjeta nueva instalada"}]'::jsonb,
 '["Tarjeta de control de reemplazo","Fusibles","Transformador (si aplica)"]'::jsonb),

('mini_chiller', 'Serpentín condensador dañado / Aletas severamente aplastadas',
 'Eficiencia de enfriamiento reducida. Presión de descarga alta crónica. Daño mecánico visible en aletas. Corrosión severa en serpentín.',
 '[{"etapa":"antes","descripcion":"Foto de aletas dañadas/aplastadas"},{"etapa":"antes","descripcion":"Foto de corrosión"},{"etapa":"durante","descripcion":"Foto de presiones de descarga altas"},{"etapa":"despues","descripcion":"Foto de la reparación/reemplazo"}]'::jsonb,
 '["Serpentín de reemplazo (si el daño es severo)","Peine de aletas","Solución anticorrosiva"]'::jsonb),

('mini_chiller', 'Desbalance de fases / Problema de voltaje',
 'Desbalance de voltaje >2% entre fases. Voltaje fuera de rango (±10%). Compresor se sobrecalienta. Protección térmica se activa.',
 '[{"etapa":"antes","descripcion":"Foto de lecturas de voltaje en las tres fases"},{"etapa":"antes","descripcion":"Foto de la alarma de protección"},{"etapa":"durante","descripcion":"Foto del registro de mediciones"},{"etapa":"despues","descripcion":"Foto de voltaje estabilizado"}]'::jsonb,
 '["Verificar con la compañía eléctrica","Regulador de voltaje (si aplica)","Protector de fases"]'::jsonb);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run these queries to verify the seed was applied correctly:
--
-- SELECT tipo_equipo_slug, tipo_mantenimiento, count(*) FROM plantillas_pasos GROUP BY 1, 2 ORDER BY 1, 2;
-- Expected: mini_split_interior/preventivo: 13, mini_split_exterior/preventivo: 10, mini_chiller/preventivo: 14
--
-- SELECT tipo_equipo_slug, count(*) FROM fallas_correctivas GROUP BY 1 ORDER BY 1;
-- Expected: mini_split_interior: 10, mini_split_exterior: 5, mini_chiller: 12
-- (Note: some mini split issues are assigned to interior, some to exterior based on where the component is)
--
-- SELECT count(*) FROM valores_referencia;
-- Expected: 15
--
-- SELECT count(*) FROM tipos_equipo;
-- Expected: 4 (mini_split_interior, mini_split_exterior, mini_chiller, otro)
-- ============================================================================
