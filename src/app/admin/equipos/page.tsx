import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Equipo, Sucursal } from "@/types";

type EquipoWithSucursal = Equipo & {
  sucursales: Pick<Sucursal, "nombre" | "numero"> | null;
};

export default async function EquiposPage() {
  const supabase = await createClient();

  const { data: equipos } = await supabase
    .from("equipos")
    .select("*, sucursales(nombre, numero)")
    .order("created_at", { ascending: false });

  const list = (equipos as EquipoWithSucursal[] | null) ?? [];

  // Group equipment by sucursal_id
  const grouped = new Map<
    string,
    { sucursal: Pick<Sucursal, "nombre" | "numero">; items: EquipoWithSucursal[] }
  >();

  for (const equipo of list) {
    const key = equipo.sucursal_id;
    if (!grouped.has(key)) {
      grouped.set(key, {
        sucursal: equipo.sucursales ?? { nombre: "Sin sucursal", numero: "" },
        items: [],
      });
    }
    grouped.get(key)!.items.push(equipo);
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-[-0.025em] text-text-0">
          Equipos
        </h1>
      </div>

      {/* Equipment List Grouped by Branch */}
      {list.length === 0 ? (
        <div className="rounded-[10px] border border-admin-border bg-admin-surface py-28 text-center">
          <p className="text-[13px] text-text-3">No hay equipos registrados</p>
          <Link
            href="/admin/sucursales"
            className="mt-3 inline-block text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
          >
            Ir a sucursales →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(
            ([sucursalId, { sucursal, items }]) => (
              <div
                key={sucursalId}
                className="overflow-hidden rounded-[10px] border border-admin-border bg-admin-surface"
              >
                {/* Branch header */}
                <div className="flex items-center justify-between border-b border-admin-border-subtle px-[14px] py-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold tracking-[-0.01em] text-text-0">
                      {sucursal.nombre}
                    </span>
                    {sucursal.numero && (
                      <span className="font-mono text-[12px] text-text-3">
                        #{sucursal.numero}
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/admin/equipos/${sucursalId}`}
                    className="text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
                  >
                    Ver todos ({items.length}) →
                  </Link>
                </div>

                {/* Column headers */}
                <div className="flex items-center border-b border-admin-border-subtle px-[14px] py-[8px] text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
                  <div className="w-[160px]">Etiqueta</div>
                  <div className="w-[120px]">Marca</div>
                  <div className="flex-1">Modelo</div>
                  <div className="w-[120px]">Tipo</div>
                  <div className="w-[120px] text-right">Estado</div>
                </div>

                {/* Equipment rows */}
                {items.map((equipo, i) => (
                  <div
                    key={equipo.id}
                    className={`flex items-center px-[14px] py-[9px] transition-colors duration-[80ms] hover:bg-admin-surface-hover${i > 0 ? " row-inset-divider" : ""}`}
                  >
                    <div className="w-[160px] font-mono text-[13px] font-medium text-text-0">
                      {equipo.numero_etiqueta}
                    </div>
                    <div className="w-[120px] text-[13px] text-text-1">
                      {equipo.marca ?? "—"}
                    </div>
                    <div className="flex-1 text-[13px] text-text-1">
                      {equipo.modelo ?? "—"}
                    </div>
                    <div className="w-[120px] text-[13px] text-text-1">
                      {equipo.tipo_equipo ?? "—"}
                    </div>
                    <div className="w-[120px] text-right">
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
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
