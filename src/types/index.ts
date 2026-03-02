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
  created_at: string;
  updated_at: string;
}

export type FolioEstatus = "abierto" | "en_progreso" | "completado" | "en_espera";

export interface Folio {
  id: string;
  sucursal_id: string;
  cliente_id: string;
  numero_folio: string;
  descripcion_problema: string;
  estatus: FolioEstatus;
  created_at: string;
  updated_at: string;
}

export interface FolioAsignado {
  id: string;
  folio_id: string;
  usuario_id: string;
  created_at: string;
}

export interface FolioEquipo {
  id: string;
  folio_id: string;
  equipo_id: string;
  added_by: string | null;
  created_at: string;
}

export type ReporteEstatus = "en_progreso" | "en_espera" | "completado";

export interface Reporte {
  id: string;
  folio_id: string;
  creado_por: string;
  sucursal_id: string;
  fecha: string;
  estatus: ReporteEstatus;
  firma_encargado: string | null;
  nombre_encargado: string | null;
  finalizado_por_admin: boolean;
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
}

export type FotoEtiqueta = "antes" | "durante" | "despues" | "dano" | "placa" | "progreso";

export type TipoMedia = "foto" | "video";

export interface ReporteFoto {
  id: string;
  reporte_id: string;
  equipo_id: string | null;
  reporte_paso_id: string | null;
  url: string;
  etiqueta: FotoEtiqueta | null;
  tipo_media: TipoMedia;
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
