import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Sucursal } from "@/types";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteSucursal } from "@/app/actions/sucursales";

export default async function SucursalesPage() {
  const supabase = await createClient();

  const { data: sucursales } = await supabase
    .from("sucursales")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (sucursales as Sucursal[] | null) ?? [];

  return (
    <div className="min-h-dvh bg-admin-bg px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Sucursales</h1>
          <Link
            href="/admin/sucursales/nuevo"
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
            Crear Sucursal
          </Link>
        </div>

        {/* Branch List */}
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-300">
              No hay sucursales registradas
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Crea la primera sucursal para comenzar
            </p>
            <Link
              href="/admin/sucursales/nuevo"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-3 font-medium text-white transition-colors hover:bg-brand-600"
            >
              Crear primera sucursal
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface">
            <table className="w-full">
              <thead>
                <tr className="border-b border-admin-border text-left text-sm text-gray-400">
                  <th className="px-6 py-4 font-medium">Nombre</th>
                  <th className="px-6 py-4 font-medium">Numero</th>
                  <th className="px-6 py-4 font-medium">Direccion</th>
                  <th className="px-6 py-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {list.map((sucursal) => (
                  <tr key={sucursal.id} className="hover:bg-admin-bg/50">
                    <td className="px-6 py-4 font-medium text-white">
                      {sucursal.nombre}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {sucursal.numero}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {sucursal.direccion}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/sucursales/${sucursal.id}/editar`}
                          className="text-sm font-medium text-brand-400 transition-colors hover:text-brand-300"
                        >
                          Editar
                        </Link>
                        <Link
                          href={`/admin/equipos/${sucursal.id}`}
                          className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
                        >
                          Ver equipos
                        </Link>
                        <DeleteButton
                          id={sucursal.id}
                          action={deleteSucursal}
                          confirmMessage="Esta seguro de eliminar esta sucursal?"
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
