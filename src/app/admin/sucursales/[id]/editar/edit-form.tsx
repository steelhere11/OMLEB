"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateSucursal } from "@/app/actions/sucursales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/types/actions";
import type { Sucursal } from "@/types";

interface EditSucursalFormProps {
  sucursal: Sucursal;
}

export function EditSucursalForm({ sucursal }: EditSucursalFormProps) {
  const updateWithId = updateSucursal.bind(null, sucursal.id);
  const [state, formAction, isPending] = useActionState<
    ActionState | null,
    FormData
  >(updateWithId, null);

  return (
    <div className="min-h-dvh bg-admin-bg px-4 py-8 text-white">
      <div className="mx-auto max-w-lg">
        {/* Back link */}
        <Link
          href="/admin/sucursales"
          className="mb-6 inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver a sucursales
        </Link>

        <h1 className="mb-8 text-2xl font-bold">Editar Sucursal</h1>

        <div className="rounded-xl border border-admin-border bg-admin-surface p-6">
          <form action={formAction} className="space-y-5">
            <div>
              <Label htmlFor="nombre" required className="text-gray-300">
                Nombre
              </Label>
              <Input
                id="nombre"
                name="nombre"
                type="text"
                placeholder="Nombre de la sucursal"
                required
                defaultValue={sucursal.nombre}
                error={state?.fieldErrors?.nombre?.[0]}
                className="mt-1.5 border-admin-border bg-admin-bg text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <Label htmlFor="numero" required className="text-gray-300">
                Numero
              </Label>
              <Input
                id="numero"
                name="numero"
                type="text"
                placeholder="Ej: 1234"
                required
                defaultValue={sucursal.numero}
                error={state?.fieldErrors?.numero?.[0]}
                className="mt-1.5 border-admin-border bg-admin-bg text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <Label htmlFor="direccion" required className="text-gray-300">
                Direccion
              </Label>
              <Input
                id="direccion"
                name="direccion"
                type="text"
                placeholder="Direccion completa de la sucursal"
                required
                defaultValue={sucursal.direccion}
                error={state?.fieldErrors?.direccion?.[0]}
                className="mt-1.5 border-admin-border bg-admin-bg text-white placeholder:text-gray-500"
              />
            </div>

            {/* Error message */}
            {state?.error && (
              <div className="rounded-lg border border-red-800 bg-red-900/30 px-4 py-3">
                <p className="text-sm text-red-400">{state.error}</p>
              </div>
            )}

            <Button type="submit" fullWidth size="lg" loading={isPending}>
              Guardar Cambios
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
