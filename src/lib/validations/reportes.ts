import { z } from "zod";

// ── Equipment Entry Schema ──────────────────────────────────────────────
// Validates per-equipment details within a report

export const reporteEquipoSchema = z.object({
  equipo_id: z
    .string({ error: "El equipo es requerido" })
    .uuid({ error: "ID de equipo invalido" }),
  tipo_trabajo: z.enum(["preventivo", "correctivo"], {
    error: "El tipo de trabajo debe ser preventivo o correctivo",
  }),
  diagnostico: z
    .string()
    .max(2000, { error: "El diagnostico no puede exceder 2000 caracteres" })
    .optional()
    .or(z.literal("")),
  trabajo_realizado: z
    .string()
    .max(2000, {
      error: "El trabajo realizado no puede exceder 2000 caracteres",
    })
    .optional()
    .or(z.literal("")),
  observaciones: z
    .string()
    .max(2000, {
      error: "Las observaciones no pueden exceder 2000 caracteres",
    })
    .optional()
    .or(z.literal("")),
});

export type ReporteEquipoInput = z.infer<typeof reporteEquipoSchema>;

// ── Material Schema ─────────────────────────────────────────────────────
// Validates each material row in the materials table

export const reporteMaterialSchema = z.object({
  cantidad: z.coerce
    .number({ error: "La cantidad debe ser un numero" })
    .positive({ error: "La cantidad debe ser mayor a 0" }),
  unidad: z
    .string({ error: "La unidad es requerida" })
    .min(1, { error: "La unidad es requerida" })
    .max(50, { error: "La unidad no puede exceder 50 caracteres" }),
  descripcion: z
    .string({ error: "La descripcion es requerida" })
    .min(1, { error: "La descripcion es requerida" })
    .max(500, { error: "La descripcion no puede exceder 500 caracteres" }),
});

export type ReporteMaterialInput = z.infer<typeof reporteMaterialSchema>;

// ── Report Status Schema ────────────────────────────────────────────────
// Validates report status transitions

export const reporteStatusSchema = z.object({
  estatus: z.enum(["en_progreso", "en_espera", "completado"], {
    error: "El estatus debe ser en_progreso, en_espera o completado",
  }),
});

export type ReporteStatusInput = z.infer<typeof reporteStatusSchema>;

// ── Step Progress Schema ─────────────────────────────────────────────────
// Validates step completion data for workflow steps

export const reportePasoSchema = z.object({
  reporte_equipo_id: z.string().uuid(),
  plantilla_paso_id: z.string().uuid().optional(),
  falla_correctiva_id: z.string().uuid().optional(),
  completado: z.boolean(),
  notas: z
    .string()
    .max(2000, { message: "Las notas no pueden exceder 2000 caracteres" })
    .optional()
    .or(z.literal("")),
  lecturas: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
});

export type ReportePasoInput = z.infer<typeof reportePasoSchema>;
