"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { EquipmentSection } from "./equipment-section";
import type {
  ReporteEquipo,
  Equipo,
  ReporteMaterial,
  ReporteEstatus,
} from "@/types";

interface ReportFormProps {
  reporteId: string;
  folioNumero: string;
  folioDescripcion: string;
  sucursalNombre: string;
  sucursalId: string;
  clienteNombre: string;
  initialEntries: (ReporteEquipo & { equipos: Equipo })[];
  initialMaterials: ReporteMaterial[];
  availableEquipment: Equipo[];
  teamMembers: { nombre: string; rol: string }[];
  currentStatus: ReporteEstatus;
  isCompleted: boolean;
}

const rolLabels: Record<string, string> = {
  tecnico: "tecnico",
  ayudante: "ayudante",
  admin: "admin",
};

export function ReportForm({
  reporteId,
  folioNumero,
  folioDescripcion,
  sucursalNombre,
  sucursalId,
  clienteNombre,
  initialEntries,
  availableEquipment,
  teamMembers,
  currentStatus,
  isCompleted,
}: ReportFormProps) {
  const router = useRouter();
  const [showRefreshBanner, setShowRefreshBanner] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const todayFormatted = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Realtime subscription for cuadrilla sync
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`report-${reporteId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "reportes",
          filter: `id=eq.${reporteId}`,
        },
        () => {
          setShowRefreshBanner(true);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reporte_equipos",
          filter: `reporte_id=eq.${reporteId}`,
        },
        () => {
          setShowRefreshBanner(true);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reporte_materiales",
          filter: `reporte_id=eq.${reporteId}`,
        },
        () => {
          setShowRefreshBanner(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reporteId]);

  // beforeunload guard for unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  const handleRefresh = () => {
    setShowRefreshBanner(false);
    router.refresh();
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <Link
          href="/tecnico"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors active:bg-gray-100"
        >
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">{folioNumero}</h1>
          <p className="text-sm text-gray-500">
            {sucursalNombre}
            {clienteNombre && ` - ${clienteNombre}`}
          </p>
        </div>
      </div>

      {/* Refresh banner for cuadrilla sync */}
      {showRefreshBanner && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
          <p className="text-sm text-blue-800">
            Un companero actualizo el reporte.
          </p>
          <button
            onClick={handleRefresh}
            className="mt-1 text-sm font-medium text-blue-600 underline"
          >
            Actualizar datos
          </button>
        </div>
      )}

      {/* Completed banner */}
      {isCompleted && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-sm text-yellow-800">
            Este reporte esta completado. Solo un administrador puede editarlo.
          </p>
        </div>
      )}

      {/* Report info section */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        {/* Date */}
        <p className="text-sm font-medium text-gray-700 capitalize">
          {todayFormatted}
        </p>

        {/* Folio description */}
        {folioDescripcion && (
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">
              Problema reportado
            </p>
            <p className="text-sm text-gray-700">{folioDescripcion}</p>
          </div>
        )}

        {/* Team members */}
        {teamMembers.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Equipo</p>
            <p className="text-sm text-gray-700">
              {teamMembers
                .map((m) => `${m.nombre} (${rolLabels[m.rol] ?? m.rol})`)
                .join(", ")}
            </p>
          </div>
        )}

        {/* Current status */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Estatus</p>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              currentStatus === "en_progreso"
                ? "bg-yellow-100 text-yellow-700"
                : currentStatus === "en_espera"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-green-100 text-green-700"
            }`}
          >
            {currentStatus === "en_progreso"
              ? "En Progreso"
              : currentStatus === "en_espera"
                ? "En Espera"
                : "Completado"}
          </span>
        </div>
      </div>

      {/* Equipment Section */}
      <EquipmentSection
        reporteId={reporteId}
        initialEntries={initialEntries}
        availableEquipment={availableEquipment}
        sucursalId={sucursalId}
        isCompleted={isCompleted}
        onUnsavedChange={setHasUnsavedChanges}
      />

      {/* Materials placeholder - Plan 03 */}
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
        <p className="text-sm text-gray-400 text-center">
          Materiales — Plan 03
        </p>
      </div>

      {/* Status placeholder - Plan 03 */}
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
        <p className="text-sm text-gray-400 text-center">
          Estatus — Plan 03
        </p>
      </div>
    </div>
  );
}
