import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Equipo, Sucursal } from "@/types";

type EquipoWithRelations = Equipo & {
  sucursales: Pick<Sucursal, "nombre" | "numero"> | null;
  tipos_equipo: { nombre: string } | null;
  orden_equipos: {
    orden_servicio_id: string;
    ordenes_servicio: { numero_orden: string; estatus: string } | null;
  }[];
};

export default async function EquiposPage() {
  const supabase = await createClient();

  const { data: equipos } = await supabase
    .from("equipos")
    .select(
      "*, sucursales(nombre, numero), tipos_equipo:tipo_equipo_id(nombre), orden_equipos(orden_servicio_id, ordenes_servicio:orden_servicio_id(numero_orden, estatus))"
    )
    .order("created_at", { ascending: false });

  const list = (equipos as EquipoWithRelations[] | null) ?? [];

  // Group equipment by sucursal_id
  const grouped = new Map<
    string,
    {
      sucursal: Pick<Sucursal, "nombre" | "numero">;
      items: EquipoWithRelations[];
    }
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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-[-0.025em] text-text-0">
          Equipos
        </h1>
      </div>

      {/* Info banner */}
      <div className="mb-6 rounded-[8px] border border-accent/20 bg-accent/5 px-4 py-3">
        <p className="text-[13px] text-text-1">
          Los equipos se agregan desde las ordenes de servicio. Aqui puedes consultar el
          historial y editar detalles.
        </p>
      </div>

      {/* Equipment List Grouped by Branch */}
      {list.length === 0 ? (
        <div className="rounded-[10px] border border-admin-border bg-admin-surface py-28 text-center">
          <p className="text-[13px] text-text-3">No hay equipos registrados</p>
          <Link
            href="/admin/ordenes-servicio/nuevo"
            className="mt-3 inline-block text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
          >
            Crear una orden de servicio para agregar equipos →
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
                  <span className="text-[12px] text-text-3">
                    {items.length}{" "}
                    {items.length === 1 ? "equipo" : "equipos"}
                  </span>
                </div>

                {/* Column headers */}
                <div className="flex items-center border-b border-admin-border-subtle px-[14px] py-[8px] text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
                  <div className="w-[140px]">Etiqueta</div>
                  <div className="w-[100px]">Marca</div>
                  <div className="w-[100px]">Modelo</div>
                  <div className="w-[100px]">Tipo</div>
                  <div className="flex-1">Ordenes</div>
                  <div className="w-[100px] text-right">Estado</div>
                </div>

                {/* Equipment rows */}
                {items.map((equipo, i) => {
                  const ordenCount = equipo.orden_equipos?.length ?? 0;
                  return (
                    <Link
                      key={equipo.id}
                      href={`/admin/equipos/${sucursalId}/${equipo.id}/editar`}
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
                      <div className="w-[100px] text-[13px] text-text-1">
                        {equipo.tipos_equipo?.nombre ?? equipo.tipo_equipo ?? "—"}
                      </div>
                      <div className="flex-1 text-[13px] text-text-2">
                        {ordenCount === 0
                          ? "—"
                          : `${ordenCount} ${ordenCount === 1 ? "orden" : "ordenes"}`}
                      </div>
                      <div className="w-[100px] text-right">
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
                    </Link>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
