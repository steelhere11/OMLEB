"use client";

import { useState, useActionState } from "react";
import { updateReportStatus } from "@/app/actions/reportes";
import { Button } from "@/components/ui/button";
import type { ReporteEstatus } from "@/types";

interface StatusSectionProps {
  reporteId: string;
  currentStatus: ReporteEstatus;
  hasEquipmentEntries: boolean;
  isCompleted: boolean;
}

const STATUS_OPTIONS: {
  value: ReporteEstatus;
  label: string;
  sublabel: string;
  color: {
    bg: string;
    border: string;
    text: string;
    ring: string;
    icon: string;
  };
  icon: React.ReactNode;
}[] = [
  {
    value: "en_progreso",
    label: "En Progreso",
    sublabel: "El trabajo continua manana",
    color: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-800",
      ring: "ring-yellow-400",
      icon: "text-yellow-500",
    },
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    value: "en_espera",
    label: "En Espera",
    sublabel: "Esperando piezas, autorizacion, etc.",
    color: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-800",
      ring: "ring-orange-400",
      icon: "text-orange-500",
    },
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    value: "completado",
    label: "Completado",
    sublabel: "Trabajo terminado",
    color: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      ring: "ring-green-400",
      icon: "text-green-500",
    },
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

export function StatusSection({
  reporteId,
  currentStatus,
  hasEquipmentEntries,
  isCompleted,
}: StatusSectionProps) {
  const [selectedStatus, setSelectedStatus] =
    useState<ReporteEstatus>(currentStatus);

  const boundAction = updateReportStatus.bind(null, reporteId);
  const [state, formAction, isPending] = useActionState(boundAction, null);

  const completadoBlocked =
    selectedStatus === "completado" && !hasEquipmentEntries;

  // After successful completado, show locked state
  const justCompleted =
    state?.success && selectedStatus === "completado";

  if (isCompleted || justCompleted) {
    const displayStatus = STATUS_OPTIONS.find(
      (s) => s.value === (justCompleted ? "completado" : currentStatus)
    );

    return (
      <div className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">
          Estatus del Reporte
        </h2>
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center space-y-3">
          {displayStatus && (
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${displayStatus.color.bg} ${displayStatus.color.text}`}
            >
              {displayStatus.icon}
              {displayStatus.label}
            </span>
          )}
          <p className="text-sm text-gray-500">
            {justCompleted
              ? "Reporte completado exitosamente"
              : "Este reporte ya fue completado"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-gray-900">
        Estatus del Reporte
      </h2>

      {/* Status cards */}
      <div className="grid grid-cols-1 gap-2">
        {STATUS_OPTIONS.map((option) => {
          const isSelected = selectedStatus === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedStatus(option.value)}
              className={[
                "flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all",
                isSelected
                  ? `${option.color.bg} ${option.color.border} ring-2 ${option.color.ring}`
                  : "border-gray-200 bg-white active:bg-gray-50",
              ].join(" ")}
            >
              <span
                className={
                  isSelected ? option.color.icon : "text-gray-400"
                }
              >
                {option.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold ${
                    isSelected ? option.color.text : "text-gray-700"
                  }`}
                >
                  {option.label}
                </p>
                <p
                  className={`text-xs ${
                    isSelected ? option.color.text + " opacity-80" : "text-gray-400"
                  }`}
                >
                  {option.sublabel}
                </p>
              </div>
              {/* Selection indicator */}
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  isSelected
                    ? `${option.color.border} ${option.color.bg}`
                    : "border-gray-300"
                }`}
              >
                {isSelected && (
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      option.value === "en_progreso"
                        ? "bg-yellow-500"
                        : option.value === "en_espera"
                          ? "bg-orange-500"
                          : "bg-green-500"
                    }`}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Completado validation warning */}
      {completadoBlocked && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm text-amber-700">
            Agrega al menos una entrada de equipo antes de completar el reporte.
          </p>
        </div>
      )}

      {/* Server error */}
      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      {/* Success feedback for non-completado statuses */}
      {state?.success && selectedStatus !== "completado" && (
        <p className="text-sm text-green-600 text-center">
          Estatus actualizado
        </p>
      )}

      {/* Submit button */}
      <form action={formAction}>
        <input type="hidden" name="estatus" value={selectedStatus} />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isPending}
          disabled={completadoBlocked}
        >
          Guardar y Enviar Reporte
        </Button>
      </form>
    </div>
  );
}
