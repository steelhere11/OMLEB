"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createEquipo } from "@/app/actions/equipos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { TipoEquipo } from "@/types";
import type { ActionState } from "@/types/actions";
import { REFRIGERANTES, VOLTAJES, FASES } from "@/lib/constants/nameplate-options";
import { UBICACIONES_BBVA } from "@/lib/constants/ubicaciones";

interface CreateEquipoFormProps {
  sucursalId: string;
  tiposEquipo: TipoEquipo[];
}

export function CreateEquipoForm({ sucursalId, tiposEquipo }: CreateEquipoFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<
    ActionState | null,
    FormData
  >(createEquipo, null);

  const [selectedTipoId, setSelectedTipoId] = useState("");
  const [customTipoText, setCustomTipoText] = useState("");

  const otroTipo = tiposEquipo.find((t) => t.slug === "otro");
  const isOtroSelected = selectedTipoId === otroTipo?.id;

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
          {/* Hidden tipo_equipo_id */}
          <input type="hidden" name="tipo_equipo_id" value={selectedTipoId} />
          {/* Hidden tipo_equipo text (backward compat) */}
          <input
            type="hidden"
            name="tipo_equipo"
            value={
              isOtroSelected && customTipoText
                ? customTipoText
                : tiposEquipo.find((t) => t.id === selectedTipoId)?.nombre ?? ""
            }
          />

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
            <Label htmlFor="tipo_equipo_select" className="text-[13px] text-text-1">
              Tipo de equipo
            </Label>
            <Select
              id="tipo_equipo_select"
              value={selectedTipoId}
              onChange={(e) => {
                setSelectedTipoId(e.target.value);
                if (e.target.value !== otroTipo?.id) {
                  setCustomTipoText("");
                }
              }}
              className="mt-1.5 admin-input"
            >
              <option value="">Seleccionar tipo...</option>
              {tiposEquipo.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </Select>
            {isOtroSelected && (
              <div className="mt-2">
                <Input
                  placeholder="Especifica el tipo de equipo..."
                  value={customTipoText}
                  onChange={(e) => setCustomTipoText(e.target.value)}
                  className="admin-input"
                />
              </div>
            )}
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
            <Label htmlFor="capacidad" className="text-[13px] text-text-1">
              Capacidad
            </Label>
            <Input
              id="capacidad"
              name="capacidad"
              type="text"
              placeholder="Ej: 5 Ton, 60000 BTU"
              error={state?.fieldErrors?.capacidad?.[0]}
              className="mt-1.5 admin-input"
            />
          </div>

          <div>
            <Label htmlFor="refrigerante" className="text-[13px] text-text-1">
              Refrigerante
            </Label>
            <Select
              id="refrigerante"
              name="refrigerante"
              defaultValue=""
              className="mt-1.5 admin-input"
            >
              <option value="">Seleccionar...</option>
              {REFRIGERANTES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="voltaje" className="text-[13px] text-text-1">
              Voltaje
            </Label>
            <Select
              id="voltaje"
              name="voltaje"
              defaultValue=""
              className="mt-1.5 admin-input"
            >
              <option value="">Seleccionar...</option>
              {VOLTAJES.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="fase" className="text-[13px] text-text-1">
              Fase
            </Label>
            <Select
              id="fase"
              name="fase"
              defaultValue=""
              className="mt-1.5 admin-input"
            >
              <option value="">Seleccionar...</option>
              {FASES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="ubicacion" className="text-[13px] text-text-1">
              Ubicacion
            </Label>
            <Select
              id="ubicacion"
              name="ubicacion"
              defaultValue=""
              className="mt-1.5 admin-input"
            >
              <option value="">Seleccionar...</option>
              {UBICACIONES_BBVA.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </Select>
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
