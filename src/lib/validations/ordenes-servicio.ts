import { z } from "zod";

export const ordenServicioSchema = z.object({
  sucursal_id: z
    .string({ error: "La sucursal es requerida" })
    .uuid({ error: "ID de sucursal invalido" }),
  cliente_id: z
    .string({ error: "El cliente es requerido" })
    .uuid({ error: "ID de cliente invalido" }),
  descripcion_problema: z
    .string({ error: "La descripcion del problema es requerida" })
    .min(1, { error: "La descripcion del problema es requerida" })
    .max(2000, {
      error: "La descripcion no puede exceder 2000 caracteres",
    }),
});

export type OrdenServicioInput = z.infer<typeof ordenServicioSchema>;
