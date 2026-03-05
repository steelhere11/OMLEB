import { z } from "zod";

export const equipoSchema = z.object({
  sucursal_id: z
    .string({ error: "La sucursal es requerida" })
    .uuid({ error: "ID de sucursal invalido" }),
  numero_etiqueta: z
    .string({ error: "La etiqueta del equipo es requerida" })
    .min(1, { error: "La etiqueta del equipo es requerida" })
    .max(100, { error: "La etiqueta no puede exceder 100 caracteres" }),
  marca: z
    .string()
    .max(100, { error: "La marca no puede exceder 100 caracteres" })
    .optional()
    .or(z.literal("")),
  modelo: z
    .string()
    .max(100, { error: "El modelo no puede exceder 100 caracteres" })
    .optional()
    .or(z.literal("")),
  numero_serie: z
    .string()
    .max(100, {
      error: "El numero de serie no puede exceder 100 caracteres",
    })
    .optional()
    .or(z.literal("")),
  tipo_equipo: z
    .string()
    .max(100, {
      error: "El tipo de equipo no puede exceder 100 caracteres",
    })
    .optional()
    .or(z.literal("")),
  capacidad: z
    .string()
    .max(100, { error: "La capacidad no puede exceder 100 caracteres" })
    .optional()
    .or(z.literal("")),
  refrigerante: z
    .string()
    .max(100, { error: "El refrigerante no puede exceder 100 caracteres" })
    .optional()
    .or(z.literal("")),
  voltaje: z
    .string()
    .max(100, { error: "El voltaje no puede exceder 100 caracteres" })
    .optional()
    .or(z.literal("")),
  fase: z
    .string()
    .max(50, { error: "La fase no puede exceder 50 caracteres" })
    .optional()
    .or(z.literal("")),
  ubicacion: z
    .string()
    .max(100, { error: "La ubicacion no puede exceder 100 caracteres" })
    .optional()
    .or(z.literal("")),
  forma_factor: z
    .string()
    .max(50, { error: "La forma/factor no puede exceder 50 caracteres" })
    .optional()
    .or(z.literal("")),
});

export type EquipoInput = z.infer<typeof equipoSchema>;

// Schema for creating equipment from within an orden (no sucursal_id — derived from orden)
export const equipoForOrdenSchema = z.object({
  numero_etiqueta: z
    .string({ error: "La etiqueta del equipo es requerida" })
    .min(1, { error: "La etiqueta del equipo es requerida" })
    .max(100, { error: "La etiqueta no puede exceder 100 caracteres" }),
  marca: z
    .string()
    .max(100, { error: "La marca no puede exceder 100 caracteres" })
    .optional()
    .or(z.literal("")),
  modelo: z
    .string()
    .max(100, { error: "El modelo no puede exceder 100 caracteres" })
    .optional()
    .or(z.literal("")),
  numero_serie: z
    .string()
    .max(100, {
      error: "El numero de serie no puede exceder 100 caracteres",
    })
    .optional()
    .or(z.literal("")),
  tipo_equipo: z
    .string()
    .max(100, {
      error: "El tipo de equipo no puede exceder 100 caracteres",
    })
    .optional()
    .or(z.literal("")),
  capacidad: z
    .string()
    .max(100, { error: "La capacidad no puede exceder 100 caracteres" })
    .optional()
    .or(z.literal("")),
  refrigerante: z
    .string()
    .max(100, { error: "El refrigerante no puede exceder 100 caracteres" })
    .optional()
    .or(z.literal("")),
  voltaje: z
    .string()
    .max(100, { error: "El voltaje no puede exceder 100 caracteres" })
    .optional()
    .or(z.literal("")),
  fase: z
    .string()
    .max(50, { error: "La fase no puede exceder 50 caracteres" })
    .optional()
    .or(z.literal("")),
  ubicacion: z
    .string()
    .max(100, { error: "La ubicacion no puede exceder 100 caracteres" })
    .optional()
    .or(z.literal("")),
  forma_factor: z
    .string()
    .max(50, { error: "La forma/factor no puede exceder 50 caracteres" })
    .optional()
    .or(z.literal("")),
});

export type EquipoForOrdenInput = z.infer<typeof equipoForOrdenSchema>;

// Schema for equipment registration (nameplate data from field)
export const equipmentRegistrationSchema = z.object({
  marca: z
    .string()
    .max(100, { error: "La marca no puede exceder 100 caracteres" })
    .optional()
    .or(z.literal("")),
  modelo: z
    .string()
    .max(100, { error: "El modelo no puede exceder 100 caracteres" })
    .optional()
    .or(z.literal("")),
  numero_serie: z
    .string()
    .max(100, {
      error: "El numero de serie no puede exceder 100 caracteres",
    })
    .optional()
    .or(z.literal("")),
  capacidad: z
    .string()
    .max(100, { error: "La capacidad no puede exceder 100 caracteres" })
    .optional()
    .or(z.literal("")),
  refrigerante: z
    .string()
    .max(100, { error: "El refrigerante no puede exceder 100 caracteres" })
    .optional()
    .or(z.literal("")),
  voltaje: z
    .string()
    .max(100, { error: "El voltaje no puede exceder 100 caracteres" })
    .optional()
    .or(z.literal("")),
  fase: z
    .string()
    .max(50, { error: "La fase no puede exceder 50 caracteres" })
    .optional()
    .or(z.literal("")),
  ubicacion: z
    .string()
    .max(100, { error: "La ubicacion no puede exceder 100 caracteres" })
    .optional()
    .or(z.literal("")),
  forma_factor: z
    .string()
    .max(50, { error: "La forma/factor no puede exceder 50 caracteres" })
    .optional()
    .or(z.literal("")),
});

export type EquipmentRegistrationInput = z.infer<
  typeof equipmentRegistrationSchema
>;
