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
import { PapeletaSection } from "./papeleta-section";
import { AdminFeedbackBanner } from "@/components/tecnico/admin-feedback-banner";
import { CommentSection } from "@/components/admin/comment-section";
import type {
  ReporteEquipo,
  Equipo,
  ReporteMaterial,
  ReporteEstatus,
  TipoEquipo,
  ReporteFoto,
  MaterialCatalogo,
} from "@/types";
import type { RegistrationEntry, CommentWithAuthor, FlaggedPhotoSummary } from "./page";

interface ReportFormProps {
  reporteId: string;
  ordenServicioId: string;
  ordenNumero: string;
  ordenDescripcion: string;
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
  existingOrdenSitePhoto: { url: string } | null;
  registrationEntries: RegistrationEntry[];
  // Papeleta photos
  papeletaPhotos: ReporteFoto[];
  // Admin feedback props
  adminComments: CommentWithAuthor[];
  flaggedPhotos: FlaggedPhotoSummary[];
  equipoListForComments: Array<{ id: string; etiqueta: string }>;
  catalogo?: MaterialCatalogo[];
}

const rolLabels: Record<string, string> = {
  tecnico: "tecnico",
  ayudante: "ayudante",
  admin: "admin",
};

export function ReportForm({
  reporteId,
  ordenServicioId,
  ordenNumero,
  ordenDescripcion,
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
  existingOrdenSitePhoto,
  registrationEntries,
  papeletaPhotos,
  adminComments,
  flaggedPhotos,
  equipoListForComments,
  catalogo,
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
          className="flex h-10 w-10 items-center justify-center rounded-input text-tech-text-secondary transition-colors active:bg-gray-100"
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
          <h1 className="text-section text-tech-text-primary">{ordenNumero}</h1>
          <p className="text-body text-tech-text-secondary">
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

      {/* Admin feedback banner */}
      <AdminFeedbackBanner
        retakePhotos={flaggedPhotos.filter((p) => p.estatus === "retomar")}
        rejectedPhotos={flaggedPhotos.filter((p) => p.estatus === "rechazada")}
        commentCount={adminComments.length}
      />

      {/* Report info section */}
      <div className="rounded-card border border-tech-border bg-tech-surface p-4 space-y-3">
        {/* Date */}
        <p className="text-body font-medium text-tech-text-secondary capitalize">
          {todayFormatted}
        </p>

        {/* Orden description */}
        {ordenDescripcion && (
          <div className="rounded-input bg-gray-50 p-3">
            <p className="text-label font-medium text-tech-text-muted mb-1">
              Problema reportado
            </p>
            <p className="text-body text-tech-text-secondary">{ordenDescripcion}</p>
          </div>
        )}

        {/* Team members */}
        {teamMembers.length > 0 && (
          <div>
            <p className="text-label font-medium text-tech-text-muted mb-1">Equipo</p>
            <p className="text-body text-tech-text-secondary">
              {teamMembers
                .map((m) => `${m.nombre} (${rolLabels[m.rol] ?? m.rol})`)
                .join(", ")}
            </p>
          </div>
        )}

        {/* Current status */}
        <div>
          <p className="text-label font-medium text-tech-text-muted mb-1">Estatus</p>
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
        defaultOpen={showAllPhases || !arrivalDone}
      >
        <ArrivalSection
          reporteId={reporteId}
          isComplete={arrivalDone}
          existingPhoto={arrivalPhoto}
          onComplete={handleArrivalComplete}
        />
      </PhaseGate>

      {/* ======== PHASE 1: Panoramica del Sitio ======== */}
      <PhaseGate
        isLocked={false}
        lockMessage=""
        title="Panoramica del Sitio"
        phaseNumber={2}
        isComplete={showAllPhases ? true : siteDone}
        defaultOpen={showAllPhases || (arrivalDone && !siteDone)}
        softWarning={!arrivalDone ? "Recomendado: completa la foto de llegada" : undefined}
      >
        <SiteOverviewSection
          reporteId={reporteId}
          ordenServicioId={ordenServicioId}
          isComplete={siteDone}
          existingOrdenPhoto={existingOrdenSitePhoto}
          existingPhoto={sitePhoto}
          onComplete={handleSiteComplete}
        />
      </PhaseGate>

      {/* ======== PHASE 2: Registro de Equipos ======== */}
      <PhaseGate
        isLocked={false}
        lockMessage=""
        title="Registro de Equipos"
        phaseNumber={3}
        isComplete={showAllPhases ? true : registrationDone}
        defaultOpen={showAllPhases || (siteDone && !registrationDone)}
        softWarning={!arrivalDone ? "Recomendado: completa la foto de llegada" : !siteDone ? "Recomendado: toma la foto panoramica del sitio" : undefined}
      >
        <EquipmentRegistrationSection
          reporteId={reporteId}
          entries={registrationEntries}
          onAllComplete={handleRegistrationComplete}
        />
      </PhaseGate>

      {/* ======== PHASE 3: Mantenimiento ======== */}
      <PhaseGate
        isLocked={false}
        lockMessage=""
        title="Mantenimiento"
        phaseNumber={4}
        isComplete={showAllPhases ? true : false}
        defaultOpen={showAllPhases || registrationDone}
        softWarning={!arrivalDone ? "Recomendado: completa la foto de llegada" : !registrationDone ? "Recomendado: completa el registro de equipos" : undefined}
      >
        {/* Equipment Section */}
        <EquipmentSection
          reporteId={reporteId}
          ordenServicioId={ordenServicioId}
          initialEntries={initialEntries}
          availableEquipment={availableEquipment}
          tiposEquipo={tiposEquipo}
          sucursalId={sucursalId}
          isCompleted={isCompleted}
          onUnsavedChange={setHasUnsavedChanges}
          onEntriesChange={setEquipmentCount}
        />

        {/* Divider */}
        <hr className="my-4 border-tech-border" />

        {/* Materials Section */}
        <MaterialsSection
          reporteId={reporteId}
          initialMaterials={initialMaterials}
          isCompleted={isCompleted}
          onUnsavedChange={setHasUnsavedChanges}
          catalogo={catalogo}
        />

        {/* Divider */}
        <hr className="my-4 border-tech-border" />

        {/* Status and Submit Section */}
        <StatusSection
          reporteId={reporteId}
          currentStatus={currentStatus}
          hasEquipmentEntries={equipmentCount > 0}
          isCompleted={isCompleted}
        />
      </PhaseGate>

      {/* ======== Papeleta Section ======== */}
      <PapeletaSection
        reporteId={reporteId}
        existingPhotos={papeletaPhotos}
        isCompleted={isCompleted}
      />

      {/* Admin comments section (read-only for technicians) */}
      {adminComments.length > 0 && (
        <div className="rounded-card border border-tech-border bg-tech-surface p-4">
          <CommentSection
            comments={adminComments}
            reporteId={reporteId}
            equipos={equipoListForComments}
            readOnly={true}
          />
        </div>
      )}
    </div>
  );
}
