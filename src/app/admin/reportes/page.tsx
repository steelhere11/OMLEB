import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ReporteEstatus } from "@/types";
import { ReportFilters } from "@/components/admin/report-filters";
import { ReporteDeleteButton } from "@/components/admin/reporte-delete-button";

type ReporteWithRelations = {
  id: string;
  fecha: string;
  estatus: ReporteEstatus;
  finalizado_por_admin: boolean;
  created_at: string;
  ordenes_servicio: { numero_orden: string; descripcion_problema: string; clientes: { nombre: string } | null } | null;
  sucursales: { nombre: string; numero: string } | null;
  users: { nombre: string; rol: string } | null;
  reporte_fotos: { id: string }[];
};

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

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{
    estatus?: string;
    sucursal_id?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Build filtered query
  let query = supabase
    .from("reportes")
    .select(
      "id, fecha, estatus, finalizado_por_admin, created_at, ordenes_servicio:orden_servicio_id(numero_orden, descripcion_problema, clientes(nombre)), sucursales(nombre, numero), users:creado_por(nombre, rol), reporte_fotos(id)"
    )
    .order("fecha", { ascending: false });

  if (params.estatus) {
    query = query.eq("estatus", params.estatus);
  }
  if (params.sucursal_id) {
    query = query.eq("sucursal_id", params.sucursal_id);
  }
  if (params.fecha_desde) {
    query = query.gte("fecha", params.fecha_desde);
  }
  if (params.fecha_hasta) {
    query = query.lte("fecha", params.fecha_hasta);
  }

  const { data: reportes } = await query;

  // Fetch sucursales for filter dropdown
  const { data: sucursales } = await supabase
    .from("sucursales")
    .select("id, nombre, numero")
    .order("nombre");

  const list = (reportes as ReporteWithRelations[] | null) ?? [];
  const sucursalList = sucursales ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-[-0.025em] text-text-0">
          Reportes
        </h1>
      </div>

      {/* Filters */}
      <ReportFilters
        sucursales={sucursalList}
        currentParams={params}
      />

      {/* Report List */}
      {list.length === 0 ? (
        <div className="rounded-[10px] border border-admin-border bg-admin-surface py-28 text-center">
          <p className="text-[13px] text-text-3">No hay reportes</p>
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-visible rounded-[10px] border border-admin-border bg-admin-surface">
          <div className="min-w-[820px]">
            {/* Header row */}
            <div className="flex items-center border-b border-admin-border-subtle px-[14px] py-[10px] text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
              <div className="w-[100px]">Fecha</div>
              <div className="w-[100px]">ODS</div>
              <div className="w-[160px]">Sucursal</div>
              <div className="w-[120px]">Creado por</div>
              <div className="w-[100px]">Estatus</div>
              <div className="w-[80px]">Aprobado</div>
              <div className="w-[140px] text-right">Acciones</div>
            </div>

            {/* Data rows */}
            {list.map((reporte, i) => {
              const status = statusConfig[reporte.estatus] ?? statusConfig.en_progreso;
              return (
                <div
                  key={reporte.id}
                  className={`flex items-center px-[14px] py-[9px] transition-colors duration-[80ms] hover:bg-admin-surface-hover${i > 0 ? " row-inset-divider" : ""}`}
                >
                  <div className="w-[100px] font-mono text-[13px] text-text-2">
                    {new Date(reporte.fecha).toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  <div className="w-[100px] font-mono text-[13px] font-medium text-text-0">
                    {reporte.ordenes_servicio?.numero_orden ?? "—"}
                  </div>
                  <div className="w-[160px] text-[13px] text-text-1">
                    {reporte.sucursales
                      ? `${reporte.sucursales.nombre} (${reporte.sucursales.numero})`
                      : "—"}
                  </div>
                  <div className="w-[120px] text-[13px] text-text-1">
                    {reporte.users?.nombre ?? "—"}
                  </div>
                  <div className="w-[100px]">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div className="w-[80px] text-center">
                    {reporte.finalizado_por_admin ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mx-auto h-4 w-4 text-status-success"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-[13px] text-text-3">—</span>
                    )}
                  </div>
                  <div className="flex w-[140px] items-center justify-end gap-3">
                    <Link
                      href={`/admin/reportes/${reporte.id}`}
                      className="text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
                    >
                      Ver →
                    </Link>
                    <ReporteDeleteButton
                      reporteId={reporte.id}
                      reporteLabel={`${reporte.ordenes_servicio?.numero_orden ?? "—"} - ${new Date(reporte.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}`}
                      photoCount={reporte.reporte_fotos?.length ?? 0}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
