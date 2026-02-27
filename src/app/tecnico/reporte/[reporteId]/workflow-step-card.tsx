"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ReadingInput } from "./reading-input";
import type { PlantillaPaso, ReportePaso } from "@/types";

interface WorkflowStepCardProps {
  paso: PlantillaPaso;
  stepNumber: number;
  totalSteps: number;
  savedProgress: ReportePaso | null;
  onProgressChange: (
    pasoId: string,
    data: {
      completado: boolean;
      notas: string;
      lecturas: Record<string, number | string>;
    }
  ) => void;
  isCompleted: boolean;
  autoExpand: boolean;
}

const etapaColors: Record<string, { bg: string; text: string; label: string }> =
  {
    antes: { bg: "bg-blue-50", text: "text-blue-600", label: "ANTES" },
    durante: { bg: "bg-amber-50", text: "text-amber-600", label: "DURANTE" },
    despues: { bg: "bg-green-50", text: "text-green-600", label: "DESPUÉS" },
  };

export function WorkflowStepCard({
  paso,
  stepNumber,
  totalSteps,
  savedProgress,
  onProgressChange,
  isCompleted,
  autoExpand,
}: WorkflowStepCardProps) {
  const [expanded, setExpanded] = useState(autoExpand);
  const [completado, setCompletado] = useState(
    savedProgress?.completado ?? false
  );
  const [notas, setNotas] = useState(savedProgress?.notas ?? "");
  const [lecturas, setLecturas] = useState<Record<string, number | string>>(
    savedProgress?.lecturas ?? {}
  );
  const [saving, setSaving] = useState(false);

  // Auto-save when completado changes
  useEffect(() => {
    // Skip initial render if nothing changed
    if (
      completado === (savedProgress?.completado ?? false) &&
      notas === (savedProgress?.notas ?? "")
    ) {
      return;
    }
    const timer = setTimeout(() => {
      onProgressChange(paso.id, { completado, notas, lecturas });
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completado]);

  const handleToggleComplete = () => {
    if (isCompleted) return;
    const newVal = !completado;
    setCompletado(newVal);
    setSaving(true);
    // Debounce handles the actual save
    setTimeout(() => setSaving(false), 600);
  };

  const handleSaveReadingsAndNotes = () => {
    setSaving(true);
    onProgressChange(paso.id, { completado, notas, lecturas });
    setTimeout(() => setSaving(false), 600);
  };

  const updateLectura = (nombre: string, value: string | number) => {
    setLecturas((prev) => ({ ...prev, [nombre]: value }));
  };

  const evidencia = paso.evidencia_requerida ?? [];
  const lecturasRequeridas = paso.lecturas_requeridas ?? [];
  const hasReadingsOrNotes = lecturasRequeridas.length > 0 || true; // always show notas

  return (
    <div
      className={`rounded-xl border bg-white overflow-hidden ${
        completado ? "border-l-4 border-l-green-500 border-gray-200" : "border-gray-200"
      }`}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors active:bg-gray-50"
      >
        {/* Step number circle */}
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            completado
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {completado ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            stepNumber
          )}
        </div>

        {/* Step name */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${completado ? "text-green-700" : "text-gray-900"}`}>
            {paso.nombre}
          </p>
          <p className="text-xs text-gray-400">
            Paso {stepNumber} de {totalSteps}
            {!paso.es_obligatorio && " — Opcional"}
          </p>
        </div>

        {/* Chevron */}
        <svg
          className={`h-5 w-5 flex-shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {/* Procedure text */}
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">
              Procedimiento
            </p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {paso.procedimiento}
            </p>
          </div>

          {/* Evidence photo placeholders */}
          {evidencia.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">
                Evidencia fotográfica
              </p>
              <div className="flex flex-wrap gap-2">
                {evidencia.map((ev, i) => {
                  const colors = etapaColors[ev.etapa] ?? etapaColors.antes;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled
                      className={`flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-xs font-medium ${colors.bg} ${colors.text} border-current opacity-70`}
                      title={ev.descripcion}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {colors.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 italic">
                Fotos se habilitaran en la siguiente fase
              </p>
            </div>
          )}

          {/* Reading inputs */}
          {lecturasRequeridas.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-500">Lecturas</p>
              {lecturasRequeridas.map((lec) => (
                <ReadingInput
                  key={lec.nombre}
                  lectura={lec}
                  value={lecturas[lec.nombre] ?? ""}
                  onChange={(val) => updateLectura(lec.nombre, val)}
                  disabled={isCompleted}
                />
              ))}
            </div>
          )}

          {/* Notes */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">
              Notas del paso
            </p>
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas adicionales sobre este paso..."
              disabled={isCompleted}
              className="min-h-[60px]"
            />
          </div>

          {/* Save readings/notes + Complete toggle */}
          {!isCompleted && (
            <div className="flex items-center justify-between pt-1">
              {hasReadingsOrNotes && (
                <button
                  type="button"
                  onClick={handleSaveReadingsAndNotes}
                  disabled={saving}
                  className="text-sm font-medium text-brand-600 underline disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar lecturas"}
                </button>
              )}
              <button
                type="button"
                onClick={handleToggleComplete}
                disabled={saving}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  completado
                    ? "bg-green-100 text-green-700 active:bg-green-200"
                    : "bg-green-500 text-white active:bg-green-600"
                } disabled:opacity-50`}
              >
                {completado ? (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Completado
                  </>
                ) : (
                  "Marcar como completado"
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
