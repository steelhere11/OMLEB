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
    <div className="mx-auto max-w-[480px]">
      {/* Back link */}
      <Link
        href="/admin/sucursales"
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
        Volver a sucursales
      </Link>

      <h1 className="mb-6 text-[22px] font-bold tracking-[-0.025em] text-text-0">
        Editar Sucursal
      </h1>

      <div className="rounded-[10px] border border-admin-border bg-admin-surface p-6">
        <form action={formAction} className="space-y-5">
          <div>
            <Label htmlFor="nombre" required className="text-[13px] text-text-1">
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
              className="mt-1.5 admin-input"
            />
          </div>

          <div>
            <Label htmlFor="numero" required className="text-[13px] text-text-1">
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
              className="mt-1.5 admin-input"
            />
          </div>

          <div>
            <Label htmlFor="direccion" required className="text-[13px] text-text-1">
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
              className="mt-1.5 admin-input"
            />
          </div>

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
