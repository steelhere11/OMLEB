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
});

export type EquipoInput = z.infer<typeof equipoSchema>;
