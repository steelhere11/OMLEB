import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Sucursal } from "@/types";
import { SucursalDeleteButton } from "@/components/admin/sucursal-delete-button";

export default async function SucursalesPage() {
  const supabase = await createClient();

  const { data: sucursales } = await supabase
    .from("sucursales")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (sucursales as Sucursal[] | null) ?? [];

  // Fetch cascade impact data per sucursal
  const sucursalIds = list.map((s) => s.id);
  type ImpactData = { folios: number; reportes: number; equipos: number; fotos: number };
  const impactMap = new Map<string, ImpactData>();

  if (sucursalIds.length > 0) {
    // Folios per sucursal
    const { data: folioRows } = await supabase
      .from("folios")
      .select("id, sucursal_id")
      .in("sucursal_id", sucursalIds);

    // Equipos per sucursal
    const { data: equipoRows } = await supabase
      .from("equipos")
      .select("id, sucursal_id")
      .in("sucursal_id", sucursalIds);

    // Reports per sucursal (via folios or direct sucursal_id)
    const { data: reporteRows } = await supabase
      .from("reportes")
      .select("id, sucursal_id")
      .in("sucursal_id", sucursalIds);

    // Photos per report
    const reporteIds = (reporteRows ?? []).map((r) => r.id);
    let photoCountMap = new Map<string, number>();
    if (reporteIds.length > 0) {
      const { data: photoRows } = await supabase
        .from("reporte_fotos")
        .select("reporte_id")
        .in("reporte_id", reporteIds);
      if (photoRows) {
        for (const p of photoRows) {
          photoCountMap.set(p.reporte_id, (photoCountMap.get(p.reporte_id) ?? 0) + 1);
        }
      }
    }

    // Build impact map
    for (const sid of sucursalIds) {
      const folioCount = (folioRows ?? []).filter((f) => f.sucursal_id === sid).length;
      const reporteCount = (reporteRows ?? []).filter((r) => r.sucursal_id === sid).length;
      const equipoCount = (equipoRows ?? []).filter((e) => e.sucursal_id === sid).length;
      const sucursalReporteIds = (reporteRows ?? [])
        .filter((r) => r.sucursal_id === sid)
        .map((r) => r.id);
      const photoCount = sucursalReporteIds.reduce(
        (sum, rid) => sum + (photoCountMap.get(rid) ?? 0),
        0
      );

      impactMap.set(sid, {
        folios: folioCount,
        reportes: reporteCount,
        equipos: equipoCount,
        fotos: photoCount,
      });
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-[-0.025em] text-text-0">
          Sucursales
        </h1>
        <Link
          href="/admin/sucursales/nuevo"
          className="inline-flex items-center gap-1.5 rounded-[6px] border border-admin-border px-3 py-1.5 text-[13px] font-medium text-text-1 transition-colors duration-[80ms] hover:bg-admin-surface-hover"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Crear Sucursal
        </Link>
      </div>

      {/* Branch List */}
      {list.length === 0 ? (
        <div className="rounded-[10px] border border-admin-border bg-admin-surface py-28 text-center">
          <p className="text-[13px] text-text-3">No hay sucursales registradas</p>
          <Link
            href="/admin/sucursales/nuevo"
            className="mt-3 inline-block text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
          >
            Crear primera sucursal →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-admin-border bg-admin-surface">
          {/* Header row */}
          <div className="flex items-center border-b border-admin-border-subtle px-[14px] py-[10px] text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
            <div className="w-[200px]">Nombre</div>
            <div className="w-[100px]">Numero</div>
            <div className="flex-1">Direccion</div>
            <div className="w-[200px] text-right">Acciones</div>
          </div>

          {/* Data rows */}
          {list.map((sucursal, i) => (
            <div
              key={sucursal.id}
              className={`flex items-center px-[14px] py-[9px] transition-colors duration-[80ms] hover:bg-admin-surface-hover${i > 0 ? " row-inset-divider" : ""}`}
            >
              <div className="w-[200px] text-[13px] font-medium text-text-0">
                {sucursal.nombre}
              </div>
              <div className="w-[100px] font-mono text-[13px] text-text-1">
                {sucursal.numero}
              </div>
              <div className="flex-1 text-[13px] text-text-1">
                {sucursal.direccion}
              </div>
              <div className="flex w-[200px] items-center justify-end gap-3">
                <Link
                  href={`/admin/sucursales/${sucursal.id}/editar`}
                  className="text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
                >
                  Editar →
                </Link>
                <Link
                  href={`/admin/equipos/${sucursal.id}`}
                  className="text-[13px] font-medium text-text-2 transition-colors duration-[80ms] hover:text-text-0"
                >
                  Equipos
                </Link>
                <SucursalDeleteButton
                  sucursalId={sucursal.id}
                  sucursalLabel={`${sucursal.nombre} (${sucursal.numero})`}
                  folioCount={impactMap.get(sucursal.id)?.folios ?? 0}
                  reportCount={impactMap.get(sucursal.id)?.reportes ?? 0}
                  equipoCount={impactMap.get(sucursal.id)?.equipos ?? 0}
                  photoCount={impactMap.get(sucursal.id)?.fotos ?? 0}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
