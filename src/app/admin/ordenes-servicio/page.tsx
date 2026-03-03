import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { OrdenServicio, OrdenServicioEstatus } from "@/types";
import { OrdenDeleteButton } from "@/components/admin/orden-delete-button";

type OrdenWithRelations = OrdenServicio & {
  sucursales: { nombre: string; numero: string } | null;
  clientes: { nombre: string } | null;
  orden_asignados: {
    usuario_id: string;
    users: { nombre: string; rol: string } | null;
  }[];
  reportes: { id: string }[];
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

export default async function OrdenesServicioPage() {
  const supabase = await createClient();

  const { data: ordenes } = await supabase
    .from("ordenes_servicio")
    .select(
      "*, sucursales(nombre, numero), clientes(nombre), orden_asignados(usuario_id, users(nombre, rol)), reportes(id)"
    )
    .order("created_at", { ascending: false });

  const list = (ordenes as OrdenWithRelations[] | null) ?? [];

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-[-0.025em] text-text-0">
          Ordenes de Servicio
        </h1>
        <Link
          href="/admin/ordenes-servicio/nuevo"
          className="inline-flex items-center gap-1.5 rounded-[6px] border border-admin-border px-3 py-1.5 text-[13px] font-medium text-text-1 transition-colors duration-[80ms] hover:bg-admin-surface-hover"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Crear Orden
        </Link>
      </div>

      {/* Orden List */}
      {list.length === 0 ? (
        <div className="rounded-[10px] border border-admin-border bg-admin-surface py-28 text-center">
          <p className="text-[13px] text-text-3">No hay ordenes de servicio registradas</p>
          <Link
            href="/admin/ordenes-servicio/nuevo"
            className="mt-3 inline-block text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
          >
            Crear primera orden de servicio →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-visible rounded-[10px] border border-admin-border bg-admin-surface">
          <div className="min-w-[800px]">
            {/* Header row */}
            <div className="flex items-center border-b border-admin-border-subtle px-[14px] py-[10px] text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
              <div className="w-[100px]">ODS</div>
              <div className="w-[160px]">Sucursal</div>
              <div className="w-[120px]">Cliente</div>
              <div className="w-[100px]">Estatus</div>
              <div className="w-[80px]">Equipo</div>
              <div className="flex-1">Fecha</div>
              <div className="w-[140px] text-right">Acciones</div>
            </div>

            {/* Data rows */}
            {list.map((orden, i) => {
              const status = statusConfig[orden.estatus] ?? statusConfig.abierto;
              return (
                <div
                  key={orden.id}
                  className={`flex items-center px-[14px] py-[9px] transition-colors duration-[80ms] hover:bg-admin-surface-hover${i > 0 ? " row-inset-divider" : ""}`}
                >
                  <div className="w-[100px] font-mono text-[13px] font-medium text-text-0">
                    {orden.numero_orden}
                  </div>
                  <div className="w-[160px] text-[13px] text-text-1">
                    {orden.sucursales
                      ? `${orden.sucursales.nombre} (${orden.sucursales.numero})`
                      : "—"}
                  </div>
                  <div className="w-[120px] text-[13px] text-text-1">
                    {orden.clientes?.nombre ?? "—"}
                  </div>
                  <div className="w-[100px]">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div className="w-[80px] font-mono text-[13px] text-text-2">
                    {orden.orden_asignados.length}
                  </div>
                  <div className="flex-1 font-mono text-[13px] text-text-2">
                    {new Date(orden.created_at).toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  <div className="flex w-[140px] items-center justify-end gap-3">
                    <Link
                      href={`/admin/ordenes-servicio/${orden.id}`}
                      className="text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
                    >
                      Ver →
                    </Link>
                    <OrdenDeleteButton
                      ordenId={orden.id}
                      ordenLabel={orden.numero_orden}
                      reportCount={orden.reportes?.length ?? 0}
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
