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

  const rolBadge: Record<string, string> = {
    admin: "bg-text-1/10 text-text-1",
    tecnico: "bg-status-progress/10 text-status-progress",
    ayudante: "bg-status-warning/10 text-status-warning",
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-[-0.025em] text-text-0">
          Usuarios
        </h1>
        <Link
          href="/admin/usuarios/nuevo"
          className="inline-flex items-center gap-1.5 rounded-[6px] border border-admin-border px-3 py-1.5 text-[13px] font-medium text-text-1 transition-colors duration-[80ms] hover:bg-admin-surface-hover"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Crear Usuario
        </Link>
      </div>

      {/* User List */}
      {userList.length === 0 ? (
        <div className="rounded-[10px] border border-admin-border bg-admin-surface py-28 text-center">
          <p className="text-[13px] text-text-3">No hay usuarios registrados</p>
          <Link
            href="/admin/usuarios/nuevo"
            className="mt-3 inline-block text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
          >
            Crear primer usuario →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-admin-border bg-admin-surface">
          {/* Header row */}
          <div className="flex items-center border-b border-admin-border-subtle px-[14px] py-[10px] text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
            <div className="w-[200px]">Nombre</div>
            <div className="flex-1">Correo</div>
            <div className="w-[120px]">Rol</div>
            <div className="w-[140px] text-right">Fecha</div>
          </div>

          {/* Data rows */}
          {userList.map((user, i) => (
            <div
              key={user.id}
              className={`flex items-center px-[14px] py-[9px] transition-colors duration-[80ms] hover:bg-admin-surface-hover${i > 0 ? " row-inset-divider" : ""}`}
            >
              <div className="w-[200px] text-[13px] font-medium text-text-0">
                {user.nombre}
              </div>
              <div className="flex-1 text-[13px] text-text-1">
                {user.email}
              </div>
              <div className="w-[120px]">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${rolBadge[user.rol] ?? "bg-text-1/10 text-text-1"}`}
                >
                  {rolLabels[user.rol] ?? user.rol}
                </span>
              </div>
              <div className="w-[140px] text-right font-mono text-[13px] text-text-2">
                {new Date(user.created_at).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
