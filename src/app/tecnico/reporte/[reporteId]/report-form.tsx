"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PhaseGate } from "@/components/shared/phase-gate";
import { ArrivalSection } from "./arrival-section";
import { SiteOverviewSection } from "./site-overview-section";
import { EquipmentRegistrationSection } from "./equipment-registration-section";
import { EquipmentSection } from "./equipment-section";
import { MaterialsSection } from "./materials-section";
import { StatusSection } from "./status-section";
import type {
  ReporteEquipo,
  Equipo,
  ReporteMaterial,
  ReporteEstatus,
  TipoEquipo,
  ReporteFoto,
} from "@/types";
import type { RegistrationEntry } from "./page";

interface ReportFormProps {
  reporteId: string;
  folioId: string;
  folioNumero: string;
  folioDescripcion: string;
  sucursalNombre: string;
  sucursalId: string;
  clienteNombre: string;
  initialEntries: (ReporteEquipo & { equipos: Equipo & { tipos_equipo?: { slug: string; nombre: string } | null } })[];
  initialMaterials: ReporteMaterial[];
  availableEquipment: Equipo[];
  tiposEquipo: TipoEquipo[];
  teamMembers: { nombre: string; rol: string }[];
  currentStatus: ReporteEstatus;
  isCompleted: boolean;
  // Registration flow props
  llegadaCompletada: boolean;
  sitioCompletado: boolean;
  arrivalPhoto: {
    url: string;
    metadata_fecha: string | null;
    metadata_gps: string | null;
  } | null;
  sitePhoto: {
    url: string;
    metadata_fecha: string | null;
    metadata_gps: string | null;
  } | null;
  existingFolioSitePhoto: { url: string } | null;
  registrationEntries: RegistrationEntry[];
}

const rolLabels: Record<string, string> = {
  tecnico: "tecnico",
  ayudante: "ayudante",
  admin: "admin",
};

export function ReportForm({
  reporteId,
  folioId,
  folioNumero,
  folioDescripcion,
  sucursalNombre,
  sucursalId,
  clienteNombre,
  initialEntries,
  initialMaterials,
  availableEquipment,
  tiposEquipo,
  teamMembers,
  currentStatus,
  isCompleted,
  llegadaCompletada,
  sitioCompletado,
  arrivalPhoto,
  sitePhoto,
  existingFolioSitePhoto,
  registrationEntries,
}: ReportFormProps) {
  const router = useRouter();
  const [showRefreshBanner, setShowRefreshBanner] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [equipmentCount, setEquipmentCount] = useState(initialEntries.length);

  // Phase completion state
  const [arrivalDone, setArrivalDone] = useState(llegadaCompletada);
  const [siteDone, setSiteDone] = useState(sitioCompletado);
  const [registrationDone, setRegistrationDone] = useState(
    registrationEntries.length > 0 &&
      registrationEntries.every((e) => e.isComplete)
  );

  // Completed reports bypass all gating
  const showAllPhases = isCompleted;

  const todayFormatted = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Phase completion callbacks
  const handleArrivalComplete = useCallback(() => {
    setArrivalDone(true);
  }, []);

  const handleSiteComplete = useCallback(() => {
    setSiteDone(true);
  }, []);

  const handleRegistrationComplete = useCallback(() => {
    setRegistrationDone(true);
  }, []);

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

      {/* ======== PHASE 0: Llegada (always unlocked) ======== */}
      <PhaseGate
        isLocked={false}
        lockMessage=""
        title="Llegada"
        phaseNumber={1}
        isComplete={showAllPhases ? true : arrivalDone}
      >
        <ArrivalSection
          reporteId={reporteId}
          isComplete={arrivalDone}
          existingPhoto={arrivalPhoto}
          onComplete={handleArrivalComplete}
        />
      </PhaseGate>

      {/* ======== PHASE 1: Panoramica del Sitio (locked until arrival) ======== */}
      <PhaseGate
        isLocked={!showAllPhases && !arrivalDone}
        lockMessage="Completa la foto de llegada primero"
        title="Panoramica del Sitio"
        phaseNumber={2}
        isComplete={showAllPhases ? true : siteDone}
      >
        <SiteOverviewSection
          reporteId={reporteId}
          folioId={folioId}
          isComplete={siteDone}
          existingFolioPhoto={existingFolioSitePhoto}
          existingPhoto={sitePhoto}
          onComplete={handleSiteComplete}
        />
      </PhaseGate>

      {/* ======== PHASE 2: Registro de Equipos (locked until site) ======== */}
      <PhaseGate
        isLocked={!showAllPhases && !siteDone}
        lockMessage="Completa la foto panoramica primero"
        title="Registro de Equipos"
        phaseNumber={3}
        isComplete={showAllPhases ? true : registrationDone}
      >
        <EquipmentRegistrationSection
          reporteId={reporteId}
          entries={registrationEntries}
          onAllComplete={handleRegistrationComplete}
        />
      </PhaseGate>

      {/* ======== PHASE 3: Mantenimiento (locked until all equipment registered) ======== */}
      <PhaseGate
        isLocked={!showAllPhases && !registrationDone}
        lockMessage="Completa el registro de todos los equipos primero"
        title="Mantenimiento"
        phaseNumber={4}
        isComplete={showAllPhases ? true : false}
      >
        {/* Equipment Section */}
        <EquipmentSection
          reporteId={reporteId}
          folioId={folioId}
          initialEntries={initialEntries}
          availableEquipment={availableEquipment}
          tiposEquipo={tiposEquipo}
          sucursalId={sucursalId}
          isCompleted={isCompleted}
          onUnsavedChange={setHasUnsavedChanges}
          onEntriesChange={setEquipmentCount}
        />

        {/* Divider */}
        <hr className="my-4 border-gray-200" />

        {/* Materials Section */}
        <MaterialsSection
          reporteId={reporteId}
          initialMaterials={initialMaterials}
          isCompleted={isCompleted}
          onUnsavedChange={setHasUnsavedChanges}
        />

        {/* Divider */}
        <hr className="my-4 border-gray-200" />

        {/* Status and Submit Section */}
        <StatusSection
          reporteId={reporteId}
          currentStatus={currentStatus}
          hasEquipmentEntries={equipmentCount > 0}
          isCompleted={isCompleted}
        />
      </PhaseGate>
    </div>
  );
}
