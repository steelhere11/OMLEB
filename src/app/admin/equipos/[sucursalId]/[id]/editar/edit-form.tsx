"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateEquipo } from "@/app/actions/equipos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/types/actions";
import type { Equipo } from "@/types";

interface EditEquipoFormProps {
  equipo: Equipo;
  sucursalId: string;
}

export function EditEquipoForm({ equipo, sucursalId }: EditEquipoFormProps) {
  const updateWithId = updateEquipo.bind(null, equipo.id);
  const [state, formAction, isPending] = useActionState<
    ActionState | null,
    FormData
  >(updateWithId, null);

  return (
    <div className="min-h-dvh bg-admin-bg px-4 py-8 text-white">
      <div className="mx-auto max-w-lg">
        {/* Back link */}
        <Link
          href={`/admin/equipos/${sucursalId}`}
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
          Volver a equipos
        </Link>

        <h1 className="mb-8 text-2xl font-bold">Editar Equipo</h1>

        <div className="rounded-xl border border-admin-border bg-admin-surface p-6">
          <form action={formAction} className="space-y-5">
            {/* Hidden sucursal_id (for validation, not updated) */}
            <input type="hidden" name="sucursal_id" value={sucursalId} />

            <div>
              <Label
                htmlFor="numero_etiqueta"
                required
                className="text-gray-300"
              >
                Etiqueta del equipo
              </Label>
              <Input
                id="numero_etiqueta"
                name="numero_etiqueta"
                type="text"
                placeholder='Ej: "Equipo 1", "AC-201"'
                required
                defaultValue={equipo.numero_etiqueta}
                error={state?.fieldErrors?.numero_etiqueta?.[0]}
                className="mt-1.5 border-admin-border bg-admin-bg text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <Label htmlFor="marca" className="text-gray-300">
                Marca
              </Label>
              <Input
                id="marca"
                name="marca"
                type="text"
                placeholder="Ej: Carrier, Trane, York"
                defaultValue={equipo.marca ?? ""}
                error={state?.fieldErrors?.marca?.[0]}
                className="mt-1.5 border-admin-border bg-admin-bg text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <Label htmlFor="modelo" className="text-gray-300">
                Modelo
              </Label>
              <Input
                id="modelo"
                name="modelo"
                type="text"
                placeholder="Modelo del equipo"
                defaultValue={equipo.modelo ?? ""}
                error={state?.fieldErrors?.modelo?.[0]}
                className="mt-1.5 border-admin-border bg-admin-bg text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <Label htmlFor="numero_serie" className="text-gray-300">
                Numero de serie
              </Label>
              <Input
                id="numero_serie"
                name="numero_serie"
                type="text"
                placeholder="Numero de serie del equipo"
                defaultValue={equipo.numero_serie ?? ""}
                error={state?.fieldErrors?.numero_serie?.[0]}
                className="mt-1.5 border-admin-border bg-admin-bg text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <Label htmlFor="tipo_equipo" className="text-gray-300">
                Tipo de equipo
              </Label>
              <Input
                id="tipo_equipo"
                name="tipo_equipo"
                type="text"
                placeholder="Ej: Mini Split, Paquete, Chiller"
                defaultValue={equipo.tipo_equipo ?? ""}
                error={state?.fieldErrors?.tipo_equipo?.[0]}
                className="mt-1.5 border-admin-border bg-admin-bg text-white placeholder:text-gray-500"
              />
            </div>

            {/* Review status info */}
            {!equipo.revisado && (
              <div className="rounded-lg border border-yellow-800 bg-yellow-900/20 px-4 py-3">
                <p className="text-sm text-yellow-400">
                  Este equipo fue agregado por un tecnico y esta pendiente de
                  revision. Al guardar los cambios se marcara como revisado.
                </p>
              </div>
            )}

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
