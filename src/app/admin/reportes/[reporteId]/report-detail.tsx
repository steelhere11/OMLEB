"use client";

import Image from "next/image";
import type { ReporteEstatus, TipoTrabajo, FotoEtiqueta } from "@/types";

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
  plantillas_pasos: { nombre: string; procedimiento: string } | null;
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
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
          >
            {status.label}
          </span>
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
                : "—"
            }
          />
          <InfoRow
            label="Direccion"
            value={sucursal?.direccion ?? "—"}
          />
          <InfoRow
            label="Cliente"
            value={folio?.clientes?.nombre ?? "—"}
          />
          <InfoRow
            label="Problema reportado"
            value={folio?.descripcion_problema ?? "—"}
          />
          <InfoRow
            label="Equipo de trabajo"
            value={
              teamMembers.length > 0
                ? teamMembers
                    .map(
                      (m) =>
                        `${m.users?.nombre ?? "—"} (${formatRol(m.users?.rol ?? "")})`
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
                : "—"
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
      <div>
        <h2 className="mb-3 text-[15px] font-semibold text-text-0">
          Material Empleado ({reporte.reporte_materiales.length})
        </h2>
        {reporte.reporte_materiales.length === 0 ? (
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
                {reporte.reporte_materiales.map((mat, i) => (
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

      {/* Footer - placeholder for Plan 02 (edit/approve) and Plan 03 (PDF export) */}
      <div id="admin-actions" className="flex items-center justify-between pt-2">
        <a
          href="/admin/reportes"
          className="text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
        >
          ← Volver a la lista
        </a>
      </div>
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
}: {
  entry: ReporteEquipoData;
  photos: ReporteFotoData[];
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
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] ${tipoConfig.className}`}
        >
          {tipoConfig.label}
        </span>
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
