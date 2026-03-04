import { z } from "zod";

const evidenciaItemSchema = z.object({
  etapa: z.enum(["antes", "durante", "despues"]),
  descripcion: z.string().min(1).trim(),
});

const lecturaItemSchema = z.object({
  nombre: z.string().min(1).trim(),
  unidad: z.string().min(1).trim(),
  rango_min: z.number().nullable(),
  rango_max: z.number().nullable(),
});

export const plantillaPasoSchema = z.object({
  tipo_equipo_slug: z
    .string({ error: "El tipo de equipo es requerido" })
    .min(1, { error: "El tipo de equipo es requerido" }),
  orden: z
    .number({ error: "El orden es requerido" })
    .int({ error: "El orden debe ser un numero entero" })
    .min(1, { error: "El orden debe ser al menos 1" }),
  nombre: z
    .string({ error: "El nombre es requerido" })
    .min(1, { error: "El nombre es requerido" })
    .max(300, { error: "El nombre no puede exceder 300 caracteres" })
    .trim(),
  procedimiento: z
    .string({ error: "El procedimiento es requerido" })
    .min(1, { error: "El procedimiento es requerido" })
    .trim(),
  evidencia_requerida: z.array(evidenciaItemSchema).default([]),
  lecturas_requeridas: z.array(lecturaItemSchema).default([]),
  es_obligatorio: z.boolean().default(true),
});

export type PlantillaPasoInput = z.infer<typeof plantillaPasoSchema>;
