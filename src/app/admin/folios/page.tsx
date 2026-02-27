import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Folio, FolioEstatus } from "@/types";

type FolioWithRelations = Folio & {
  sucursales: { nombre: string; numero: string } | null;
  clientes: { nombre: string } | null;
  folio_asignados: {
    usuario_id: string;
    users: { nombre: string; rol: string } | null;
  }[];
};

const statusConfig: Record<
  FolioEstatus,
  { label: string; className: string }
> = {
  abierto: {
    label: "Abierto",
    className: "bg-blue-900/30 text-blue-400",
  },
  en_progreso: {
    label: "En Progreso",
    className: "bg-yellow-900/30 text-yellow-400",
  },
  completado: {
    label: "Completado",
    className: "bg-green-900/30 text-green-400",
  },
  en_espera: {
    label: "En Espera",
    className: "bg-orange-900/30 text-orange-400",
  },
};

export default async function FoliosPage() {
  const supabase = await createClient();

  const { data: folios } = await supabase
    .from("folios")
    .select(
      "*, sucursales(nombre, numero), clientes(nombre), folio_asignados(usuario_id, users(nombre, rol))"
    )
    .order("created_at", { ascending: false });

  const list = (folios as FolioWithRelations[] | null) ?? [];

  return (
    <div className="min-h-dvh bg-admin-bg px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Folios</h1>
          <Link
            href="/admin/folios/nuevo"
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
            Crear Folio
          </Link>
        </div>

        {/* Folio List */}
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-300">
              No hay folios registrados
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Crea el primer folio para comenzar
            </p>
            <Link
              href="/admin/folios/nuevo"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-3 font-medium text-white transition-colors hover:bg-brand-600"
            >
              Crear primer folio
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface">
            <table className="w-full">
              <thead>
                <tr className="border-b border-admin-border text-left text-sm text-gray-400">
                  <th className="px-6 py-4 font-medium">Numero Folio</th>
                  <th className="px-6 py-4 font-medium">Sucursal</th>
                  <th className="px-6 py-4 font-medium">Cliente</th>
                  <th className="px-6 py-4 font-medium">Estatus</th>
                  <th className="px-6 py-4 font-medium">Equipo asignado</th>
                  <th className="px-6 py-4 font-medium">Fecha</th>
                  <th className="px-6 py-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {list.map((folio) => {
                  const status = statusConfig[folio.estatus] ?? statusConfig.abierto;
                  return (
                    <tr key={folio.id} className="hover:bg-admin-bg/50">
                      <td className="px-6 py-4 font-medium text-white">
                        {folio.numero_folio}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {folio.sucursales
                          ? `${folio.sucursales.nombre} (${folio.sucursales.numero})`
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {folio.clientes?.nombre ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {folio.folio_asignados.length}{" "}
                        {folio.folio_asignados.length === 1
                          ? "usuario"
                          : "usuarios"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(folio.created_at).toLocaleDateString(
                          "es-MX",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/folios/${folio.id}/editar`}
                          className="text-sm font-medium text-brand-400 transition-colors hover:text-brand-300"
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
