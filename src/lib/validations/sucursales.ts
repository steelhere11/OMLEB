import { z } from "zod";

export const sucursalSchema = z.object({
  nombre: z
    .string({ error: "El nombre es requerido" })
    .min(1, { error: "El nombre es requerido" })
    .max(200, { error: "El nombre no puede exceder 200 caracteres" }),
  numero: z
    .string({ error: "El numero es requerido" })
    .min(1, { error: "El numero es requerido" }),
  direccion: z
    .string({ error: "La direccion es requerida" })
    .min(1, { error: "La direccion es requerida" }),
});

export type SucursalInput = z.infer<typeof sucursalSchema>;
