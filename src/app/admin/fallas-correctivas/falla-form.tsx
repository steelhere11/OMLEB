"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/types/actions";
import type { FallaCorrectiva, TipoEquipo, EvidenciaRequerida } from "@/types";

interface FallaFormProps {
  action: (
    prevState: ActionState | null,
    formData: FormData
  ) => Promise<ActionState>;
  tipos: TipoEquipo[];
  falla?: FallaCorrectiva;
  submitLabel: string;
}

export function FallaForm({ action, tipos, falla, submitLabel }: FallaFormProps) {
  const [state, formAction, isPending] = useActionState<
    ActionState | null,
    FormData
  >(action, null);

  const [evidencia, setEvidencia] = useState<EvidenciaRequerida[]>(
    falla?.evidencia_requerida ?? []
  );
  const [materiales, setMateriales] = useState(
    falla?.materiales_tipicos.join(", ") ?? ""
  );

  const addEvidencia = () => {
    setEvidencia([...evidencia, { etapa: "antes", descripcion: "" }]);
  };

  const removeEvidencia = (index: number) => {
    setEvidencia(evidencia.filter((_, i) => i !== index));
  };

  const updateEvidencia = (
    index: number,
    field: "etapa" | "descripcion",
    value: string
  ) => {
    const updated = [...evidencia];
    if (field === "etapa") {
      updated[index] = { ...updated[index], etapa: value as EvidenciaRequerida["etapa"] };
    } else {
      updated[index] = { ...updated[index], descripcion: value };
    }
    setEvidencia(updated);
  };

  return (
    <div className="mx-auto max-w-[540px]">
      {/* Back link */}
      <Link
        href="/admin/fallas-correctivas"
        className="mb-6 inline-flex items-center gap-1 text-[13px] text-text-2 transition-colors duration-[80ms] hover:text-text-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver a fallas correctivas
      </Link>

      <h1 className="mb-6 text-[22px] font-bold tracking-[-0.025em] text-text-0">
        {falla ? "Editar Falla Correctiva" : "Crear Falla Correctiva"}
      </h1>

      <div className="rounded-[10px] border border-admin-border bg-admin-surface p-6">
        <form action={formAction} className="space-y-5">
          {/* Tipo de Equipo */}
          <div>
            <Label htmlFor="tipo_equipo_slug" required className="text-[13px] text-text-1">
              Tipo de Equipo
            </Label>
            <select
              id="tipo_equipo_slug"
              name="tipo_equipo_slug"
              required
              defaultValue={falla?.tipo_equipo_slug ?? ""}
              className="mt-1.5 block w-full rounded-[6px] border border-admin-border bg-admin-surface px-3 py-2 text-[13px] text-text-0 transition-colors duration-[80ms] focus:border-accent focus:outline-none"
            >
              <option value="">Seleccionar tipo...</option>
              {tipos.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.nombre}
                </option>
              ))}
            </select>
            {state?.fieldErrors?.tipo_equipo_slug && (
              <p className="mt-1 text-[12px] text-status-error">
                {state.fieldErrors.tipo_equipo_slug[0]}
              </p>
            )}
          </div>

          {/* Nombre */}
          <div>
            <Label htmlFor="nombre" required className="text-[13px] text-text-1">
              Nombre de la Falla
            </Label>
            <Input
              id="nombre"
              name="nombre"
              type="text"
              placeholder="Ej: Fuga de refrigerante"
              required
              defaultValue={falla?.nombre ?? ""}
              error={state?.fieldErrors?.nombre?.[0]}
              className="mt-1.5 admin-input"
            />
          </div>

          {/* Diagnostico */}
          <div>
            <Label htmlFor="diagnostico" required className="text-[13px] text-text-1">
              Diagnostico
            </Label>
            <textarea
              id="diagnostico"
              name="diagnostico"
              placeholder="Descripcion detallada del diagnostico y procedimiento..."
              required
              defaultValue={falla?.diagnostico ?? ""}
              rows={4}
              className="mt-1.5 block w-full rounded-[6px] border border-admin-border bg-admin-surface px-3 py-2 text-[13px] text-text-0 transition-colors duration-[80ms] placeholder:text-text-3 focus:border-accent focus:outline-none"
            />
            {state?.fieldErrors?.diagnostico && (
              <p className="mt-1 text-[12px] text-status-error">
                {state.fieldErrors.diagnostico[0]}
              </p>
            )}
          </div>

          {/* Evidencia Requerida */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-[13px] text-text-1">
                Evidencia Requerida
              </Label>
              <button
                type="button"
                onClick={addEvidencia}
                className="text-[12px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
              >
                + Agregar
              </button>
            </div>
            {evidencia.length === 0 && (
              <p className="mt-1.5 text-[12px] text-text-3">
                Sin evidencia requerida. Usa &quot;Agregar&quot; para definir fotos requeridas.
              </p>
            )}
            <div className="mt-2 space-y-2">
              {evidencia.map((ev, i) => (
                <div key={i} className="flex items-start gap-2">
                  <input
                    type="hidden"
                    name={`evidencia_etapa_${i}`}
                    value={ev.etapa}
                  />
                  <input
                    type="hidden"
                    name={`evidencia_desc_${i}`}
                    value={ev.descripcion}
                  />
                  <select
                    value={ev.etapa}
                    onChange={(e) => updateEvidencia(i, "etapa", e.target.value)}
                    className="w-[100px] shrink-0 rounded-[6px] border border-admin-border bg-admin-surface px-2 py-1.5 text-[12px] text-text-0 focus:border-accent focus:outline-none"
                  >
                    <option value="antes">Antes</option>
                    <option value="durante">Durante</option>
                    <option value="despues">Despues</option>
                  </select>
                  <input
                    type="text"
                    value={ev.descripcion}
                    onChange={(e) =>
                      updateEvidencia(i, "descripcion", e.target.value)
                    }
                    placeholder="Descripcion de la foto..."
                    className="min-w-0 flex-1 rounded-[6px] border border-admin-border bg-admin-surface px-2 py-1.5 text-[12px] text-text-0 placeholder:text-text-3 focus:border-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeEvidencia(i)}
                    className="shrink-0 rounded-[4px] p-1 text-text-3 transition-colors duration-[80ms] hover:text-status-error"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Materiales Tipicos */}
          <div>
            <Label htmlFor="materiales_tipicos" className="text-[13px] text-text-1">
              Materiales Tipicos
            </Label>
            <p className="mt-0.5 text-[12px] text-text-3">
              Separados por comas
            </p>
            <input
              id="materiales_tipicos"
              name="materiales_tipicos"
              type="text"
              value={materiales}
              onChange={(e) => setMateriales(e.target.value)}
              placeholder="Ej: Refrigerante R410a, Valvula de servicio, Soldadura de plata"
              className="mt-1.5 block w-full rounded-[6px] border border-admin-border bg-admin-surface px-3 py-2 text-[13px] text-text-0 placeholder:text-text-3 transition-colors duration-[80ms] focus:border-accent focus:outline-none"
            />
            {materiales && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {materiales
                  .split(",")
                  .map((m) => m.trim())
                  .filter(Boolean)
                  .map((m, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-admin-surface-elevated px-2 py-0.5 text-[11px] text-text-2"
                    >
                      {m}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Error message */}
          {state?.error && (
            <div className="rounded-[6px] border border-status-error/30 bg-admin-surface px-4 py-3">
              <p className="text-[13px] text-status-error">{state.error}</p>
            </div>
          )}

          <Button type="submit" variant="outline" fullWidth loading={isPending}>
            {submitLabel}
          </Button>
        </form>
      </div>
    </div>
  );
}
