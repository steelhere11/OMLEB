"use client";

import { useState, useActionState, useTransition, useEffect } from "react";
import Image from "next/image";
import type { ReporteEstatus, TipoTrabajo, FotoEtiqueta } from "@/types";
import dynamic from "next/dynamic";
import {
  adminUpdateEquipmentEntry,
  adminSaveMaterials,
  adminUpdateReportStatus,
  approveReport,
} from "@/app/actions/reportes";

const ReportPdfButton = dynamic(
  () => import("@/components/admin/report-pdf-button"),
  {
    ssr: false,
    loading: () => (
      <span className="text-[13px] text-text-3">Cargando...</span>
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
    numero_etiqueta: string;
    marca: string | null;
    modelo: string | null;
    numero_serie: string | null;
    tipo_equipo: string | null;
  } | null;
  reporte_pasos: ReportePasoData[];
}

interface ReportePasoData {
  id: string;
  completado: boolean;
  notas: string | null;
  lecturas: Record<string, number | string>;
  completed_at: string | null;
  plantillas_pasos: {
    nombre: string;
    procedimiento: string;
    lecturas_requeridas: Array<{
      nombre: string;
      unidad: string;
      rango_min: number | null;
      rango_max: number | null;
    }> | null;
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
  folio_id: string;
  creado_por: string;
  sucursal_id: string;
  fecha: string;
  estatus: ReporteEstatus;
  firma_encargado: string | null;
  nombre_encargado: string | null;
  finalizado_por_admin: boolean;
  created_at: string;
  updated_at: string;
  folios: {
    numero_folio: string;
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

export interface ReportDetailProps {
  reporte: ReporteData;
  teamMembers: TeamMember[];
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

export function ReportDetail({ reporte, teamMembers }: ReportDetailProps) {
  const status = statusConfig[reporte.estatus] ?? statusConfig.en_progreso;
  const folio = reporte.folios;
  const sucursal = reporte.sucursales;
  const creator = reporte.users;

  // Edit state
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingMaterials, setEditingMaterials] = useState(false);
  const [currentEstatus, setCurrentEstatus] = useState<ReporteEstatus>(reporte.estatus);
  const [statusPending, startStatusTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.025em] text-text-0">
            Reporte - {folio?.numero_folio ?? "Sin folio"}
          </h1>
          <p className="mt-1 text-[13px] text-text-2">
            {new Date(reporte.fecha).toLocaleDateString("es-MX", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
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
            value={folio?.clientes?.nombre ?? "\u2014"}
          />
          <InfoRow
            label="Problema reportado"
            value={folio?.descripcion_problema ?? "\u2014"}
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
              />
            ))}
          </div>
        )}
      </div>

      {/* General photos (not tied to equipment) */}
      {generalPhotos.length > 0 && (
        <div>
          <h2 className="mb-3 text-[15px] font-semibold text-text-0">
            Fotos Generales ({generalPhotos.length})
          </h2>
          <div className="rounded-[10px] border border-admin-border bg-admin-surface p-4">
            <PhotoGrid photos={generalPhotos} />
          </div>
        </div>
      )}

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
            </div>
          ) : (
            <p className="text-[13px] text-text-3">Sin firma</p>
          )}
        </div>
      </div>

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
            }}
            folio={{
              numero_folio: folio?.numero_folio ?? "",
              descripcion_problema: folio?.descripcion_problema ?? "",
            }}
            sucursal={{
              nombre: sucursal?.nombre ?? "",
              numero: sucursal?.numero ?? "",
              direccion: sucursal?.direccion ?? "",
            }}
            cliente={{
              nombre: folio?.clientes?.nombre ?? "",
              logo_url: folio?.clientes?.logo_url ?? null,
            }}
            teamMembers={teamMembers
              .filter((m) => m.users)
              .map((m) => ({
                nombre: m.users!.nombre,
                rol: m.users!.rol,
              }))}
            equipmentEntries={reporte.reporte_equipos.map((entry) => ({
              equipo: {
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
                  "Paso",
                completado: paso.completado,
                notas: paso.notas,
                lecturas: paso.lecturas ?? null,
                lecturas_meta:
                  paso.plantillas_pasos?.lecturas_requeridas ?? null,
              })),
              photos: (photosByEquipo.get(entry.equipo_id) ?? []).map(
                (foto) => ({
                  url: foto.url,
                  etiqueta: foto.etiqueta,
                  metadata_gps: foto.metadata_gps,
                  metadata_fecha: foto.metadata_fecha,
                  reporte_paso_id: foto.reporte_paso_id,
                })
              ),
            }))}
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
      "Aprobar este reporte? Esta accion no se puede deshacer."
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
}: {
  entry: ReporteEquipoData;
  photos: ReporteFotoData[];
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaved: () => void;
}) {
  const equipo = entry.equipos;
  const tipoConfig = tipoTrabajoConfig[entry.tipo_trabajo] ?? tipoTrabajoConfig.preventivo;

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

      {/* Serial and type info */}
      {(equipo?.numero_serie || equipo?.tipo_equipo) && (
        <div className="mb-3 flex flex-wrap gap-4 text-[12px] text-text-2">
          {equipo?.numero_serie && (
            <span>No. Serie: {equipo.numero_serie}</span>
          )}
          {equipo?.tipo_equipo && (
            <span>Tipo: {equipo.tipo_equipo}</span>
          )}
        </div>
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

      {/* Workflow steps */}
      {entry.reporte_pasos.length > 0 && (
        <div className="mt-3">
          <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-text-2">
            Pasos del Flujo de Trabajo
          </h4>
          <div className="space-y-2">
            {entry.reporte_pasos.map((paso) => (
              <StepRow key={paso.id} paso={paso} />
            ))}
          </div>
        </div>
      )}

      {/* Photos for this equipment */}
      {photos.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-text-2">
            Fotos ({photos.length})
          </h4>
          <PhotoGrid photos={photos} />
        </div>
      )}
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

function StepRow({ paso }: { paso: ReportePasoData }) {
  const name =
    paso.plantillas_pasos?.nombre ??
    paso.fallas_correctivas?.nombre ??
    "Paso";

  const readings = Object.entries(paso.lecturas ?? {});

  return (
    <div className="flex items-start gap-2 rounded-[6px] border border-admin-border-subtle px-3 py-2">
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
        <p className="text-[13px] font-medium text-text-0">{name}</p>

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
          <p className="mt-1 text-[12px] text-text-2">
            Nota: {paso.notas}
          </p>
        )}
      </div>
    </div>
  );
}

function PhotoGrid({ photos }: { photos: ReporteFotoData[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {photos.map((foto) => (
        <div key={foto.id} className="space-y-1">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[6px] border border-admin-border-subtle bg-admin-bg">
            <Image
              src={foto.url}
              alt={foto.etiqueta ?? "Foto del reporte"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {foto.etiqueta && (
              <span className="inline-flex rounded bg-admin-surface-elevated px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.04em] text-text-2">
                {etiquetaLabels[foto.etiqueta] ?? foto.etiqueta}
              </span>
            )}
            {foto.metadata_fecha && (
              <span className="text-[10px] text-text-3">
                {new Date(foto.metadata_fecha).toLocaleString("es-MX", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
          {foto.metadata_gps && (
            <span className="text-[10px] text-text-3">
              GPS: {foto.metadata_gps}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
