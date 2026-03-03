// Database types matching CLAUDE.md schema
// Table/column names in Spanish (domain language), code in English

export type UserRole = "admin" | "tecnico" | "ayudante";

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  created_at: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sucursal {
  id: string;
  nombre: string;
  numero: string;
  direccion: string;
  created_at: string;
  updated_at: string;
}

export interface Equipo {
  id: string;
  sucursal_id: string;
  numero_etiqueta: string;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  tipo_equipo: string | null;
  tipo_equipo_id: string | null;
  agregado_por: string | null;
  revisado: boolean;
  capacidad: string | null;
  refrigerante: string | null;
  voltaje: string | null;
  fase: string | null;
  ubicacion: string | null;
  created_at: string;
  updated_at: string;
}

export type OrdenServicioEstatus = "abierto" | "en_progreso" | "completado" | "en_espera";

export interface OrdenServicio {
  id: string;
  sucursal_id: string;
  cliente_id: string;
  numero_orden: string;
  descripcion_problema: string;
  estatus: OrdenServicioEstatus;
  created_at: string;
  updated_at: string;
}

export interface OrdenAsignado {
  id: string;
  orden_servicio_id: string;
  usuario_id: string;
  created_at: string;
}

export interface OrdenEquipo {
  id: string;
  orden_servicio_id: string;
  equipo_id: string;
  added_by: string | null;
  created_at: string;
}

export type ReporteEstatus = "en_progreso" | "en_espera" | "completado";

export interface Reporte {
  id: string;
  orden_servicio_id: string;
  creado_por: string;
  sucursal_id: string;
  fecha: string;
  estatus: ReporteEstatus;
  firma_encargado: string | null;
  nombre_encargado: string | null;
  finalizado_por_admin: boolean;
  llegada_completada: boolean;
  sitio_completado: boolean;
  revision_actual: number;
  created_at: string;
  updated_at: string;
}

export type TipoTrabajo = "preventivo" | "correctivo";

export interface ReporteEquipo {
  id: string;
  reporte_id: string;
  equipo_id: string;
  tipo_trabajo: TipoTrabajo;
  diagnostico: string | null;
  trabajo_realizado: string | null;
  observaciones: string | null;
  registro_completado: boolean;
}

export type FotoEtiqueta = "antes" | "durante" | "despues" | "dano" | "placa" | "progreso" | "llegada" | "sitio" | "equipo_general" | "anotado";

export type TipoMedia = "foto" | "video";

export type FotoEstatusRevision = "pendiente" | "aceptada" | "rechazada" | "retomar";

export interface ReporteFoto {
  id: string;
  reporte_id: string;
  equipo_id: string | null;
  reporte_paso_id: string | null;
  url: string;
  etiqueta: FotoEtiqueta | null;
  tipo_media: TipoMedia;
  estatus_revision: FotoEstatusRevision;
  nota_admin: string | null;
  metadata_gps: string | null;
  metadata_fecha: string | null;
  created_at: string;
}

export interface ReporteMaterial {
  id: string;
  reporte_id: string;
  cantidad: number;
  unidad: string;
  descripcion: string;
}

export interface ReporteComentario {
  id: string;
  reporte_id: string;
  equipo_id: string | null;
  autor_id: string;
  contenido: string;
  created_at: string;
}

export interface CambioRevision {
  campo: string;
  valor_anterior: string | number | null;
  valor_nuevo: string | number | null;
  entidad: string;
  entidad_id: string;
}

export interface ReporteRevision {
  id: string;
  reporte_id: string;
  autor_id: string;
  numero: number;
  resumen: string;
  cambios: CambioRevision[];
  created_at: string;
}

// Re-export workflow types from workflows.ts
export type {
  TipoEquipo,
  TipoEquipoSlug,
  TipoMantenimiento,
  PlantillaPaso,
  FallaCorrectiva,
  ReportePaso,
  ValorReferencia,
  EvidenciaRequerida,
  LecturaRequerida,
} from "./workflows";
