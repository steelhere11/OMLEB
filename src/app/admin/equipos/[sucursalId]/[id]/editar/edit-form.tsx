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
    <div className="mx-auto max-w-[480px]">
      {/* Back link */}
      <Link
        href={`/admin/equipos/${sucursalId}`}
        className="mb-6 inline-flex items-center gap-1 text-[13px] text-text-2 transition-colors duration-[80ms] hover:text-text-1"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5"
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

      <h1 className="mb-6 text-[22px] font-bold tracking-[-0.025em] text-text-0">
        Editar Equipo
      </h1>

      <div className="rounded-[10px] border border-admin-border bg-admin-surface p-6">
        <form action={formAction} className="space-y-5">
          {/* Hidden sucursal_id (for validation, not updated) */}
          <input type="hidden" name="sucursal_id" value={sucursalId} />

          <div>
            <Label
              htmlFor="numero_etiqueta"
              required
              className="text-[13px] text-text-1"
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
              className="mt-1.5 admin-input"
            />
          </div>

          <div>
            <Label htmlFor="marca" className="text-[13px] text-text-1">
              Marca
            </Label>
            <Input
              id="marca"
              name="marca"
              type="text"
              placeholder="Ej: Carrier, Trane, York"
              defaultValue={equipo.marca ?? ""}
              error={state?.fieldErrors?.marca?.[0]}
              className="mt-1.5 admin-input"
            />
          </div>

          <div>
            <Label htmlFor="modelo" className="text-[13px] text-text-1">
              Modelo
            </Label>
            <Input
              id="modelo"
              name="modelo"
              type="text"
              placeholder="Modelo del equipo"
              defaultValue={equipo.modelo ?? ""}
              error={state?.fieldErrors?.modelo?.[0]}
              className="mt-1.5 admin-input"
            />
          </div>

          <div>
            <Label htmlFor="numero_serie" className="text-[13px] text-text-1">
              Numero de serie
            </Label>
            <Input
              id="numero_serie"
              name="numero_serie"
              type="text"
              placeholder="Numero de serie del equipo"
              defaultValue={equipo.numero_serie ?? ""}
              error={state?.fieldErrors?.numero_serie?.[0]}
              className="mt-1.5 admin-input"
            />
          </div>

          <div>
            <Label htmlFor="tipo_equipo" className="text-[13px] text-text-1">
              Tipo de equipo
            </Label>
            <Input
              id="tipo_equipo"
              name="tipo_equipo"
              type="text"
              placeholder="Ej: Mini Split, Paquete, Chiller"
              defaultValue={equipo.tipo_equipo ?? ""}
              error={state?.fieldErrors?.tipo_equipo?.[0]}
              className="mt-1.5 admin-input"
            />
          </div>

          {/* Review status info */}
          {!equipo.revisado && (
            <div className="rounded-[6px] border border-status-warning/30 bg-admin-surface px-4 py-3">
              <p className="text-[13px] text-status-warning">
                Este equipo fue agregado por un tecnico y esta pendiente de
                revision. Al guardar los cambios se marcara como revisado.
              </p>
            </div>
          )}

          {/* Error message */}
          {state?.error && (
            <div className="rounded-[6px] border border-status-error/30 bg-admin-surface px-4 py-3">
              <p className="text-[13px] text-status-error">{state.error}</p>
            </div>
          )}

          <Button type="submit" variant="outline" fullWidth loading={isPending}>
            Guardar Cambios
          </Button>
        </form>
      </div>
    </div>
  );
}
