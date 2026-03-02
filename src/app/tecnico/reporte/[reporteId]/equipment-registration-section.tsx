"use client";

import { useState, useCallback } from "react";
import { EquipmentRegistrationCard } from "./equipment-registration-card";
import type { Equipo, ReporteFoto } from "@/types";

interface EquipmentEntry {
  reporteEquipoId: string;
  equipo: Equipo;
  tipoEquipoNombre: string | null;
  existingPhotos: {
    equipo_general: ReporteFoto | null;
    placa: ReporteFoto | null;
  };
  isComplete: boolean;
}

interface EquipmentRegistrationSectionProps {
  reporteId: string;
  entries: EquipmentEntry[];
  onAllComplete: () => void;
}

export function EquipmentRegistrationSection({
  reporteId,
  entries,
  onAllComplete,
}: EquipmentRegistrationSectionProps) {
  // Track per-equipment completion state
  const [completionMap, setCompletionMap] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      for (const entry of entries) {
        initial[entry.reporteEquipoId] = entry.isComplete;
      }
      return initial;
    }
  );

  const completedCount = Object.values(completionMap).filter(Boolean).length;
  const totalCount = entries.length;
  const allComplete = totalCount > 0 && completedCount === totalCount;

  const handleRegistrationChange = useCallback(
    (reporteEquipoId: string, complete: boolean) => {
      setCompletionMap((prev) => {
        const updated = { ...prev, [reporteEquipoId]: complete };
        // Check if all are now complete
        const allDone =
          Object.keys(updated).length > 0 &&
          Object.values(updated).every(Boolean);
        if (allDone) {
          // Schedule callback after render
          setTimeout(() => onAllComplete(), 0);
        }
        return updated;
      });
    },
    [onAllComplete]
  );

  if (entries.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-gray-400">
          No hay equipos asignados a este folio.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">
          Registro de Equipos
        </h4>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            allComplete
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              allComplete ? "bg-green-500" : "bg-blue-500"
            }`}
            style={{
              width: `${(completedCount / totalCount) * 100}%`,
            }}
          />
        </div>
      )}

      {/* Equipment cards */}
      <div className="space-y-3">
        {entries.map((entry) => (
          <EquipmentRegistrationCard
            key={entry.reporteEquipoId}
            reporteId={reporteId}
            reporteEquipoId={entry.reporteEquipoId}
            equipo={entry.equipo}
            tipoEquipoNombre={entry.tipoEquipoNombre}
            existingPhotos={entry.existingPhotos}
            isComplete={completionMap[entry.reporteEquipoId] ?? false}
            onRegistrationChange={handleRegistrationChange}
          />
        ))}
      </div>
    </div>
  );
}
