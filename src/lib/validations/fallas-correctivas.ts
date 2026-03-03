import { z } from "zod";

const evidenciaItemSchema = z.object({
  etapa: z.enum(["antes", "durante", "despues"]),
  descripcion: z.string().min(1).trim(),
});

export const fallaCorrectivaSchema = z.object({
  tipo_equipo_slug: z
    .string({ error: "El tipo de equipo es requerido" })
    .min(1, { error: "El tipo de equipo es requerido" }),
  nombre: z
    .string({ error: "El nombre es requerido" })
    .min(1, { error: "El nombre es requerido" })
    .max(300, { error: "El nombre no puede exceder 300 caracteres" })
    .trim(),
  diagnostico: z
    .string({ error: "El diagnostico es requerido" })
    .min(1, { error: "El diagnostico es requerido" })
    .trim(),
  evidencia_requerida: z.array(evidenciaItemSchema).default([]),
  materiales_tipicos: z.array(z.string().trim()).default([]),
});

export type FallaCorrectivaInput = z.infer<typeof fallaCorrectivaSchema>;
