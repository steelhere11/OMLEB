// Inventory & Materials Management types

export interface Cuadrilla {
  id: string;
  nombre: string;
  lider_id: string | null;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface CuadrillaMiembro {
  id: string;
  cuadrilla_id: string;
  usuario_id: string;
  created_at: string;
}

export type MaterialCategoria = "consumible" | "componente";

export interface MaterialCatalogo {
  id: string;
  nombre: string;
  categoria: MaterialCategoria;
  unidad_default: string;
  stock_minimo: number;
  notas: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export type StockMovimientoTipo = "entrada" | "asignacion" | "uso" | "devolucion" | "ajuste";
export type StockFuente = "empresa" | "contratista";

export interface StockMovimiento {
  id: string;
  catalogo_id: string;
  tipo: StockMovimientoTipo;
  cantidad: number;
  fuente: StockFuente | null;
  contratista_nombre: string | null;
  cuadrilla_id: string | null;
  reporte_id: string | null;
  costo_unitario: number | null;
  costo_total: number | null;
  numero_factura: string | null;
  notas: string | null;
  registrado_por: string;
  created_at: string;
}

export type MaterialRequeridoPrioridad = "urgente" | "normal";
export type MaterialRequeridoEstatus = "pendiente" | "en_camino" | "recibido";

export interface MaterialRequerido {
  id: string;
  reporte_id: string;
  catalogo_id: string | null;
  descripcion: string;
  cantidad: number;
  unidad: string;
  prioridad: MaterialRequeridoPrioridad;
  estatus: MaterialRequeridoEstatus;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

// Dashboard aggregation types

export interface StockResumen {
  catalogo_id: string;
  nombre: string;
  categoria: MaterialCategoria;
  unidad_default: string;
  stock_minimo: number;
  stock_bodega: number;
  stock_asignado: number;
  stock_total: number;
  total_usado: number;
  total_comprado: number;
  gasto_total: number;
  bajo_minimo: boolean;
}

export interface CuadrillaStock {
  cuadrilla_id: string;
  cuadrilla_nombre: string;
  catalogo_id: string;
  cantidad: number;
}
