import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Equipo, Sucursal } from "@/types";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteEquipo } from "@/app/actions/equipos";

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

  return (
    <div className="min-h-dvh bg-admin-bg px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        {/* Back link */}
        <Link
          href="/admin/equipos"
          className="mb-6 inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
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
          Volver a equipos
        </Link>

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Equipos — {branch.nombre} ({branch.numero})
            </h1>
          </div>
          <Link
            href={`/admin/equipos/${sucursalId}/nuevo`}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
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
            Crear Equipo
          </Link>
        </div>

        {/* Equipment List */}
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
              No hay equipos en esta sucursal
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Crea el primer equipo para esta sucursal
            </p>
            <Link
              href={`/admin/equipos/${sucursalId}/nuevo`}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-3 font-medium text-white transition-colors hover:bg-brand-600"
            >
              Crear primer equipo
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface">
            <table className="w-full">
              <thead>
                <tr className="border-b border-admin-border text-left text-sm text-gray-400">
                  <th className="px-6 py-4 font-medium">Etiqueta</th>
                  <th className="px-6 py-4 font-medium">Marca</th>
                  <th className="px-6 py-4 font-medium">Modelo</th>
                  <th className="px-6 py-4 font-medium">Serie</th>
                  <th className="px-6 py-4 font-medium">Tipo</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {list.map((equipo) => (
                  <tr key={equipo.id} className="hover:bg-admin-bg/50">
                    <td className="px-6 py-4 font-medium text-white">
                      {equipo.numero_etiqueta}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {equipo.marca ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {equipo.modelo ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {equipo.numero_serie ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {equipo.tipo_equipo ?? "—"}
                    </td>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/equipos/${sucursalId}/${equipo.id}/editar`}
                          className="text-sm font-medium text-brand-400 transition-colors hover:text-brand-300"
                        >
                          Editar
                        </Link>
                        <DeleteButton
                          id={equipo.id}
                          action={deleteEquipo}
                          confirmMessage="Esta seguro de eliminar este equipo?"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
