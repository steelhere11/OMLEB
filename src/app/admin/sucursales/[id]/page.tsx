import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Sucursal, Equipo, OrdenServicioEstatus, ReporteEstatus } from "@/types";

type SucursalWithCliente = Sucursal & {
  clientes: { nombre: string } | null;
};

type OrdenSummary = {
  id: string;
  numero_orden: string;
  descripcion_problema: string;
  estatus: OrdenServicioEstatus;
  created_at: string;
};

type ReporteSummary = {
  id: string;
  fecha: string;
  estatus: ReporteEstatus;
  orden_servicio_id: string;
};

const odsStatusConfig: Record<
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

export default async function SucursalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch branch with client, equipment, and ODS in parallel
  const [sucursalRes, equiposRes, ordenesRes] = await Promise.all([
    supabase
      .from("sucursales")
      .select("*, clientes(nombre)")
      .eq("id", id)
      .single(),
    supabase
      .from("equipos")
      .select("*")
      .eq("sucursal_id", id)
      .order("numero_etiqueta"),
    supabase
      .from("ordenes_servicio")
      .select("id, numero_orden, descripcion_problema, estatus, created_at")
      .eq("sucursal_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!sucursalRes.data) notFound();

  const sucursal = sucursalRes.data as unknown as SucursalWithCliente;
  const equipos = (equiposRes.data as Equipo[] | null) ?? [];
  const ordenes = (ordenesRes.data as OrdenSummary[] | null) ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back link */}
      <Link
        href="/admin/sucursales"
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
        Volver a sucursales
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.025em] text-text-0">
            {sucursal.nombre}{" "}
            <span className="font-mono text-[14px] text-text-3">
              ({sucursal.numero})
            </span>
          </h1>
          <div className="mt-1 flex items-center gap-3 text-[13px] text-text-2">
            <span>
              Cliente:{" "}
              {sucursal.clientes?.nombre ?? (
                <span className="text-text-3">Sin cliente asignado</span>
              )}
            </span>
            <span className="text-text-3">|</span>
            <span>{sucursal.direccion}</span>
          </div>
        </div>
        <Link
          href={`/admin/sucursales/${id}/editar`}
          className="inline-flex items-center gap-1.5 rounded-[6px] border border-admin-border px-3 py-1.5 text-[13px] font-medium text-text-1 transition-colors duration-[80ms] hover:bg-admin-surface-hover"
        >
          Editar
        </Link>
      </div>

      <div className="space-y-6">
        {/* ── Equipos Section ──────────────────────────────────────── */}
        <div className="rounded-[10px] border border-admin-border bg-admin-surface">
          <div className="flex items-center justify-between border-b border-admin-border-subtle px-5 py-3">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
              Equipos ({equipos.length})
            </h2>
            <Link
              href={`/admin/equipos/${id}/nuevo`}
              className="inline-flex items-center gap-1 text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Agregar Equipo
            </Link>
          </div>

          {equipos.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[13px] text-text-3">
                No hay equipos en esta sucursal
              </p>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div className="flex items-center border-b border-admin-border-subtle px-5 py-[8px] text-[11px] font-medium uppercase tracking-[0.04em] text-text-3">
                <div className="w-[140px]">Etiqueta</div>
                <div className="w-[100px]">Marca</div>
                <div className="w-[100px]">Modelo</div>
                <div className="flex-1">Tipo</div>
                <div className="w-[80px]">Estado</div>
                <div className="w-[60px] text-right">Accion</div>
              </div>
              {equipos.map((equipo, i) => (
                <div
                  key={equipo.id}
                  className={`flex items-center px-5 py-[7px] transition-colors duration-[80ms] hover:bg-admin-surface-hover${i > 0 ? " row-inset-divider" : ""}`}
                >
                  <div className="w-[140px] font-mono text-[13px] font-medium text-text-0">
                    {equipo.numero_etiqueta}
                  </div>
                  <div className="w-[100px] text-[13px] text-text-1">
                    {equipo.marca ?? "—"}
                  </div>
                  <div className="w-[100px] text-[13px] text-text-1">
                    {equipo.modelo ?? "—"}
                  </div>
                  <div className="flex-1 text-[13px] text-text-2">
                    {equipo.tipo_equipo ?? "—"}
                  </div>
                  <div className="w-[80px]">
                    {equipo.revisado ? (
                      <span className="inline-flex items-center rounded-full bg-status-success/10 px-2 py-0.5 text-[10px] font-medium text-status-success">
                        Revisado
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-status-warning/10 px-2 py-0.5 text-[10px] font-medium text-status-warning">
                        Pendiente
                      </span>
                    )}
                  </div>
                  <div className="w-[60px] text-right">
                    <Link
                      href={`/admin/equipos/${id}/${equipo.id}/editar`}
                      className="text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
                    >
                      Editar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Ordenes de Servicio Section ───────────────────────── */}
        <div className="rounded-[10px] border border-admin-border bg-admin-surface">
          <div className="flex items-center justify-between border-b border-admin-border-subtle px-5 py-3">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
              Ordenes de Servicio ({ordenes.length})
            </h2>
            <Link
              href={`/admin/ordenes-servicio/nuevo?sucursal_id=${id}`}
              className="inline-flex items-center gap-1 text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Crear ODS
            </Link>
          </div>

          {ordenes.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[13px] text-text-3">
                No hay ordenes de servicio para esta sucursal
              </p>
            </div>
          ) : (
            <div className="divide-y divide-admin-border-subtle">
              {ordenes.map((orden) => {
                const status =
                  odsStatusConfig[orden.estatus] ?? odsStatusConfig.abierto;
                return (
                  <Link
                    key={orden.id}
                    href={`/admin/ordenes-servicio/${orden.id}`}
                    className="flex items-center justify-between px-5 py-3 transition-colors duration-[80ms] hover:bg-admin-surface-hover"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[13px] font-medium text-text-0">
                        {orden.numero_orden}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-text-2">
                        {orden.descripcion_problema}
                      </p>
                    </div>
                    <div className="ml-4 flex items-center gap-3">
                      <span className="text-[12px] text-text-3">
                        {new Date(orden.created_at).toLocaleDateString(
                          "es-MX",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
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
