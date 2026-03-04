import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OrdenServicio, OrdenServicioEstatus, Equipo, ReporteEstatus } from "@/types";
import { OrdenDeleteButton } from "@/components/admin/orden-delete-button";
import { CreateReportButton } from "@/components/admin/create-report-button";

type OrdenDetail = OrdenServicio & {
  sucursales: { nombre: string; numero: string } | null;
  clientes: { nombre: string } | null;
  orden_asignados: {
    usuario_id: string;
    users: { nombre: string; rol: string } | null;
  }[];
  orden_equipos: {
    equipo_id: string;
    equipos: Equipo | null;
  }[];
};

type ReporteSummary = {
  id: string;
  fecha: string;
  estatus: ReporteEstatus;
  creado_por: string;
  users: { nombre: string } | null;
};

const statusConfig: Record<
  OrdenServicioEstatus,
  { label: string; className: string }
> = {
  abierto: {
    label: "Abierto",
    className: "bg-status-progress/10 text-status-progress",
  },
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

const reporteStatusConfig: Record<
  ReporteEstatus,
  { label: string; className: string }
> = {
  en_progreso: {
    label: "En Progreso",
    className: "bg-status-progress/10 text-status-progress",
  },
  en_espera: {
    label: "En Espera",
    className: "bg-status-warning/10 text-status-warning",
  },
  completado: {
    label: "Completado",
    className: "bg-status-success/10 text-status-success",
  },
};

export default async function OrdenDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch orden with relations
  const { data: orden } = await supabase
    .from("ordenes_servicio")
    .select(
      "*, sucursales(nombre, numero), clientes(nombre), orden_asignados(usuario_id, users(nombre, rol)), orden_equipos(equipo_id, equipos(*))"
    )
    .eq("id", id)
    .single();

  if (!orden) notFound();

  const typedOrden = orden as unknown as OrdenDetail;

  // Fetch reports for this orden
  const { data: reportes } = await supabase
    .from("reportes")
    .select("id, fecha, estatus, creado_por, users:creado_por(nombre)")
    .eq("orden_servicio_id", id)
    .order("fecha", { ascending: false });

  const reporteList = (reportes as unknown as ReporteSummary[] | null) ?? [];

  // Count photos across all reports for impact summary
  let photoCount = 0;
  if (reporteList.length > 0) {
    const reporteIds = reporteList.map((r) => r.id);
    const { count } = await supabase
      .from("reporte_fotos")
      .select("id", { count: "exact", head: true })
      .in("reporte_id", reporteIds);
    photoCount = count ?? 0;
  }

  const status = statusConfig[typedOrden.estatus] ?? statusConfig.abierto;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <Link
        href="/admin/ordenes-servicio"
        className="mb-6 inline-flex items-center gap-1 text-[13px] text-text-2 transition-colors duration-[80ms] hover:text-text-1"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5"
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
        Volver a ordenes de servicio
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.025em] text-text-0">
            Orden {typedOrden.numero_orden}
          </h1>
          <p className="mt-0.5 text-[13px] text-text-2">
            {typedOrden.sucursales
              ? `${typedOrden.sucursales.nombre} (${typedOrden.sucursales.numero})`
              : ""}
            {typedOrden.clientes
              ? ` — ${typedOrden.clientes.nombre}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
          >
            {status.label}
          </span>
          <Link
            href={`/admin/ordenes-servicio/${id}/editar`}
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-admin-border px-3 py-1.5 text-[13px] font-medium text-text-1 transition-colors duration-[80ms] hover:bg-admin-surface-hover"
          >
            Editar
          </Link>
          <OrdenDeleteButton
            ordenId={id}
            ordenLabel={typedOrden.numero_orden}
            reportCount={reporteList.length}
            photoCount={photoCount}
            redirectTo="/admin/ordenes-servicio"
          />
        </div>
      </div>

      <div className="space-y-4">
        {/* Problema reportado */}
        <div className="rounded-[10px] border border-admin-border bg-admin-surface p-5">
          <h2 className="mb-2 text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
            Problema reportado
          </h2>
          <p className="text-[13px] leading-relaxed text-text-1">
            {typedOrden.descripcion_problema}
          </p>
        </div>

        {/* Cuadrilla */}
        <div className="rounded-[10px] border border-admin-border bg-admin-surface p-5">
          <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
            Cuadrilla
          </h2>
          {typedOrden.orden_asignados.length === 0 ? (
            <p className="text-[13px] text-text-3">Sin asignaciones</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {typedOrden.orden_asignados.map((a) => {
                const user = a.users;
                return (
                  <div
                    key={a.usuario_id}
                    className="inline-flex items-center gap-2 rounded-[6px] border border-admin-border-subtle bg-admin-surface-elevated px-3 py-1.5"
                  >
                    <span className="text-[13px] text-text-0">
                      {user?.nombre ?? "—"}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        user?.rol === "tecnico"
                          ? "bg-status-progress/10 text-status-progress"
                          : "bg-text-3/10 text-text-2"
                      }`}
                    >
                      {user?.rol === "tecnico" ? "Tecnico" : "Ayudante"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Equipos de la orden */}
        <div className="rounded-[10px] border border-admin-border bg-admin-surface p-5">
          <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
            Equipos de la orden ({typedOrden.orden_equipos.length})
          </h2>
          {typedOrden.orden_equipos.length === 0 ? (
            <p className="text-[13px] text-text-3">
              No hay equipos asignados a esta orden
            </p>
          ) : (
            <div className="space-y-2">
              {typedOrden.orden_equipos.map((oe) => {
                const eq = oe.equipos;
                if (!eq) return null;
                return (
                  <div
                    key={oe.equipo_id}
                    className="flex items-center justify-between rounded-[6px] border border-admin-border-subtle bg-admin-surface-elevated px-4 py-2.5"
                  >
                    <div>
                      <p className="font-mono text-[13px] font-medium text-text-0">
                        {eq.numero_etiqueta}
                      </p>
                      <p className="text-[12px] text-text-2">
                        {[eq.marca, eq.modelo].filter(Boolean).join(" ") ||
                          "Sin detalles"}
                        {eq.tipo_equipo && (
                          <span className="text-text-3">
                            {" "}
                            — {eq.tipo_equipo}
                          </span>
                        )}
                      </p>
                    </div>
                    {!eq.revisado && (
                      <span className="inline-flex items-center rounded-full bg-status-warning/10 px-2 py-0.5 text-xs font-medium text-status-warning">
                        Pendiente revision
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Reportes */}
        <div className="rounded-[10px] border border-admin-border bg-admin-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
              Reportes ({reporteList.length})
            </h2>
            <CreateReportButton ordenServicioId={id} />
          </div>
          {reporteList.length === 0 ? (
            <p className="text-[13px] text-text-3">
              Aun no se han generado reportes para esta orden
            </p>
          ) : (
            <div className="space-y-2">
              {reporteList.map((reporte) => {
                const rStatus =
                  reporteStatusConfig[reporte.estatus] ??
                  reporteStatusConfig.en_progreso;
                return (
                  <Link
                    key={reporte.id}
                    href={`/admin/reportes/${reporte.id}`}
                    className="flex items-center justify-between rounded-[6px] border border-admin-border-subtle bg-admin-surface-elevated px-4 py-2.5 transition-colors duration-[80ms] hover:bg-admin-surface-hover"
                  >
                    <div>
                      <p className="font-mono text-[13px] font-medium text-text-0">
                        {new Date(reporte.fecha).toLocaleDateString("es-MX", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-[12px] text-text-2">
                        {reporte.users?.nombre ?? "—"}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${rStatus.className}`}
                    >
                      {rStatus.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
