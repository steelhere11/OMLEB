"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/types/actions";
import type { PlantillaPaso, TipoEquipo, EvidenciaRequerida, LecturaRequerida } from "@/types";

interface PlantillaFormProps {
  action: (
    prevState: ActionState | null,
    formData: FormData
  ) => Promise<ActionState>;
  tipos: TipoEquipo[];
  plantilla?: PlantillaPaso;
  submitLabel: string;
}

export function PlantillaForm({ action, tipos, plantilla, submitLabel }: PlantillaFormProps) {
  const [state, formAction, isPending] = useActionState<
    ActionState | null,
    FormData
  >(action, null);

  const [evidencia, setEvidencia] = useState<EvidenciaRequerida[]>(
    plantilla?.evidencia_requerida ?? []
  );
  const [lecturas, setLecturas] = useState<LecturaRequerida[]>(
    plantilla?.lecturas_requeridas ?? []
  );
  const [esObligatorio, setEsObligatorio] = useState(
    plantilla?.es_obligatorio ?? true
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

  const addLectura = () => {
    setLecturas([...lecturas, { nombre: "", unidad: "", rango_min: null, rango_max: null }]);
  };

  const removeLectura = (index: number) => {
    setLecturas(lecturas.filter((_, i) => i !== index));
  };

  const updateLectura = (
    index: number,
    field: keyof LecturaRequerida,
    value: string
  ) => {
    const updated = [...lecturas];
    if (field === "rango_min" || field === "rango_max") {
      updated[index] = { ...updated[index], [field]: value ? parseFloat(value) : null };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setLecturas(updated);
  };

  return (
    <div className="mx-auto max-w-[540px]">
      {/* Back link */}
      <Link
        href="/admin/mantenimientos-preventivos"
        className="mb-6 inline-flex items-center gap-1 text-[13px] text-text-2 transition-colors duration-[80ms] hover:text-text-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver a mantenimientos preventivos
      </Link>

      <h1 className="mb-6 text-[22px] font-bold tracking-[-0.025em] text-text-0">
        {plantilla ? "Editar Paso Preventivo" : "Crear Paso Preventivo"}
      </h1>

      <div className="rounded-[10px] border border-admin-border bg-admin-surface p-6">
        <form action={formAction} className="space-y-5">
          {/* Hidden field for es_obligatorio */}
          <input type="hidden" name="es_obligatorio" value={esObligatorio ? "true" : "false"} />

          {/* Tipo de Equipo */}
          <div>
            <Label htmlFor="tipo_equipo_slug" required className="text-[13px] text-text-1">
              Tipo de Equipo
            </Label>
            <select
              id="tipo_equipo_slug"
              name="tipo_equipo_slug"
              required
              defaultValue={plantilla?.tipo_equipo_slug ?? ""}
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

          {/* Orden */}
          <div>
            <Label htmlFor="orden" required className="text-[13px] text-text-1">
              Orden
            </Label>
            <Input
              id="orden"
              name="orden"
              type="number"
              min={1}
              step={1}
              placeholder="Ej: 1"
              required
              defaultValue={plantilla?.orden ?? ""}
              error={state?.fieldErrors?.orden?.[0]}
              className="mt-1.5 admin-input"
            />
          </div>

          {/* Nombre */}
          <div>
            <Label htmlFor="nombre" required className="text-[13px] text-text-1">
              Nombre del Paso
            </Label>
            <Input
              id="nombre"
              name="nombre"
              type="text"
              placeholder="Ej: Limpieza de filtros"
              required
              defaultValue={plantilla?.nombre ?? ""}
              error={state?.fieldErrors?.nombre?.[0]}
              className="mt-1.5 admin-input"
            />
          </div>

          {/* Procedimiento */}
          <div>
            <Label htmlFor="procedimiento" required className="text-[13px] text-text-1">
              Procedimiento
            </Label>
            <textarea
              id="procedimiento"
              name="procedimiento"
              placeholder="Descripcion detallada del procedimiento a seguir..."
              required
              defaultValue={plantilla?.procedimiento ?? ""}
              rows={4}
              className="mt-1.5 block w-full rounded-[6px] border border-admin-border bg-admin-surface px-3 py-2 text-[13px] text-text-0 transition-colors duration-[80ms] placeholder:text-text-3 focus:border-accent focus:outline-none"
            />
            {state?.fieldErrors?.procedimiento && (
              <p className="mt-1 text-[12px] text-status-error">
                {state.fieldErrors.procedimiento[0]}
              </p>
            )}
          </div>

          {/* Es Obligatorio toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-[13px] text-text-1">
                Es Obligatorio
              </Label>
              <p className="mt-0.5 text-[12px] text-text-3">
                Los pasos opcionales pueden ser omitidos por el tecnico
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={esObligatorio}
              onClick={() => setEsObligatorio(!esObligatorio)}
              className={[
                "relative inline-flex h-[22px] w-[40px] shrink-0 cursor-pointer items-center rounded-full transition-colors duration-150",
                esObligatorio ? "bg-accent" : "bg-admin-surface-elevated",
              ].join(" ")}
            >
              <span
                className={[
                  "pointer-events-none inline-block h-[16px] w-[16px] transform rounded-full bg-white shadow-sm transition-transform duration-150",
                  esObligatorio ? "translate-x-[20px]" : "translate-x-[3px]",
                ].join(" ")}
              />
            </button>
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

          {/* Lecturas Requeridas */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-[13px] text-text-1">
                Lecturas Requeridas
              </Label>
              <button
                type="button"
                onClick={addLectura}
                className="text-[12px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
              >
                + Agregar
              </button>
            </div>
            {lecturas.length === 0 && (
              <p className="mt-1.5 text-[12px] text-text-3">
                Sin lecturas requeridas. Usa &quot;Agregar&quot; para definir mediciones.
              </p>
            )}
            <div className="mt-2 space-y-2">
              {lecturas.map((lec, i) => (
                <div key={i} className="space-y-1.5 rounded-[6px] border border-admin-border-subtle p-2.5">
                  {/* Hidden fields for form submission */}
                  <input type="hidden" name={`lectura_nombre_${i}`} value={lec.nombre} />
                  <input type="hidden" name={`lectura_unidad_${i}`} value={lec.unidad} />
                  <input type="hidden" name={`lectura_min_${i}`} value={lec.rango_min ?? ""} />
                  <input type="hidden" name={`lectura_max_${i}`} value={lec.rango_max ?? ""} />

                  <div className="flex items-start gap-2">
                    <input
                      type="text"
                      value={lec.nombre}
                      onChange={(e) => updateLectura(i, "nombre", e.target.value)}
                      placeholder="Nombre (ej: Amperaje compresor)"
                      className="min-w-0 flex-1 rounded-[6px] border border-admin-border bg-admin-surface px-2 py-1.5 text-[12px] text-text-0 placeholder:text-text-3 focus:border-accent focus:outline-none"
                    />
                    <input
                      type="text"
                      value={lec.unidad}
                      onChange={(e) => updateLectura(i, "unidad", e.target.value)}
                      placeholder="Unidad (ej: A)"
                      className="w-[90px] shrink-0 rounded-[6px] border border-admin-border bg-admin-surface px-2 py-1.5 text-[12px] text-text-0 placeholder:text-text-3 focus:border-accent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeLectura(i)}
                      className="shrink-0 rounded-[4px] p-1 text-text-3 transition-colors duration-[80ms] hover:text-status-error"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      value={lec.rango_min ?? ""}
                      onChange={(e) => updateLectura(i, "rango_min", e.target.value)}
                      placeholder="Min"
                      className="w-[80px] rounded-[6px] border border-admin-border bg-admin-surface px-2 py-1.5 text-[12px] text-text-0 placeholder:text-text-3 focus:border-accent focus:outline-none"
                    />
                    <span className="text-[11px] text-text-3">a</span>
                    <input
                      type="number"
                      step="any"
                      value={lec.rango_max ?? ""}
                      onChange={(e) => updateLectura(i, "rango_max", e.target.value)}
                      placeholder="Max"
                      className="w-[80px] rounded-[6px] border border-admin-border bg-admin-surface px-2 py-1.5 text-[12px] text-text-0 placeholder:text-text-3 focus:border-accent focus:outline-none"
                    />
                    <span className="text-[11px] text-text-3">{lec.unidad || "unidad"}</span>
                  </div>
                </div>
              ))}
            </div>
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
