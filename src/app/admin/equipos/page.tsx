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
    <div className="min-h-dvh bg-admin-bg px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Equipos</h1>
        </div>

        {/* Equipment List Grouped by Branch */}
        {list.length === 0 ? (
          <div className="rounded-xl border border-admin-border bg-admin-surface p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-admin-border bg-admin-bg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-300">
              No hay equipos registrados
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Agrega equipos desde la seccion de sucursales
            </p>
            <Link
              href="/admin/sucursales"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-3 font-medium text-white transition-colors hover:bg-brand-600"
            >
              Ir a sucursales
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(grouped.entries()).map(
              ([sucursalId, { sucursal, items }]) => (
                <div
                  key={sucursalId}
                  className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface"
                >
                  {/* Branch header */}
                  <div className="flex items-center justify-between border-b border-admin-border px-6 py-4">
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        {sucursal.nombre}
                      </h2>
                      {sucursal.numero && (
                        <p className="text-sm text-gray-400">
                          Sucursal #{sucursal.numero}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/admin/equipos/${sucursalId}`}
                      className="text-sm font-medium text-brand-400 transition-colors hover:text-brand-300"
                    >
                      Ver todos ({items.length})
                    </Link>
                  </div>

                  {/* Equipment rows */}
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-admin-border text-left text-sm text-gray-400">
                        <th className="px-6 py-3 font-medium">Etiqueta</th>
                        <th className="px-6 py-3 font-medium">Marca</th>
                        <th className="px-6 py-3 font-medium">Modelo</th>
                        <th className="px-6 py-3 font-medium">Tipo</th>
                        <th className="px-6 py-3 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-admin-border">
                      {items.map((equipo) => (
                        <tr
                          key={equipo.id}
                          className="hover:bg-admin-bg/50"
                        >
                          <td className="px-6 py-3 font-medium text-white">
                            {equipo.numero_etiqueta}
                          </td>
                          <td className="px-6 py-3 text-gray-300">
                            {equipo.marca ?? "—"}
                          </td>
                          <td className="px-6 py-3 text-gray-300">
                            {equipo.modelo ?? "—"}
                          </td>
                          <td className="px-6 py-3 text-gray-300">
                            {equipo.tipo_equipo ?? "—"}
                          </td>
                          <td className="px-6 py-3">
                            {equipo.revisado ? (
                              <span className="inline-flex items-center rounded-full bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-400">
                                Revisado
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-yellow-900/30 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
                                Pendiente revision
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
