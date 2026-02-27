"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getCorrectiveIssues,
  getStepProgress,
  saveCorrectiveSelection,
} from "@/app/actions/workflows";
import { CorrectiveIssuePicker } from "./corrective-issue-picker";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { FallaCorrectiva } from "@/types";

interface WorkflowCorrectiveProps {
  reporteEquipoId: string;
  tipoEquipoSlug: string;
  isCompleted: boolean;
}

const etapaColors: Record<string, { bg: string; text: string; label: string }> =
  {
    antes: { bg: "bg-blue-50", text: "text-blue-600", label: "ANTES" },
    durante: { bg: "bg-amber-50", text: "text-amber-600", label: "DURANTE" },
    despues: { bg: "bg-green-50", text: "text-green-600", label: "DESPUÉS" },
  };

export function WorkflowCorrective({
  reporteEquipoId,
  tipoEquipoSlug,
  isCompleted,
}: WorkflowCorrectiveProps) {
  const [issues, setIssues] = useState<FallaCorrectiva[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [allIssues, savedProgress] = await Promise.all([
        getCorrectiveIssues(tipoEquipoSlug),
        getStepProgress(reporteEquipoId),
      ]);

      if (cancelled) return;

      setIssues(allIssues);

      // Pre-select issues from saved progress
      const savedIds = new Set<string>();
      for (const p of savedProgress) {
        if (p.falla_correctiva_id) {
          savedIds.add(p.falla_correctiva_id);
        }
      }
      setSelectedIds(savedIds);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reporteEquipoId, tipoEquipoSlug]);

  const handleToggle = useCallback((issueId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(issueId)) {
        next.delete(issueId);
      } else {
        next.add(issueId);
      }
      return next;
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const result = await saveCorrectiveSelection(reporteEquipoId, [
      ...selectedIds,
    ]);
    setSaving(false);
    if (result.success) {
      setSavedMessage("Seleccion guardada");
      setTimeout(() => setSavedMessage(null), 2000);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl border border-gray-200 bg-gray-50"
          />
        ))}
      </div>
    );
  }

  // No issues found — fallback to free-text
  if (issues.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">
            No hay fallas registradas para este tipo de equipo. Usa los campos
            de texto.
          </p>
        </div>
        <div>
          <Label className="mb-2">Diagnostico</Label>
          <Textarea
            placeholder="Describe el diagnostico del equipo..."
            disabled={isCompleted}
            className="min-h-[80px]"
          />
        </div>
        <div>
          <Label className="mb-2">Trabajo Realizado</Label>
          <Textarea
            placeholder="Describe el trabajo realizado..."
            disabled={isCompleted}
            className="min-h-[80px]"
          />
        </div>
      </div>
    );
  }

  const selectedIssues = issues.filter((i) => selectedIds.has(i.id));

  return (
    <div className="space-y-4">
      {/* Issue picker section */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">
          Selecciona las fallas encontradas
        </p>
        <p className="text-xs text-gray-400">
          {selectedIds.size} {selectedIds.size === 1 ? "falla seleccionada" : "fallas seleccionadas"}
        </p>
        <CorrectiveIssuePicker
          issues={issues}
          selectedIds={selectedIds}
          onToggle={handleToggle}
          disabled={isCompleted}
        />
      </div>

      {/* Selected issues detail */}
      {selectedIssues.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">
            Detalle de fallas seleccionadas
          </p>
          {selectedIssues.map((issue) => (
            <div
              key={issue.id}
              className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3"
            >
              {/* Issue name */}
              <p className="text-sm font-bold text-gray-900">{issue.nombre}</p>

              {/* Full diagnostic */}
              <div className="rounded-lg bg-white p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Diagnostico
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {issue.diagnostico}
                </p>
              </div>

              {/* Evidence photo placeholders */}
              {issue.evidencia_requerida.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-gray-500">
                    Evidencia fotográfica
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {issue.evidencia_requerida.map((ev, i) => {
                      const colors =
                        etapaColors[ev.etapa] ?? etapaColors.antes;
                      return (
                        <button
                          key={i}
                          type="button"
                          disabled
                          className={`flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-xs font-medium ${colors.bg} ${colors.text} border-current opacity-70`}
                          title={ev.descripcion}
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                            />
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

              {/* Typical materials */}
              {issue.materiales_tipicos.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-gray-500">
                    Materiales típicos
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {issue.materiales_tipicos.map((mat, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600"
                      >
                        {mat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Save button */}
      {!isCompleted && (
        <div className="flex items-center justify-end gap-3">
          {savedMessage && (
            <span className="text-sm font-medium text-green-600">
              {savedMessage}
            </span>
          )}
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSave}
            loading={saving}
            disabled={saving}
          >
            Guardar seleccion
          </Button>
        </div>
      )}
    </div>
  );
}
