import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@/types";

export default async function UsuariosPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  const userList = (users as User[] | null) ?? [];

  const rolLabels: Record<string, string> = {
    admin: "Administrador",
    tecnico: "Tecnico",
    ayudante: "Ayudante",
  };

  return (
    <div className="min-h-dvh bg-admin-bg px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <Link
            href="/admin/usuarios/nuevo"
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
            Crear Usuario
          </Link>
        </div>

        {/* User List */}
        {userList.length === 0 ? (
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-300">
              No hay usuarios registrados
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Crea el primer usuario para comenzar
            </p>
            <Link
              href="/admin/usuarios/nuevo"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-3 font-medium text-white transition-colors hover:bg-brand-600"
            >
              Crear primer usuario
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface">
            <table className="w-full">
              <thead>
                <tr className="border-b border-admin-border text-left text-sm text-gray-400">
                  <th className="px-6 py-4 font-medium">Nombre</th>
                  <th className="px-6 py-4 font-medium">Correo</th>
                  <th className="px-6 py-4 font-medium">Rol</th>
                  <th className="px-6 py-4 font-medium">Fecha de creacion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {userList.map((user) => (
                  <tr key={user.id} className="hover:bg-admin-bg/50">
                    <td className="px-6 py-4 font-medium text-white">
                      {user.nombre}
                    </td>
                    <td className="px-6 py-4 text-gray-300">{user.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.rol === "admin"
                            ? "bg-brand-900/50 text-brand-300"
                            : user.rol === "tecnico"
                              ? "bg-green-900/50 text-green-300"
                              : "bg-yellow-900/50 text-yellow-300"
                        }`}
                      >
                        {rolLabels[user.rol] ?? user.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(user.created_at).toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
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
