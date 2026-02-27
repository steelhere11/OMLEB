// ============================================================================
// Workflow types — V1.5 Guided Maintenance
// Add these to src/types/index.ts
// ============================================================================

// --- Equipment Type Catalog ---

export interface TipoEquipo {
  id: string;
  slug: string;
  nombre: string;
  is_system: boolean;
  created_at: string;
}

// Known system slugs for type-safe workflow loading
export type TipoEquipoSlug =
  | "mini_split_interior"
  | "mini_split_exterior"
  | "mini_chiller"
  | "otro"
  | string; // allows admin-created types

// --- Preventive Step Templates ---

export type TipoMantenimiento = "preventivo" | "correctivo";

export interface EvidenciaRequerida {
  etapa: "antes" | "durante" | "despues";
  descripcion: string;
}

export interface LecturaRequerida {
  nombre: string;
  unidad: string;
  rango_min: number | null;
  rango_max: number | null;
}

export interface PlantillaPaso {
  id: string;
  tipo_equipo_slug: string;
  tipo_mantenimiento: TipoMantenimiento;
  orden: number;
  nombre: string;
  procedimiento: string;
  evidencia_requerida: EvidenciaRequerida[];
  lecturas_requeridas: LecturaRequerida[];
  es_obligatorio: boolean;
  created_at: string;
}

// --- Corrective Issue Library ---

export interface FallaCorrectiva {
  id: string;
  tipo_equipo_slug: string;
  nombre: string;
  diagnostico: string;
  evidencia_requerida: EvidenciaRequerida[];
  materiales_tipicos: string[];
  created_at: string;
}

// --- Step Completion Tracking ---

export interface ReportePaso {
  id: string;
  reporte_equipo_id: string;
  plantilla_paso_id: string | null;
  falla_correctiva_id: string | null;
  completado: boolean;
  notas: string | null;
  lecturas: Record<string, number | string>;
  completed_at: string | null;
}

// --- Reference Values ---

export interface ValorReferencia {
  id: string;
  nombre: string;
  unidad: string;
  rango_min: number | null;
  rango_max: number | null;
  notas: string | null;
  created_at: string;
}

// --- Updated FotoEtiqueta (added 'durante') ---
// Replace existing FotoEtiqueta in types/index.ts:
// export type FotoEtiqueta = "antes" | "durante" | "despues" | "dano" | "placa" | "progreso";
