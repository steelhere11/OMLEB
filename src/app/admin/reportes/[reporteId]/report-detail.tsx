"use client";

import { useState, useActionState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReporteEstatus, TipoTrabajo, FotoEtiqueta, FotoEstatusRevision, TipoEquipo } from "@/types";
import dynamic from "next/dynamic";
import {
  adminUpdateEquipmentEntry,
  adminSaveMaterials,
  adminUpdateReportStatus,
  approveReport,
  adminUpdateStep,
  adminUpdateEquipmentInfo,
  adminRemoveEquipmentEntry,
  adminUpdateSignature,
} from "@/app/actions/reportes";
import { adminFlagPhoto, adminDeletePhoto, adminUploadPhoto } from "@/app/actions/fotos";
import { ReporteDeleteButton } from "@/components/admin/reporte-delete-button";
import { AdminPhotoCard } from "@/components/admin/admin-photo-card";
import { AdminPhotoUpload } from "@/components/admin/admin-photo-upload";
import { AdminStepEditor } from "@/components/admin/admin-step-editor";
import { AdminCustomStepForm } from "@/components/admin/admin-custom-step-form";
import { AdminEquipmentInfoEditor } from "@/components/admin/admin-equipment-info-editor";
import { CommentSection } from "@/components/admin/comment-section";
import { RevisionHistoryPanel } from "@/components/admin/revision-history-panel";
import { createRevision } from "@/app/actions/admin-revisions";
import type { RevisionWithAuthor } from "@/app/actions/admin-revisions";
import type { ReporteComentario } from "@/types";

const ReportPdfButton = dynamic(
  () => import("@/components/admin/report-pdf-button"),
  {
    ssr: false,
    loading: () => (
      <span className="text-[13px] text-text-3">Cargando...</span>
    ),
  }
);

const SignaturePad = dynamic(
  () => import("@/components/shared/signature-pad").then((m) => m.SignaturePad),
  {
    ssr: false,
    loading: () => (
      <span className="text-[13px] text-text-3">Cargando firma...</span>
    ),
  }
);

// ---------- Types ----------

interface ReporteEquipoData {
  id: string;
  reporte_id: string;
  equipo_id: string;
  tipo_trabajo: TipoTrabajo;
  diagnostico: string | null;
  trabajo_realizado: string | null;
  observaciones: string | null;
  equipos: {
    id: string;
    numero_etiqueta: string;
    marca: string | null;
    modelo: string | null;
    numero_serie: string | null;
    tipo_equipo: string | null;
    tipo_equipo_id: string | null;
    capacidad: string | null;
    refrigerante: string | null;
    voltaje: string | null;
    fase: string | null;
    ubicacion: string | null;
  } | null;
  reporte_pasos: ReportePasoData[];
}

interface ReportePasoData {
  id: string;
  completado: boolean;
  notas: string | null;
  lecturas: Record<string, number | string>;
  completed_at: string | null;
  nombre_custom: string | null;
  plantillas_pasos: {
    nombre: string;
    procedimiento: string;
    lecturas_requeridas: Array<{
      nombre: string;
      unidad: string;
      rango_min: number | null;
      rango_max: number | null;
    }> | null;
    orden: number;
  } | null;
  fallas_correctivas: { nombre: string; diagnostico: string } | null;
}

interface ReporteFotoData {
  id: string;
  reporte_id: string;
  equipo_id: string | null;
  reporte_paso_id: string | null;
  url: string;
  etiqueta: FotoEtiqueta | null;
  tipo_media: "foto" | "video";
  estatus_revision: FotoEstatusRevision;
  nota_admin: string | null;
  metadata_gps: string | null;
  metadata_fecha: string | null;
  created_at: string;
}

interface ReporteMaterialData {
  id: string;
  cantidad: number;
  unidad: string;
  descripcion: string;
}

interface ReporteData {
  id: string;
  orden_servicio_id: string;
  creado_por: string;
  sucursal_id: string;
  fecha: string;
  estatus: ReporteEstatus;
  firma_encargado: string | null;
  nombre_encargado: string | null;
  finalizado_por_admin: boolean;
  revision_actual: number;
  created_at: string;
  updated_at: string;
  ordenes_servicio: {
    numero_orden: string;
    descripcion_problema: string;
    clientes: { nombre: string; logo_url: string | null } | null;
  } | null;
  sucursales: {
    nombre: string;
    numero: string;
    direccion: string;
  } | null;
  users: { nombre: string; rol: string } | null;
  reporte_equipos: ReporteEquipoData[];
  reporte_fotos: ReporteFotoData[];
  reporte_materiales: ReporteMaterialData[];
}

interface TeamMember {
  usuario_id: string;
  users: { nombre: string; rol: string } | null;
}

interface CommentWithAuthor extends ReporteComentario {
  autor_nombre?: string;
}

export interface ReportDetailProps {
  reporte: ReporteData;
  teamMembers: TeamMember[];
  tiposEquipo: TipoEquipo[];
  comments: CommentWithAuthor[];
  revisions: RevisionWithAuthor[];
}

// ---------- Status config ----------

const statusConfig: Record<ReporteEstatus, { label: string; className: string }> = {
  en_progreso: {
    label: "En Progreso",
    className: "bg-status-progress/10 text-status-progress",
  },
  completado: {
    label: "Completado",
    className: "bg-status-success/10 text-status-success",
  },
  en_espera: {
    label: "En Espera",
    className: "bg-status-warning/10 text-status-warning",
  },
};

const tipoTrabajoConfig: Record<TipoTrabajo, { label: string; className: string }> = {
  preventivo: {
    label: "PREVENTIVO",
    className: "bg-blue-500/10 text-blue-600",
  },
  correctivo: {
    label: "CORRECTIVO",
    className: "bg-orange-500/10 text-orange-600",
  },
};

const etiquetaLabels: Record<string, string> = {
  antes: "Antes",
  durante: "Durante",
  despues: "Despues",
  dano: "Dano",
  placa: "Placa",
  progreso: "Progreso",
};

const COMMON_UNITS = ["Pieza", "Metro", "Litro", "Kilogramo", "Rollo", "Tramo"];

// ---------- Helpers ----------

function formatRol(rol: string): string {
  const map: Record<string, string> = {
    admin: "Admin",
    tecnico: "Tecnico",
    ayudante: "Ayudante",
  };
  return map[rol] ?? rol;
}

// ---------- Component ----------

export function ReportDetail({ reporte, teamMembers, tiposEquipo, comments, revisions }: ReportDetailProps) {
  const router = useRouter();
  const status = statusConfig[reporte.estatus] ?? statusConfig.en_progreso;
  const orden = reporte.ordenes_servicio;
  const sucursal = reporte.sucursales;
  const creator = reporte.users;

  // Edit state
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingMaterials, setEditingMaterials] = useState(false);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingEquipoId, setEditingEquipoId] = useState<string | null>(null);
  const [currentEstatus, setCurrentEstatus] = useState<ReporteEstatus>(reporte.estatus);
  const [statusPending, startStatusTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Revision modal state (for post-approval edits)
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionSummary, setRevisionSummary] = useState("");
  const [revisionPending, startRevisionTransition] = useTransition();
  const [revisionError, setRevisionError] = useState<string | null>(null);

  // Signature state
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signaturePending, startSignatureTransition] = useTransition();

  // Equipment removal state
  const [removePending, startRemoveTransition] = useTransition();

  // Photo management handlers
  async function handleFlagPhoto(fotoId: string, estatus: FotoEstatusRevision, nota?: string) {
    await adminFlagPhoto(fotoId, estatus, nota);
    router.refresh();
  }

  async function handleDeletePhoto(fotoId: string) {
    await adminDeletePhoto(fotoId);
    router.refresh();
  }

  // Equipment removal handler
  function handleRemoveEquipment(entryId: string) {
    const confirmed = window.confirm(
      "Eliminar este equipo del reporte? Se eliminaran sus pasos y fotos asociadas."
    );
    if (!confirmed) return;

    startRemoveTransition(async () => {
      const result = await adminRemoveEquipmentEntry(entryId);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  }

  // Signature handlers
  function handleRemoveSignature() {
    const confirmed = window.confirm("Eliminar la firma del encargado?");
    if (!confirmed) return;

    startSignatureTransition(async () => {
      const result = await adminUpdateSignature(reporte.id, null, null);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleSaveSignature(data: { nombre: string; firma: string }) {
    setShowSignaturePad(false);
    startSignatureTransition(async () => {
      const result = await adminUpdateSignature(reporte.id, data.firma, data.nombre);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  }

  // Group photos by equipo_id
  const photosByEquipo = new Map<string, ReporteFotoData[]>();
  for (const foto of reporte.reporte_fotos) {
    const key = foto.equipo_id ?? "__general__";
    const existing = photosByEquipo.get(key) ?? [];
    existing.push(foto);
    photosByEquipo.set(key, existing);
  }

  // General photos (not tied to equipment)
  const generalPhotos = photosByEquipo.get("__general__") ?? [];

  // Photo status summary
  const allPhotos = reporte.reporte_fotos;
  const pendienteCount = allPhotos.filter((f) => f.estatus_revision === "pendiente").length;
  const aceptadaCount = allPhotos.filter((f) => f.estatus_revision === "aceptada").length;
  const rechazadaCount = allPhotos.filter((f) => f.estatus_revision === "rechazada").length;
  const retomarCount = allPhotos.filter((f) => f.estatus_revision === "retomar").length;

  // Equipment list for upload component
  const equiposList = reporte.reporte_equipos
    .filter((e) => e.equipos)
    .map((e) => ({
      id: e.equipo_id,
      etiqueta: e.equipos!.numero_etiqueta,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.025em] text-text-0">
            Reporte - {orden?.numero_orden ?? "Sin ODS"}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-[13px] text-text-2">
              {new Date(reporte.fecha).toLocaleDateString("es-MX", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
            {reporte.revision_actual > 0 && (
              <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
                Revision {reporte.revision_actual}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={currentEstatus}
            disabled={statusPending}
            onChange={(e) => {
              const newStatus = e.target.value as ReporteEstatus;
              setCurrentEstatus(newStatus);
              setStatusMsg(null);
              startStatusTransition(async () => {
                const result = await adminUpdateReportStatus(reporte.id, newStatus);
                if (result.error) {
                  setCurrentEstatus(reporte.estatus);
                  setStatusMsg(result.error);
                } else {
                  setStatusMsg("Guardado");
                  setTimeout(() => setStatusMsg(null), 2000);
                }
              });
            }}
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border-0 cursor-pointer ${statusConfig[currentEstatus]?.className ?? status.className}`}
          >
            <option value="en_progreso">En Progreso</option>
            <option value="en_espera">En Espera</option>
            <option value="completado">Completado</option>
          </select>
          {statusMsg && (
            <span className={`text-[11px] ${statusMsg === "Guardado" ? "text-status-success" : "text-red-600"}`}>
              {statusMsg}
            </span>
          )}
          {reporte.finalizado_por_admin && (
            <span className="inline-flex items-center gap-1 rounded-full bg-status-success/10 px-2.5 py-0.5 text-xs font-medium text-status-success">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Aprobado
            </span>
          )}
          <ReporteDeleteButton
            reporteId={reporte.id}
            reporteLabel={`${orden?.numero_orden ?? "—"} - ${new Date(reporte.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}`}
            photoCount={reporte.reporte_fotos.length}
            equipmentCount={reporte.reporte_equipos.length}
            materialCount={reporte.reporte_materiales.length}
            redirectTo="/admin/reportes"
          />
        </div>
      </div>

      {/* Info section */}
      <div className="rounded-[10px] border border-admin-border bg-admin-surface p-4">
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.04em] text-text-2">
          Informacion General
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoRow
            label="Sucursal"
            value={
              sucursal
                ? `${sucursal.nombre} (${sucursal.numero})`
                : "\u2014"
            }
          />
          <InfoRow
            label="Direccion"
            value={sucursal?.direccion ?? "\u2014"}
          />
          <InfoRow
            label="Cliente"
            value={orden?.clientes?.nombre ?? "\u2014"}
          />
          <InfoRow
            label="Problema reportado"
            value={orden?.descripcion_problema ?? "\u2014"}
          />
          <InfoRow
            label="Equipo de trabajo"
            value={
              teamMembers.length > 0
                ? teamMembers
                    .map(
                      (m) =>
                        `${m.users?.nombre ?? "\u2014"} (${formatRol(m.users?.rol ?? "")})`
                    )
                    .join(", ")
                : "Sin asignar"
            }
          />
          <InfoRow
            label="Creado por"
            value={
              creator
                ? `${creator.nombre} (${formatRol(creator.rol)})`
                : "\u2014"
            }
          />
        </div>
      </div>

      {/* Equipment entries */}
      <div>
        <h2 className="mb-3 text-[15px] font-semibold text-text-0">
          Equipos Atendidos ({reporte.reporte_equipos.length})
        </h2>
        {reporte.reporte_equipos.length === 0 ? (
          <div className="rounded-[10px] border border-admin-border bg-admin-surface p-4 text-center">
            <p className="text-[13px] text-text-3">Sin equipos registrados</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reporte.reporte_equipos.map((entry) => (
              <EquipmentCard
                key={entry.id}
                entry={entry}
                photos={photosByEquipo.get(entry.equipo_id) ?? []}
                isEditing={editingEntryId === entry.id}
                onEdit={() => setEditingEntryId(entry.id)}
                onCancelEdit={() => setEditingEntryId(null)}
                onSaved={() => setEditingEntryId(null)}
                onRemove={handleRemoveEquipment}
                removePending={removePending}
                onFlagPhoto={handleFlagPhoto}
                onDeletePhoto={handleDeletePhoto}
                reporteId={reporte.id}
                editingStepId={editingStepId}
                onEditStep={(stepId) => setEditingStepId(stepId)}
                onCancelEditStep={() => setEditingStepId(null)}
                onStepSaved={() => { setEditingStepId(null); router.refresh(); }}
                editingEquipoId={editingEquipoId}
                onEditEquipo={(equipoId) => setEditingEquipoId(equipoId)}
                onCancelEditEquipo={() => setEditingEquipoId(null)}
                onEquipoSaved={() => { setEditingEquipoId(null); router.refresh(); }}
                tiposEquipo={tiposEquipo}
              />
            ))}
          </div>
        )}
      </div>

      {/* Photo status summary */}
      {allPhotos.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-[10px] border border-admin-border bg-admin-surface px-4 py-3">
          <span className="text-[13px] font-medium text-text-0">
            Revision de fotos ({allPhotos.length} total):
          </span>
          {pendienteCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
              {pendienteCount} pendiente{pendienteCount !== 1 ? "s" : ""}
            </span>
          )}
          {aceptadaCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
              {aceptadaCount} aceptada{aceptadaCount !== 1 ? "s" : ""}
            </span>
          )}
          {rechazadaCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
              {rechazadaCount} rechazada{rechazadaCount !== 1 ? "s" : ""}
            </span>
          )}
          {retomarCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
              {retomarCount} retomar
            </span>
          )}
        </div>
      )}

      {/* General photos (not tied to equipment) */}
      <div>
        <h2 className="mb-3 text-[15px] font-semibold text-text-0">
          Fotos Generales ({generalPhotos.length})
        </h2>
        <div className="rounded-[10px] border border-admin-border bg-admin-surface p-4">
          {generalPhotos.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {generalPhotos.map((foto) => (
                <AdminPhotoCard
                  key={foto.id}
                  foto={foto}
                  onFlag={handleFlagPhoto}
                  onDelete={handleDeletePhoto}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-[13px] text-text-3">
              Sin fotos generales
            </p>
          )}
          <div className="mt-3">
            <AdminPhotoUpload
              reporteId={reporte.id}
              equipos={equiposList}
            />
          </div>
        </div>
      </div>

      {/* Materials */}
      <MaterialsSection
        reporteId={reporte.id}
        materials={reporte.reporte_materiales}
        isEditing={editingMaterials}
        onEdit={() => setEditingMaterials(true)}
        onCancelEdit={() => setEditingMaterials(false)}
        onSaved={() => setEditingMaterials(false)}
      />

      {/* Signature */}
      <div>
        <h2 className="mb-3 text-[15px] font-semibold text-text-0">
          Firma del Encargado
        </h2>
        <div className="rounded-[10px] border border-admin-border bg-admin-surface p-4">
          {reporte.firma_encargado ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={reporte.firma_encargado}
                alt="Firma del encargado"
                className="max-h-[120px] rounded border border-admin-border-subtle bg-white"
              />
              {reporte.nombre_encargado && (
                <p className="text-[13px] text-text-1">
                  {reporte.nombre_encargado}
                </p>
              )}
              <button
                type="button"
                onClick={handleRemoveSignature}
                disabled={signaturePending}
                className="text-[12px] font-medium text-red-500 transition-colors duration-[80ms] hover:text-red-700 disabled:opacity-50"
              >
                {signaturePending ? "Eliminando..." : "Eliminar firma"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[13px] text-text-3">Sin firma</p>
              {!showSignaturePad && (
                <button
                  type="button"
                  onClick={() => setShowSignaturePad(true)}
                  disabled={signaturePending}
                  className="text-[12px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0 disabled:opacity-50"
                >
                  {signaturePending ? "Guardando..." : "Agregar firma"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Signature Pad (fullscreen overlay) */}
      {showSignaturePad && (
        <SignaturePad
          onSave={handleSaveSignature}
          onCancel={() => setShowSignaturePad(false)}
        />
      )}

      {/* Comments */}
      <CommentSection
        comments={comments.filter((c) => !c.equipo_id)}
        reporteId={reporte.id}
        equipos={equiposList}
      />

      {/* Revision History */}
      <RevisionHistoryPanel revisions={revisions} />

      {/* Create Revision Note (visible when report is approved) */}
      {reporte.finalizado_por_admin && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setShowRevisionModal(true); setRevisionSummary(""); setRevisionError(null); }}
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-accent/30 bg-accent/5 px-3 py-1.5 text-[13px] font-medium text-accent transition-colors hover:bg-accent/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Registrar revision
          </button>
          <span className="text-[11px] text-text-3">
            Registra un resumen de los cambios realizados al reporte aprobado
          </span>
        </div>
      )}

      {/* Revision Summary Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-md rounded-[10px] border border-admin-border bg-admin-surface p-5 shadow-xl">
            <h3 className="text-[15px] font-semibold text-text-0">
              Registrar Revision
            </h3>
            <p className="mt-1 text-[12px] text-text-3">
              Describe brevemente los cambios realizados a este reporte aprobado.
            </p>
            <textarea
              value={revisionSummary}
              onChange={(e) => setRevisionSummary(e.target.value)}
              placeholder="Ej: Se corrigio lectura de amperaje en paso 5"
              rows={3}
              className="mt-3 w-full rounded-[6px] border border-admin-border bg-admin-surface px-3 py-2 text-[13px] text-text-0 placeholder:text-text-3 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              autoFocus
            />
            {revisionError && (
              <p className="mt-1 text-[12px] text-red-600">{revisionError}</p>
            )}
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="rounded-[6px] border border-admin-border px-3 py-1.5 text-[13px] font-medium text-text-2 transition-colors hover:bg-admin-surface-hover"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={revisionPending || !revisionSummary.trim()}
                onClick={() => {
                  setRevisionError(null);
                  startRevisionTransition(async () => {
                    const result = await createRevision(reporte.id, revisionSummary.trim(), []);
                    if (result.error) {
                      setRevisionError(result.error);
                    } else {
                      setShowRevisionModal(false);
                      setRevisionSummary("");
                      router.refresh();
                    }
                  });
                }}
                className="rounded-[6px] bg-accent px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
              >
                {revisionPending ? "Guardando..." : "Guardar Revision"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer: Back, PDF Export, Approve */}
      <div id="admin-actions" className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <a
          href="/admin/reportes"
          className="text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
        >
          &larr; Volver a la lista
        </a>
        <div className="flex items-center gap-3">
          <ReportPdfButton
            reporte={{
              fecha: reporte.fecha,
              estatus: reporte.estatus,
              firma_encargado: reporte.firma_encargado,
              nombre_encargado: reporte.nombre_encargado,
              revision_actual: reporte.revision_actual,
            }}
            lastRevision={revisions.length > 0 ? {
              fecha: revisions[0].created_at,
              autor: revisions[0].autor_nombre,
            } : undefined}
            orden={{
              numero_orden: orden?.numero_orden ?? "",
              descripcion_problema: orden?.descripcion_problema ?? "",
            }}
            sucursal={{
              nombre: sucursal?.nombre ?? "",
              numero: sucursal?.numero ?? "",
              direccion: sucursal?.direccion ?? "",
            }}
            cliente={{
              nombre: orden?.clientes?.nombre ?? "",
              logo_url: orden?.clientes?.logo_url ?? null,
            }}
            teamMembers={teamMembers
              .filter((m) => m.users)
              .map((m) => ({
                nombre: m.users!.nombre,
                rol: m.users!.rol,
              }))}
            registrationPhotos={reporte.reporte_fotos
              .filter((f) =>
                f.etiqueta === "llegada" ||
                f.etiqueta === "sitio" ||
                f.etiqueta === "equipo_general" ||
                f.etiqueta === "placa"
              )
              .map((f) => ({
                url: f.url,
                etiqueta: f.etiqueta,
                equipo_id: f.equipo_id,
                metadata_gps: f.metadata_gps,
                metadata_fecha: f.metadata_fecha,
              }))}
            registrationEquipment={(() => {
              const seen = new Set<string>();
              return reporte.reporte_equipos
                .filter((entry) => entry.equipos)
                .filter((entry) => {
                  if (seen.has(entry.equipo_id)) return false;
                  seen.add(entry.equipo_id);
                  return true;
                })
                .map((entry) => ({
                  equipo_id: entry.equipo_id,
                  numero_etiqueta: entry.equipos!.numero_etiqueta,
                  tipo_equipo: entry.equipos!.tipo_equipo,
                  ubicacion: entry.equipos!.ubicacion,
                  marca: entry.equipos!.marca,
                  modelo: entry.equipos!.modelo,
                  numero_serie: entry.equipos!.numero_serie,
                  capacidad: entry.equipos!.capacidad,
                  refrigerante: entry.equipos!.refrigerante,
                  voltaje: entry.equipos!.voltaje,
                  fase: entry.equipos!.fase,
                }))
                .sort((a, b) =>
                  a.numero_etiqueta.localeCompare(b.numero_etiqueta, "es", { numeric: true, sensitivity: "base" })
                );
            })()}
            comments={comments.map((c) => ({
              contenido: c.contenido,
              autor_nombre: c.autor_nombre ?? "Admin",
              equipo_id: c.equipo_id,
              created_at: c.created_at,
            }))}
            equipmentEntries={reporte.reporte_equipos.map((entry) => ({
              equipo: {
                id: entry.equipo_id,
                numero_etiqueta:
                  entry.equipos?.numero_etiqueta ?? "Equipo desconocido",
                marca: entry.equipos?.marca ?? null,
                modelo: entry.equipos?.modelo ?? null,
              },
              tipo_trabajo: entry.tipo_trabajo,
              diagnostico: entry.diagnostico,
              trabajo_realizado: entry.trabajo_realizado,
              observaciones: entry.observaciones,
              steps: entry.reporte_pasos.map((paso) => ({
                id: paso.id,
                nombre:
                  paso.plantillas_pasos?.nombre ??
                  paso.fallas_correctivas?.nombre ??
                  paso.nombre_custom ??
                  "Paso",
                completado: paso.completado,
                notas: paso.notas,
                lecturas: paso.lecturas ?? null,
                lecturas_meta:
                  paso.plantillas_pasos?.lecturas_requeridas ?? null,
                isCustom: !paso.plantillas_pasos && !paso.fallas_correctivas && !!paso.nombre_custom,
                orden: paso.plantillas_pasos?.orden ?? (paso.fallas_correctivas ? 9000 : 9999),
              })).sort((a, b) => (a.orden ?? 9999) - (b.orden ?? 9999)),
              photos: (photosByEquipo.get(entry.equipo_id) ?? []).map(
                (foto) => ({
                  url: foto.url,
                  etiqueta: foto.etiqueta,
                  metadata_gps: foto.metadata_gps,
                  metadata_fecha: foto.metadata_fecha,
                  reporte_paso_id: foto.reporte_paso_id,
                })
              ),
            })).sort((a, b) => {
              const cmp = a.equipo.numero_etiqueta.localeCompare(
                b.equipo.numero_etiqueta, "es", { numeric: true, sensitivity: "base" }
              );
              if (cmp !== 0) return cmp;
              if (a.tipo_trabajo === "preventivo" && b.tipo_trabajo === "correctivo") return -1;
              if (a.tipo_trabajo === "correctivo" && b.tipo_trabajo === "preventivo") return 1;
              return 0;
            })}
            materials={reporte.reporte_materiales.map((m) => ({
              cantidad: m.cantidad,
              unidad: m.unidad,
              descripcion: m.descripcion,
            }))}
          />
          <ApproveButton
            reporteId={reporte.id}
            isApproved={reporte.finalizado_por_admin}
          />
        </div>
      </div>
    </div>
  );
}

// ---------- Approve Button ----------

function ApproveButton({
  reporteId,
  isApproved,
}: {
  reporteId: string;
  isApproved: boolean;
}) {
  const [approved, setApproved] = useState(isApproved);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    const confirmed = window.confirm(
      "Aprobar este reporte? Podra seguir editandolo y se registraran las revisiones."
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await approveReport(reporteId);
      if (result.error) {
        setError(result.error);
      } else {
        setApproved(true);
      }
    });
  }

  if (approved) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-1.5 rounded-[6px] bg-status-success/20 px-4 py-2 text-[13px] font-medium text-status-success"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Aprobado
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-[12px] text-red-600">{error}</span>}
      <button
        type="button"
        onClick={handleApprove}
        disabled={isPending}
        className="rounded-[6px] bg-status-success px-4 py-2 text-[13px] font-medium text-white transition-colors duration-[80ms] hover:bg-status-success/90 disabled:opacity-50"
      >
        {isPending ? "Aprobando..." : "Aprobar Reporte"}
      </button>
    </div>
  );
}

// ---------- Materials Section ----------

interface MaterialRow {
  id: string;
  cantidad: number;
  unidad: string;
  descripcion: string;
}

function MaterialsSection({
  reporteId,
  materials,
  isEditing,
  onEdit,
  onCancelEdit,
  onSaved,
}: {
  reporteId: string;
  materials: ReporteMaterialData[];
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaved: () => void;
}) {
  const [rows, setRows] = useState<MaterialRow[]>(() =>
    materials.map((m) => ({ ...m }))
  );
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync rows when materials prop changes (after revalidation)
  useEffect(() => {
    if (!isEditing) {
      setRows(materials.map((m) => ({ ...m })));
    }
  }, [materials, isEditing]);

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        cantidad: 1,
        unidad: "",
        descripcion: "",
      },
    ]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function updateRow(id: string, field: keyof MaterialRow, value: string | number) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }

  function handleCancel() {
    setRows(materials.map((m) => ({ ...m })));
    setFeedback(null);
    onCancelEdit();
  }

  function handleSave() {
    setFeedback(null);
    const payload = rows.map((r) => ({
      cantidad: Number(r.cantidad),
      unidad: r.unidad,
      descripcion: r.descripcion,
    }));

    startTransition(async () => {
      const result = await adminSaveMaterials(reporteId, payload);
      if (result.error) {
        setFeedback({ type: "error", text: result.error });
      } else {
        setFeedback({ type: "success", text: result.message ?? "Guardado" });
        setTimeout(() => {
          setFeedback(null);
          onSaved();
        }, 1200);
      }
    });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-0">
          Material Empleado ({materials.length})
        </h2>
        {!isEditing && (
          <button
            type="button"
            onClick={onEdit}
            className="text-[12px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
          >
            Editar
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="rounded-[10px] border border-admin-border bg-admin-surface p-4">
          {rows.length === 0 ? (
            <p className="mb-3 text-center text-[13px] text-text-3">
              Sin materiales. Agrega uno abajo.
            </p>
          ) : (
            <div className="mb-3 space-y-3">
              {rows.map((row) => (
                <div key={row.id} className="flex items-start gap-2">
                  <div className="grid flex-1 gap-2 sm:grid-cols-[100px_120px_1fr]">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={row.cantidad}
                      onChange={(e) =>
                        updateRow(row.id, "cantidad", parseFloat(e.target.value) || 0)
                      }
                      placeholder="Cantidad"
                      className="rounded-[6px] border border-admin-border bg-admin-surface px-3 py-1.5 text-[13px]"
                    />
                    <div>
                      <input
                        type="text"
                        list="unidades-list"
                        value={row.unidad}
                        onChange={(e) => updateRow(row.id, "unidad", e.target.value)}
                        placeholder="Unidad"
                        className="w-full rounded-[6px] border border-admin-border bg-admin-surface px-3 py-1.5 text-[13px]"
                      />
                    </div>
                    <input
                      type="text"
                      value={row.descripcion}
                      onChange={(e) =>
                        updateRow(row.id, "descripcion", e.target.value)
                      }
                      placeholder="Descripcion"
                      className="rounded-[6px] border border-admin-border bg-admin-surface px-3 py-1.5 text-[13px]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="mt-1 shrink-0 text-[13px] text-red-500 hover:text-red-700"
                    title="Eliminar"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          <datalist id="unidades-list">
            {COMMON_UNITS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={addRow}
              className="text-[12px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
            >
              + Agregar material
            </button>
            <div className="flex-1" />
            {feedback && (
              <span
                className={`text-[12px] ${
                  feedback.type === "success" ? "text-status-success" : "text-red-600"
                }`}
              >
                {feedback.text}
              </span>
            )}
            <button
              type="button"
              onClick={handleCancel}
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
      ) : materials.length === 0 ? (
        <div className="rounded-[10px] border border-admin-border bg-admin-surface p-4 text-center">
          <p className="text-[13px] text-text-3">Sin materiales registrados</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[10px] border border-admin-border bg-admin-surface">
          <table className="w-full">
            <thead>
              <tr className="border-b border-admin-border-subtle text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
                <th className="px-4 py-[10px] text-left">Cantidad</th>
                <th className="px-4 py-[10px] text-left">Unidad</th>
                <th className="px-4 py-[10px] text-left">Descripcion</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((mat, i) => (
                <tr
                  key={mat.id}
                  className={i > 0 ? "row-inset-divider" : ""}
                >
                  <td className="px-4 py-[9px] font-mono text-[13px] text-text-0">
                    {mat.cantidad}
                  </td>
                  <td className="px-4 py-[9px] text-[13px] text-text-1">
                    {mat.unidad}
                  </td>
                  <td className="px-4 py-[9px] text-[13px] text-text-1">
                    {mat.descripcion}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------- Sub-components ----------

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
        {label}
      </dt>
      <dd className="mt-0.5 text-[13px] text-text-1">{value}</dd>
    </div>
  );
}

function EquipmentCard({
  entry,
  photos,
  isEditing,
  onEdit,
  onCancelEdit,
  onSaved,
  onRemove,
  removePending,
  onFlagPhoto,
  onDeletePhoto,
  reporteId,
  editingStepId,
  onEditStep,
  onCancelEditStep,
  onStepSaved,
  editingEquipoId,
  onEditEquipo,
  onCancelEditEquipo,
  onEquipoSaved,
  tiposEquipo,
}: {
  entry: ReporteEquipoData;
  photos: ReporteFotoData[];
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaved: () => void;
  onRemove: (entryId: string) => void;
  removePending: boolean;
  onFlagPhoto: (fotoId: string, estatus: FotoEstatusRevision, nota?: string) => Promise<void>;
  onDeletePhoto: (fotoId: string) => Promise<void>;
  reporteId: string;
  editingStepId: string | null;
  onEditStep: (stepId: string) => void;
  onCancelEditStep: () => void;
  onStepSaved: () => void;
  editingEquipoId: string | null;
  onEditEquipo: (equipoId: string) => void;
  onCancelEditEquipo: () => void;
  onEquipoSaved: () => void;
  tiposEquipo: TipoEquipo[];
}) {
  const equipo = entry.equipos;
  const tipoConfig = tipoTrabajoConfig[entry.tipo_trabajo] ?? tipoTrabajoConfig.preventivo;
  const isEditingThisEquipo = equipo?.id ? editingEquipoId === equipo.id : false;

  return (
    <div className="rounded-[10px] border border-admin-border bg-admin-surface p-4">
      {/* Equipment header */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="text-[14px] font-semibold text-text-0">
          {equipo?.numero_etiqueta ?? "Equipo desconocido"}
          {equipo?.marca || equipo?.modelo
            ? ` - ${[equipo.marca, equipo.modelo].filter(Boolean).join(" ")}`
            : ""}
        </h3>
        {!isEditing && (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] ${tipoConfig.className}`}
          >
            {tipoConfig.label}
          </span>
        )}
        <div className="flex-1" />
        {!isEditing && !isEditingThisEquipo && (
          <div className="flex items-center gap-2">
            {equipo?.id && (
              <button
                type="button"
                onClick={() => onEditEquipo(equipo.id)}
                className="text-[12px] font-medium text-text-2 transition-colors duration-[80ms] hover:text-accent"
              >
                Editar equipo
              </button>
            )}
            <button
              type="button"
              onClick={onEdit}
              className="text-[12px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => onRemove(entry.id)}
              disabled={removePending}
              className="text-[12px] font-medium text-red-500 transition-colors duration-[80ms] hover:text-red-700 disabled:opacity-50"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>

      {/* Serial and type info */}
      {!isEditingThisEquipo && (equipo?.numero_serie || equipo?.tipo_equipo) && (
        <div className="mb-3 flex flex-wrap gap-4 text-[12px] text-text-2">
          {equipo?.numero_serie && (
            <span>No. Serie: {equipo.numero_serie}</span>
          )}
          {equipo?.tipo_equipo && (
            <span>Tipo: {equipo.tipo_equipo}</span>
          )}
        </div>
      )}

      {/* Inline equipment info editor */}
      {isEditingThisEquipo && equipo && (
        <AdminEquipmentInfoEditor
          equipo={{
            id: equipo.id,
            marca: equipo.marca,
            modelo: equipo.modelo,
            numero_serie: equipo.numero_serie,
            tipo_equipo_id: equipo.tipo_equipo_id,
            capacidad: equipo.capacidad,
            refrigerante: equipo.refrigerante,
            voltaje: equipo.voltaje,
            fase: equipo.fase,
            ubicacion: equipo.ubicacion,
          }}
          tiposEquipo={tiposEquipo}
          onSave={async (data) => {
            const result = await adminUpdateEquipmentInfo(equipo.id, data);
            if (result.error) throw new Error(result.error);
            onEquipoSaved();
          }}
          onCancel={onCancelEditEquipo}
        />
      )}

      {isEditing ? (
        <EquipmentEditForm
          entry={entry}
          onCancel={onCancelEdit}
          onSaved={onSaved}
        />
      ) : (
        <>
          {/* Free-text fields (legacy or non-workflow) */}
          {entry.diagnostico && (
            <TextBlock label="Diagnostico" value={entry.diagnostico} />
          )}
          {entry.trabajo_realizado && (
            <TextBlock label="Trabajo Realizado" value={entry.trabajo_realizado} />
          )}
          {entry.observaciones && (
            <TextBlock label="Observaciones" value={entry.observaciones} />
          )}
        </>
      )}

      {/* Workflow steps with inline photos */}
      {entry.reporte_pasos.length > 0 && (() => {
        // Group photos by reporte_paso_id
        const photosByStep = new Map<string, ReporteFotoData[]>();
        const orphanPhotos: ReporteFotoData[] = [];
        for (const foto of photos) {
          if (foto.reporte_paso_id) {
            const arr = photosByStep.get(foto.reporte_paso_id) ?? [];
            arr.push(foto);
            photosByStep.set(foto.reporte_paso_id, arr);
          } else {
            orphanPhotos.push(foto);
          }
        }

        return (
          <div className="mt-3">
            <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-text-2">
              Pasos del Flujo de Trabajo
            </h4>
            <div className="space-y-2">
              {entry.reporte_pasos.map((paso) => (
                <StepRow
                  key={paso.id}
                  paso={paso}
                  stagePhotos={photosByStep.get(paso.id) ?? []}
                  onFlagPhoto={onFlagPhoto}
                  onDeletePhoto={onDeletePhoto}
                  isEditing={editingStepId === paso.id}
                  onEdit={() => onEditStep(paso.id)}
                  onCancelEdit={onCancelEditStep}
                  onSaved={onStepSaved}
                  reporteId={reporteId}
                  equipoId={entry.equipo_id}
                />
              ))}
              <AdminCustomStepForm
                reporteEquipoId={entry.id}
                onStepAdded={onStepSaved}
              />
            </div>

            {/* Orphan photos (not linked to any step) */}
            {orphanPhotos.length > 0 && (
              <div className="mt-4">
                <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-text-2">
                  Fotos adicionales ({orphanPhotos.length})
                </h4>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {orphanPhotos.map((foto) => (
                    <AdminPhotoCard
                      key={foto.id}
                      foto={foto}
                      onFlag={onFlagPhoto}
                      onDelete={onDeletePhoto}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Add custom step when no workflow steps exist yet */}
      {entry.reporte_pasos.length === 0 && (
        <div className="mt-3">
          <AdminCustomStepForm
            reporteEquipoId={entry.id}
            onStepAdded={onStepSaved}
          />
        </div>
      )}

      {/* Photos for equipment without workflow steps */}
      {entry.reporte_pasos.length === 0 && photos.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-text-2">
            Fotos ({photos.length})
          </h4>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {photos.map((foto) => (
              <AdminPhotoCard
                key={foto.id}
                foto={foto}
                onFlag={onFlagPhoto}
                onDelete={onDeletePhoto}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upload for this equipment */}
      <div className="mt-3">
        <AdminPhotoUpload
          reporteId={reporteId}
          equipoId={entry.equipo_id}
          pasos={entry.reporte_pasos
            .filter((p) => p.plantillas_pasos || p.fallas_correctivas || p.nombre_custom)
            .map((p) => ({
              id: p.id,
              nombre:
                p.plantillas_pasos?.nombre ??
                p.fallas_correctivas?.nombre ??
                p.nombre_custom ??
                "Paso",
            }))}
        />
      </div>
    </div>
  );
}

// ---------- Equipment Edit Form ----------

function EquipmentEditForm({
  entry,
  onCancel,
  onSaved,
}: {
  entry: ReporteEquipoData;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const boundAction = adminUpdateEquipmentEntry.bind(null, entry.id);
  const [state, formAction, isPending] = useActionState(boundAction, null);
  const [tipoTrabajo, setTipoTrabajo] = useState<TipoTrabajo>(entry.tipo_trabajo);

  // On successful save, exit edit mode
  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => onSaved(), 600);
      return () => clearTimeout(timer);
    }
  }, [state?.success, onSaved]);

  return (
    <form action={formAction} className="space-y-3">
      {/* Hidden equipo_id (required by schema) */}
      <input type="hidden" name="equipo_id" value={entry.equipo_id} />
      <input type="hidden" name="tipo_trabajo" value={tipoTrabajo} />

      {/* Tipo trabajo toggle */}
      <div>
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
          Tipo de trabajo
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTipoTrabajo("preventivo")}
            className={`rounded-[6px] px-3 py-1.5 text-[12px] font-medium transition-colors duration-[80ms] ${
              tipoTrabajo === "preventivo"
                ? "bg-blue-500 text-white"
                : "border border-admin-border bg-admin-surface text-text-2 hover:bg-admin-surface-elevated"
            }`}
          >
            Preventivo
          </button>
          <button
            type="button"
            onClick={() => setTipoTrabajo("correctivo")}
            className={`rounded-[6px] px-3 py-1.5 text-[12px] font-medium transition-colors duration-[80ms] ${
              tipoTrabajo === "correctivo"
                ? "bg-orange-500 text-white"
                : "border border-admin-border bg-admin-surface text-text-2 hover:bg-admin-surface-elevated"
            }`}
          >
            Correctivo
          </button>
        </div>
      </div>

      {/* Diagnostico */}
      <div>
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
          Diagnostico
        </label>
        <textarea
          name="diagnostico"
          rows={3}
          defaultValue={entry.diagnostico ?? ""}
          className="w-full rounded-[6px] border border-admin-border bg-admin-surface px-3 py-1.5 text-[13px]"
        />
        {state?.fieldErrors?.diagnostico && (
          <p className="mt-0.5 text-[12px] text-red-600">
            {state.fieldErrors.diagnostico[0]}
          </p>
        )}
      </div>

      {/* Trabajo realizado */}
      <div>
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
          Trabajo Realizado
        </label>
        <textarea
          name="trabajo_realizado"
          rows={3}
          defaultValue={entry.trabajo_realizado ?? ""}
          className="w-full rounded-[6px] border border-admin-border bg-admin-surface px-3 py-1.5 text-[13px]"
        />
        {state?.fieldErrors?.trabajo_realizado && (
          <p className="mt-0.5 text-[12px] text-red-600">
            {state.fieldErrors.trabajo_realizado[0]}
          </p>
        )}
      </div>

      {/* Observaciones */}
      <div>
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
          Observaciones
        </label>
        <textarea
          name="observaciones"
          rows={3}
          defaultValue={entry.observaciones ?? ""}
          className="w-full rounded-[6px] border border-admin-border bg-admin-surface px-3 py-1.5 text-[13px]"
        />
        {state?.fieldErrors?.observaciones && (
          <p className="mt-0.5 text-[12px] text-red-600">
            {state.fieldErrors.observaciones[0]}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {state?.error && (
          <span className="text-[12px] text-red-600">{state.error}</span>
        )}
        {state?.success && (
          <span className="text-[12px] text-status-success">
            {state.message}
          </span>
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
          type="submit"
          disabled={isPending}
          className="rounded-[6px] bg-accent px-3 py-1 text-[12px] font-medium text-white transition-colors duration-[80ms] hover:bg-accent/90 disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

// ---------- Read-only sub-components ----------

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2">
      <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
        {label}
      </span>
      <p className="mt-0.5 whitespace-pre-wrap text-[13px] text-text-1">
        {value}
      </p>
    </div>
  );
}

const stageColors: Record<string, string> = {
  antes: "bg-blue-100 text-blue-700",
  durante: "bg-amber-100 text-amber-700",
  despues: "bg-green-100 text-green-700",
};

function StepRow({
  paso,
  stagePhotos = [],
  onFlagPhoto,
  onDeletePhoto,
  isEditing,
  onEdit,
  onCancelEdit,
  onSaved,
  reporteId,
  equipoId,
}: {
  paso: ReportePasoData;
  stagePhotos?: ReporteFotoData[];
  onFlagPhoto: (fotoId: string, estatus: FotoEstatusRevision, nota?: string) => Promise<void>;
  onDeletePhoto: (fotoId: string) => Promise<void>;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaved: () => void;
  reporteId: string;
  equipoId: string;
}) {
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const isCustom = !paso.plantillas_pasos && !paso.fallas_correctivas && !!paso.nombre_custom;
  const name =
    paso.plantillas_pasos?.nombre ??
    paso.fallas_correctivas?.nombre ??
    paso.nombre_custom ??
    "Paso";

  const readings = Object.entries(paso.lecturas ?? {});

  // Group photos by stage
  const photosByStage = new Map<string, ReporteFotoData[]>();
  for (const foto of stagePhotos) {
    const stage = foto.etiqueta ?? "otros";
    const arr = photosByStage.get(stage) ?? [];
    arr.push(foto);
    photosByStage.set(stage, arr);
  }
  const stageOrder = ["antes", "durante", "despues"];
  const sortedStages = stageOrder.filter((st) => photosByStage.has(st));
  for (const st of photosByStage.keys()) {
    if (!sortedStages.includes(st)) sortedStages.push(st);
  }

  return (
    <div className="rounded-[6px] border border-admin-border-subtle px-3 py-2">
      {isEditing ? (
        <AdminStepEditor
          paso={paso}
          onSave={async (data) => {
            const result = await adminUpdateStep(paso.id, data);
            if (result.error) throw new Error(result.error);
            onSaved();
          }}
          onCancel={onCancelEdit}
        />
      ) : (
      <div className="flex items-start gap-2">
        {/* Completado indicator */}
        <div className="mt-0.5 shrink-0">
          {paso.completado ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-status-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <div className="h-4 w-4 rounded-full border-2 border-text-3" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-medium text-text-0">{name}</p>
            {isCustom && (
              <span className="shrink-0 rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">
                Personalizado
              </span>
            )}
            <button
              type="button"
              onClick={onEdit}
              className="shrink-0 text-[11px] font-medium text-text-3 transition-colors duration-[80ms] hover:text-accent"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => { setShowUpload((v) => !v); setUploadError(null); }}
              className="shrink-0 text-[11px] font-medium text-text-3 transition-colors duration-[80ms] hover:text-accent flex items-center gap-0.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Agregar foto
            </button>
          </div>

          {/* Inline photo upload form */}
          {showUpload && (
            <form
              className="mt-2 flex flex-wrap items-end gap-2 rounded border border-admin-border-subtle bg-admin-surface-raised p-2"
              onSubmit={async (e) => {
                e.preventDefault();
                setUploading(true);
                setUploadError(null);
                const fd = new FormData(e.currentTarget);
                fd.set("reporteId", reporteId);
                fd.set("equipoId", equipoId);
                fd.set("reportePasoId", paso.id);
                const result = await adminUploadPhoto(fd);
                setUploading(false);
                if (result.error) {
                  setUploadError(result.error);
                } else {
                  setShowUpload(false);
                  onSaved();
                }
              }}
            >
              <label className="flex flex-col gap-1 text-[11px] font-medium text-text-2">
                Archivo
                <input
                  type="file"
                  name="file"
                  accept="image/*,video/*"
                  required
                  className="w-[180px] text-[11px] file:mr-2 file:rounded file:border-0 file:bg-accent/10 file:px-2 file:py-0.5 file:text-[11px] file:font-medium file:text-accent"
                />
              </label>
              <label className="flex flex-col gap-1 text-[11px] font-medium text-text-2">
                Etiqueta
                <select
                  name="etiqueta"
                  required
                  className="rounded border border-admin-border-subtle bg-admin-surface px-2 py-1 text-[12px] text-text-0"
                >
                  <option value="antes">Antes</option>
                  <option value="durante">Durante</option>
                  <option value="despues">Despues</option>
                </select>
              </label>
              <button
                type="submit"
                disabled={uploading}
                className="rounded bg-accent px-3 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
              >
                {uploading ? "Subiendo..." : "Subir"}
              </button>
              <button
                type="button"
                onClick={() => { setShowUpload(false); setUploadError(null); }}
                className="text-[11px] font-medium text-text-3 hover:text-text-1"
              >
                Cancelar
              </button>
              {uploadError && (
                <p className="w-full text-[11px] text-status-error">{uploadError}</p>
              )}
            </form>
          )}

          {/* Readings */}
          {readings.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
              {readings.map(([key, val]) => (
                <span key={key} className="text-[12px] text-text-2">
                  {key}: <span className="font-mono text-text-1">{String(val)}</span>
                </span>
              ))}
            </div>
          )}

          {/* Notes */}
          {paso.notas && (
            <p className="mt-1 text-[12px] text-text-2 italic">
              Nota: {paso.notas}
            </p>
          )}
        </div>
      </div>
      )}

      {/* Inline photos grouped by stage */}
      {sortedStages.length > 0 && (
        <div className="mt-2 space-y-2 pl-6">
          {sortedStages.map((stage) => {
            const photos = photosByStage.get(stage) ?? [];
            return (
              <div key={stage}>
                <span
                  className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] ${stageColors[stage] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {etiquetaLabels[stage] ?? stage}
                </span>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {photos.map((foto) => (
                    <AdminPhotoCard
                      key={foto.id}
                      foto={foto}
                      onFlag={onFlagPhoto}
                      onDelete={onDeletePhoto}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

