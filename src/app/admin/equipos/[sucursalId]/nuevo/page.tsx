"use client";

import { useActionState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createEquipo } from "@/app/actions/equipos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/types/actions";

export default function NuevoEquipoPage() {
  const { sucursalId } = useParams<{ sucursalId: string }>();
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<
    ActionState | null,
    FormData
  >(createEquipo, null);

  useEffect(() => {
    if (state?.success) {
      router.push(`/admin/equipos/${sucursalId}`);
    }
  }, [state?.success, sucursalId, router]);

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
        Crear Equipo
      </h1>

      <div className="rounded-[10px] border border-admin-border bg-admin-surface p-6">
        <form action={formAction} className="space-y-5">
          {/* Hidden sucursal_id */}
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
              error={state?.fieldErrors?.tipo_equipo?.[0]}
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
            Crear Equipo
          </Button>
        </form>
      </div>
    </div>
  );
}
