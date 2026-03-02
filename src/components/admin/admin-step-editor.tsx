"use client";

import { useState, useTransition } from "react";
import type { LecturaRequerida } from "@/types";

// ---------- Types ----------

interface ReportePasoForEdit {
  id: string;
  completado: boolean;
  notas: string | null;
  lecturas: Record<string, number | string>;
  nombre_custom: string | null;
  plantillas_pasos: {
    nombre: string;
    procedimiento: string;
    lecturas_requeridas: LecturaRequerida[] | null;
  } | null;
  fallas_correctivas: { nombre: string; diagnostico: string } | null;
}

interface AdminStepEditorProps {
  paso: ReportePasoForEdit;
  onSave: (data: {
    lecturas?: Record<string, number | string>;
    notas?: string;
    completado?: boolean;
    nombre_custom?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

// ---------- Helpers ----------

function isOutOfRange(
  value: number,
  min: number | null,
  max: number | null
): boolean {
  if (min !== null && value < min) return true;
  if (max !== null && value > max) return true;
  return false;
}

function formatRange(min: number | null, max: number | null): string {
  if (min !== null && max !== null) return `${min} - ${max}`;
  if (min !== null) return `>= ${min}`;
  if (max !== null) return `<= ${max}`;
  return "";
}

// ---------- Component ----------

export function AdminStepEditor({
  paso,
  onSave,
  onCancel,
}: AdminStepEditorProps) {
  const lecturasDef = paso.plantillas_pasos?.lecturas_requeridas ?? [];
  const isCustom = !paso.plantillas_pasos && !paso.fallas_correctivas && !!paso.nombre_custom;
  const name =
    paso.plantillas_pasos?.nombre ??
    paso.fallas_correctivas?.nombre ??
    paso.nombre_custom ??
    "Paso";

  const [nombreCustom, setNombreCustom] = useState(paso.nombre_custom ?? "");
  const [lecturas, setLecturas] = useState<Record<string, number | string>>(
    () => ({ ...(paso.lecturas ?? {}) })
  );
  const [notas, setNotas] = useState(paso.notas ?? "");
  const [completado, setCompletado] = useState(paso.completado);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function updateLectura(key: string, value: string, unidad: string) {
    setLecturas((prev) => {
      const next = { ...prev };
      // For Si/No toggles and text fields, store as string
      if (unidad === "Si/No" || unidad === "texto") {
        next[key] = value;
      } else {
        // Numeric: store as number if valid, else as string
        const num = parseFloat(value);
        next[key] = isNaN(num) ? value : num;
      }
      return next;
    });
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        const saveData: {
          lecturas?: Record<string, number | string>;
          notas?: string;
          completado?: boolean;
          nombre_custom?: string;
        } = { lecturas, notas, completado };

        if (isCustom) {
          saveData.nombre_custom = nombreCustom.trim() || undefined;
        }

        await onSave(saveData);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Error al guardar"
        );
      }
    });
  }

  return (
    <div className="rounded-[6px] border border-accent/30 bg-accent/5 px-3 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-text-0">
          Editando: {name}
        </p>
      </div>

      {/* Nombre custom (editable only for custom steps) */}
      {isCustom && (
        <div>
          <label className="mb-0.5 block text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
            Nombre del paso
          </label>
          <input
            type="text"
            value={nombreCustom}
            onChange={(e) => setNombreCustom(e.target.value)}
            className="w-full rounded-[6px] border border-admin-border bg-admin-surface px-2.5 py-1 text-[13px] text-text-1"
            placeholder="Nombre del paso personalizado..."
          />
        </div>
      )}

      {/* Lecturas */}
      {lecturasDef.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
            Lecturas
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {lecturasDef.map((def) => {
              const currentValue = lecturas[def.nombre] ?? "";
              const isSiNo = def.unidad === "Si/No";
              const isTexto = def.unidad === "texto";
              const isNumeric = !isSiNo && !isTexto;
              const numVal =
                isNumeric && currentValue !== ""
                  ? parseFloat(String(currentValue))
                  : NaN;
              const outOfRange =
                isNumeric &&
                !isNaN(numVal) &&
                isOutOfRange(numVal, def.rango_min, def.rango_max);
              const rangeHint = isNumeric
                ? formatRange(def.rango_min, def.rango_max)
                : "";

              return (
                <div key={def.nombre}>
                  <label className="mb-0.5 block text-[11px] font-medium text-text-2">
                    {def.nombre}
                    {rangeHint && (
                      <span className="ml-1 font-normal text-text-3">
                        ({rangeHint} {def.unidad})
                      </span>
                    )}
                    {isTexto && (
                      <span className="ml-1 font-normal text-text-3">(texto)</span>
                    )}
                  </label>

                  {isSiNo ? (
                    <button
                      type="button"
                      onClick={() =>
                        updateLectura(
                          def.nombre,
                          String(currentValue) === "Si" ? "No" : "Si",
                          def.unidad
                        )
                      }
                      className={`rounded-[6px] px-3 py-1 text-[12px] font-medium transition-colors duration-[80ms] ${
                        String(currentValue) === "Si"
                          ? "bg-status-success text-white"
                          : "border border-admin-border bg-admin-surface text-text-2"
                      }`}
                    >
                      {String(currentValue) === "Si" ? "Si" : "No"}
                    </button>
                  ) : (
                    <input
                      type={isNumeric ? "number" : "text"}
                      step={isNumeric ? "any" : undefined}
                      value={String(currentValue)}
                      onChange={(e) =>
                        updateLectura(def.nombre, e.target.value, def.unidad)
                      }
                      className={`w-full rounded-[6px] border px-2.5 py-1 text-[13px] text-text-1 ${
                        outOfRange
                          ? "border-amber-400 bg-amber-50"
                          : "border-admin-border bg-admin-surface"
                      }`}
                    />
                  )}

                  {outOfRange && (
                    <p className="mt-0.5 text-[11px] text-amber-600">
                      Fuera de rango ({rangeHint} {def.unidad})
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notas */}
      <div>
        <label className="mb-0.5 block text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
          Notas
        </label>
        <textarea
          rows={2}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          className="w-full rounded-[6px] border border-admin-border bg-admin-surface px-2.5 py-1.5 text-[13px] text-text-1"
          placeholder="Notas del paso..."
        />
      </div>

      {/* Completado toggle */}
      <div className="flex items-center gap-2">
        <label className="text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
          Completado
        </label>
        <button
          type="button"
          onClick={() => setCompletado((v) => !v)}
          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-150 ${
            completado ? "bg-status-success" : "bg-gray-300"
          }`}
          role="switch"
          aria-checked={completado}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-150 ${
              completado ? "translate-x-[18px]" : "translate-x-[3px]"
            }`}
          />
        </button>
        <span className="text-[12px] text-text-2">
          {completado ? "Si" : "No"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {error && (
          <span className="text-[12px] text-red-600">{error}</span>
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={onCancel}
          className="text-[12px] font-medium text-text-2 transition-colors duration-[80ms] hover:text-text-0"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-[6px] bg-accent px-3 py-1 text-[12px] font-medium text-white transition-colors duration-[80ms] hover:bg-accent/90 disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}
