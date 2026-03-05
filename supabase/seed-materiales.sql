-- ============================================================================
-- SEED: Materiales Catalogo — ~32 common HVAC materials
-- ============================================================================
-- Run AFTER migration-19-inventario.sql
-- Pre-seeds the material catalog with common HVAC consumables and components
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- CONSUMIBLES
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.materiales_catalogo (nombre, categoria, unidad_default, stock_minimo, notas) VALUES

('Refrigerante R-410A', 'consumible', 'kg', 5,
 'Refrigerante para sistemas de aire acondicionado modernos'),

('Refrigerante R-22', 'consumible', 'kg', 5,
 'Refrigerante para sistemas antiguos (en fase de eliminacion)'),

('Nitrogeno OFN', 'consumible', 'kg', 10,
 'Nitrogeno libre de oxigeno para pruebas de presion y soldadura'),

('Limpiador de serpentines espuma', 'consumible', 'lt', 5,
 'Limpiador en espuma para serpentines de evaporador y condensador'),

('Limpiador de serpentines quimico', 'consumible', 'lt', 5,
 'Limpiador quimico concentrado para serpentines'),

('Limpiador de contactos electricos', 'consumible', 'pza', 3,
 'Spray limpiador para contactos electricos y tarjetas'),

('Solvente', 'consumible', 'lt', 2,
 'Solvente de uso general para limpieza'),

('Cinchos de plastico', 'consumible', 'pza', 50,
 'Cinchos/amarres de plastico para sujecion de cables'),

('Cinta de aislar', 'consumible', 'rollo', 5,
 'Cinta aislante electrica'),

('Cinta ducto', 'consumible', 'rollo', 3,
 'Cinta adhesiva para ductos y sellado'),

('Varillas de soldadura de plata', 'consumible', 'pza', 10,
 'Varillas para soldadura de cobre con aleacion de plata'),

('Flux de soldadura', 'consumible', 'pza', 5,
 'Fundente/flux para soldadura de tuberia de cobre'),

('Aceite refrigerante', 'consumible', 'lt', 2,
 'Aceite POE/PVE para compresores');


-- ═══════════════════════════════════════════════════════════════════════════
-- COMPONENTES
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.materiales_catalogo (nombre, categoria, unidad_default, stock_minimo, notas) VALUES

('Compresor scroll', 'componente', 'pza', 0,
 'Compresor tipo scroll para unidades de A/C'),

('Compresor reciprocante', 'componente', 'pza', 0,
 'Compresor tipo reciprocante/piston'),

('Termostato', 'componente', 'pza', 2,
 'Termostato de control de temperatura'),

('Intercambiador de calor', 'componente', 'pza', 0,
 'Intercambiador de calor (serpentin)'),

('Contactor', 'componente', 'pza', 2,
 'Contactor electrico para arranque de compresor/motor'),

('Capacitor de arranque', 'componente', 'pza', 3,
 'Capacitor de arranque para motores'),

('Capacitor de marcha', 'componente', 'pza', 3,
 'Capacitor de marcha para motores'),

('Motor de ventilador condensador', 'componente', 'pza', 1,
 'Motor para ventilador de condensador (unidad exterior)'),

('Motor de ventilador evaporador', 'componente', 'pza', 1,
 'Motor para ventilador de evaporador (unidad interior)'),

('Valvula de expansion TXV', 'componente', 'pza', 1,
 'Valvula de expansion termostatica'),

('Valvula de expansion electronica EEV', 'componente', 'pza', 0,
 'Valvula de expansion electronica'),

('Filtro deshidratador', 'componente', 'pza', 3,
 'Filtro deshidratador para linea de liquido'),

('Valvula Schrader', 'componente', 'pza', 5,
 'Valvula de servicio tipo Schrader'),

('Valvula solenoide', 'componente', 'pza', 1,
 'Valvula solenoide para control de flujo de refrigerante'),

('Presostato alta/baja', 'componente', 'pza', 1,
 'Presostato de alta y/o baja presion'),

('Sensor de temperatura', 'componente', 'pza', 2,
 'Sensor/termistor de temperatura'),

('Tarjeta de control', 'componente', 'pza', 0,
 'Tarjeta/placa de control electronica'),

('Tubo de cobre', 'componente', 'm', 5,
 'Tuberia de cobre para lineas de refrigerante'),

('Aislamiento termico Armaflex', 'componente', 'm', 5,
 'Aislamiento termico tipo Armaflex para tuberia');
