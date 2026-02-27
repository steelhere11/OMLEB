import { z } from "zod";

export const clienteSchema = z.object({
  nombre: z
    .string({ error: "El nombre es requerido" })
    .min(1, { error: "El nombre es requerido" })
    .max(200, { error: "El nombre no puede exceder 200 caracteres" })
    .trim(),
});

export type ClienteInput = z.infer<typeof clienteSchema>;
