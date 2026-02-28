"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getWorkflowTemplates,
  getStepProgress,
  saveStepProgress,
} from "@/app/actions/workflows";
import { WorkflowStepCard } from "./workflow-step-card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { PlantillaPaso, ReportePaso } from "@/types";

interface WorkflowPreventiveProps {
  reporteEquipoId: string;
  tipoEquipoSlug: string;
  isCompleted: boolean;
  reporteId: string;
  equipoId: string;
}

export function WorkflowPreventive({
  reporteEquipoId,
  tipoEquipoSlug,
  isCompleted,
  reporteId,
  equipoId,
}: WorkflowPreventiveProps) {
  const [steps, setSteps] = useState<PlantillaPaso[]>([]);
  const [progress, setProgress] = useState<Map<string, ReportePaso>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [templates, saved] = await Promise.all([
        getWorkflowTemplates(tipoEquipoSlug, "preventivo"),
        getStepProgress(reporteEquipoId),
      ]);

      if (cancelled) return;

      setSteps(templates);

      const progressMap = new Map<string, ReportePaso>();
      for (const s of saved) {
        if (s.plantilla_paso_id) {
          progressMap.set(s.plantilla_paso_id, s);
        }
      }
      setProgress(progressMap);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reporteEquipoId, tipoEquipoSlug]);

  const handleProgressChange = useCallback(
    async (
      pasoId: string,
      data: {
        completado: boolean;
        notas: string;
        lecturas: Record<string, number | string>;
      }
    ) => {
      // Optimistic update
      setProgress((prev) => {
        const next = new Map(prev);
        const existing = next.get(pasoId);
        next.set(pasoId, {
          id: existing?.id ?? "",
          reporte_equipo_id: reporteEquipoId,
          plantilla_paso_id: pasoId,
          falla_correctiva_id: null,
          completado: data.completado,
          notas: data.notas || null,
          lecturas: data.lecturas,
          completed_at: data.completado ? new Date().toISOString() : null,
        });
        return next;
      });

      await saveStepProgress(reporteEquipoId, pasoId, data);
    },
    [reporteEquipoId]
  );

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

  // No templates found — fallback to free-text
  if (steps.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-500">
            No hay plantilla de mantenimiento para este tipo de equipo. Usa los
            campos de texto.
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

  // Progress bar
  const completedCount = steps.filter(
    (s) => progress.get(s.id)?.completado
  ).length;
  const progressPercent =
    steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  // Find first incomplete step for auto-expand
  const firstIncompleteIndex = steps.findIndex(
    (s) => !progress.get(s.id)?.completado
  );

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500">
            Progreso del mantenimiento
          </p>
          <p className="text-xs font-medium text-gray-700">
            {completedCount} de {steps.length} pasos
          </p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step cards */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <WorkflowStepCard
            key={step.id}
            paso={step}
            stepNumber={index + 1}
            totalSteps={steps.length}
            savedProgress={progress.get(step.id) ?? null}
            onProgressChange={handleProgressChange}
            isCompleted={isCompleted}
            autoExpand={index === firstIncompleteIndex}
            reporteId={reporteId}
            equipoId={equipoId}
          />
        ))}
      </div>
    </div>
  );
}
