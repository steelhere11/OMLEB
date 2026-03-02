import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Equipo, Sucursal } from "@/types";
import { EquipoDeleteButton } from "@/components/admin/equipo-delete-button";

export default async function EquiposSucursalPage({
  params,
}: {
  params: Promise<{ sucursalId: string }>;
}) {
  const { sucursalId } = await params;
  const supabase = await createClient();

  // Fetch branch info
  const { data: sucursal } = await supabase
    .from("sucursales")
    .select("*")
    .eq("id", sucursalId)
    .single();

  if (!sucursal) notFound();

  const branch = sucursal as Sucursal;

  // Fetch equipment for this branch
  const { data: equipos } = await supabase
    .from("equipos")
    .select("*")
    .eq("sucursal_id", sucursalId)
    .order("numero_etiqueta");

  const list = (equipos as Equipo[] | null) ?? [];

  // Fetch report reference counts for each equipment
  const equipoIds = list.map((e) => e.id);
  const reportRefMap = new Map<string, number>();
  if (equipoIds.length > 0) {
    const { data: refs } = await supabase
      .from("reporte_equipos")
      .select("equipo_id")
      .in("equipo_id", equipoIds);
    if (refs) {
      for (const ref of refs) {
        reportRefMap.set(ref.equipo_id, (reportRefMap.get(ref.equipo_id) ?? 0) + 1);
      }
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back link */}
      <Link
        href="/admin/equipos"
        className="mb-4 inline-flex items-center gap-1 text-[13px] text-text-2 transition-colors duration-[80ms] hover:text-text-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver a equipos
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-[22px] font-bold tracking-[-0.025em] text-text-0">
            Equipos
          </h1>
          <span className="text-[22px] text-text-3">—</span>
          <span className="text-[22px] font-bold tracking-[-0.025em] text-text-0">
            {branch.nombre}
          </span>
          <span className="font-mono text-[14px] text-text-3">
            ({branch.numero})
          </span>
        </div>
        <Link
          href={`/admin/equipos/${sucursalId}/nuevo`}
          className="inline-flex items-center gap-1.5 rounded-[6px] border border-admin-border px-3 py-1.5 text-[13px] font-medium text-text-1 transition-colors duration-[80ms] hover:bg-admin-surface-hover"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Crear Equipo
        </Link>
      </div>

      {/* Equipment List */}
      {list.length === 0 ? (
        <div className="rounded-[10px] border border-admin-border bg-admin-surface py-28 text-center">
          <p className="text-[13px] text-text-3">No hay equipos en esta sucursal</p>
          <Link
            href={`/admin/equipos/${sucursalId}/nuevo`}
            className="mt-3 inline-block text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
          >
            Crear primer equipo →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-admin-border bg-admin-surface">
          {/* Header row */}
          <div className="flex items-center border-b border-admin-border-subtle px-[14px] py-[10px] text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
            <div className="w-[140px]">Etiqueta</div>
            <div className="w-[100px]">Marca</div>
            <div className="w-[100px]">Modelo</div>
            <div className="w-[120px]">Serie</div>
            <div className="flex-1">Tipo</div>
            <div className="w-[100px]">Estado</div>
            <div className="w-[140px] text-right">Acciones</div>
          </div>

          {/* Data rows */}
          {list.map((equipo, i) => (
            <div
              key={equipo.id}
              className={`flex items-center px-[14px] py-[9px] transition-colors duration-[80ms] hover:bg-admin-surface-hover${i > 0 ? " row-inset-divider" : ""}`}
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
              <div className="w-[120px] font-mono text-[13px] text-text-2">
                {equipo.numero_serie ?? "—"}
              </div>
              <div className="flex-1 text-[13px] text-text-1">
                {equipo.tipo_equipo ?? "—"}
              </div>
              <div className="w-[100px]">
                {equipo.revisado ? (
                  <span className="inline-flex items-center rounded-full bg-status-success/10 px-2.5 py-0.5 text-xs font-medium text-status-success">
                    Revisado
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-status-warning/10 px-2.5 py-0.5 text-xs font-medium text-status-warning">
                    Pendiente
                  </span>
                )}
              </div>
              <div className="flex w-[140px] items-center justify-end gap-3">
                <Link
                  href={`/admin/equipos/${sucursalId}/${equipo.id}/editar`}
                  className="text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
                >
                  Editar →
                </Link>
                <EquipoDeleteButton
                  equipoId={equipo.id}
                  equipoLabel={equipo.numero_etiqueta}
                  reportRefCount={reportRefMap.get(equipo.id) ?? 0}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
