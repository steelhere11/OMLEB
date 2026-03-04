"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getWorkflowTemplates,
  getStepProgress,
  saveStepProgress,
  ensureStepProgress,
} from "@/app/actions/workflows";
import { WorkflowStepCard } from "./workflow-step-card";
import { CustomStepCard } from "./custom-step-card";
import { CustomStepForm } from "@/components/tecnico/custom-step-form";
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
  const [customSteps, setCustomSteps] = useState<ReportePaso[]>([]);
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
      const custom: ReportePaso[] = [];
      for (const s of saved) {
        if (s.plantilla_paso_id) {
          progressMap.set(s.plantilla_paso_id, s);
        } else if (!s.falla_correctiva_id && s.nombre_custom) {
          custom.push(s);
        }
      }
      setProgress(progressMap);
      setCustomSteps(custom);
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
          nombre_custom: null,
          completado: data.completado,
          notas: data.notas || null,
          lecturas: data.lecturas,
          completed_at: data.completado ? new Date().toISOString() : null,
        });
        return next;
      });

      const result = await saveStepProgress(reporteEquipoId, pasoId, data);

      // Update progress map with real DB ID
      if (result.success && result.stepId) {
        setProgress((prev) => {
          const next = new Map(prev);
          const existing = next.get(pasoId);
          if (existing) {
            next.set(pasoId, { ...existing, id: result.stepId! });
          }
          return next;
        });
      }
    },
    [reporteEquipoId]
  );

  // Ensure a step row exists in DB (for photo uploads before step is saved)
  const handleEnsureStep = useCallback(
    async (plantillaPasoId: string): Promise<string | null> => {
      // Check if we already have the ID
      const existing = progress.get(plantillaPasoId);
      if (existing?.id) return existing.id;

      const stepId = await ensureStepProgress(reporteEquipoId, plantillaPasoId);
      if (stepId) {
        setProgress((prev) => {
          const next = new Map(prev);
          const existingEntry = next.get(plantillaPasoId);
          next.set(plantillaPasoId, {
            id: stepId,
            reporte_equipo_id: reporteEquipoId,
            plantilla_paso_id: plantillaPasoId,
            falla_correctiva_id: null,
            nombre_custom: null,
            completado: existingEntry?.completado ?? false,
            notas: existingEntry?.notas ?? null,
            lecturas: existingEntry?.lecturas ?? {},
            completed_at: existingEntry?.completed_at ?? null,
          });
          return next;
        });
      }
      return stepId;
    },
    [reporteEquipoId, progress]
  );

  const handleCustomStepAdded = useCallback((step: ReportePaso) => {
    setCustomSteps((prev) => [...prev, step]);
  }, []);

  const handleCustomStepDeleted = useCallback((stepId: string) => {
    setCustomSteps((prev) => prev.filter((s) => s.id !== stepId));
  }, []);

  const handleCustomStepProgress = useCallback((updated: ReportePaso) => {
    setCustomSteps((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  }, []);

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

  // No templates found — fallback to free-text (still show custom step form)
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

        {/* Custom steps even when no templates */}
        {customSteps.length > 0 && (
          <div className="space-y-3">
            {customSteps.map((cs, idx) => (
              <CustomStepCard
                key={cs.id}
                step={cs}
                stepNumber={idx + 1}
                totalSteps={customSteps.length}
                isCompleted={isCompleted}
                autoExpand={false}
                reporteId={reporteId}
                equipoId={equipoId}
                onDeleted={handleCustomStepDeleted}
                onProgressChange={handleCustomStepProgress}
              />
            ))}
          </div>
        )}

        <CustomStepForm
          reporteEquipoId={reporteEquipoId}
          onStepAdded={handleCustomStepAdded}
          disabled={isCompleted}
        />
      </div>
    );
  }

  // Total steps = template steps + custom steps
  const totalSteps = steps.length + customSteps.length;

  // Progress bar
  const templateCompleted = steps.filter(
    (s) => progress.get(s.id)?.completado
  ).length;
  const customCompleted = customSteps.filter((s) => s.completado).length;
  const completedCount = templateCompleted + customCompleted;
  const progressPercent =
    totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

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
            {completedCount} de {totalSteps} pasos
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
            totalSteps={totalSteps}
            savedProgress={progress.get(step.id) ?? null}
            onProgressChange={handleProgressChange}
            onEnsureStep={handleEnsureStep}
            isCompleted={isCompleted}
            autoExpand={index === firstIncompleteIndex}
            reporteId={reporteId}
            equipoId={equipoId}
          />
        ))}

        {/* Custom steps */}
        {customSteps.map((cs, idx) => (
          <CustomStepCard
            key={cs.id}
            step={cs}
            stepNumber={steps.length + idx + 1}
            totalSteps={totalSteps}
            isCompleted={isCompleted}
            autoExpand={false}
            reporteId={reporteId}
            equipoId={equipoId}
            onDeleted={handleCustomStepDeleted}
            onProgressChange={handleCustomStepProgress}
          />
        ))}
      </div>

      {/* Add custom step button */}
      <CustomStepForm
        reporteEquipoId={reporteEquipoId}
        onStepAdded={handleCustomStepAdded}
        disabled={isCompleted}
      />
    </div>
  );
}
