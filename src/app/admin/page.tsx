import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const quickActions = [
  {
    label: "Crear Cliente",
    href: "/admin/clientes/nuevo",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    description: "Agregar un nuevo cliente al sistema",
  },
  {
    label: "Crear Sucursal",
    href: "/admin/sucursales/nuevo",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    description: "Registrar una nueva sucursal",
  },
  {
    label: "Crear Tecnico",
    href: "/admin/usuarios/nuevo",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
    description: "Crear cuenta de tecnico o ayudante",
  },
];

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const nombre = (user?.user_metadata?.nombre as string) ?? "Admin";

  return (
    <div className="mx-auto max-w-5xl">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-[22px] font-bold tracking-[-0.025em] text-text-0">
          Bienvenido, {nombre}
        </h1>
        <p className="mt-1 text-[13px] text-text-2">
          Panel de administracion de OMLEB
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
          Acciones Rapidas
        </h2>
        <div className="overflow-hidden rounded-[10px] border border-admin-border bg-admin-surface">
          {quickActions.map((action, i) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-3 px-[14px] py-[11px] transition-colors duration-[80ms] hover:bg-admin-surface-hover${i > 0 ? " row-inset-divider" : ""}`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-admin-surface-elevated text-text-2">
                {action.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-text-0">
                  {action.label}
                </span>
                <span className="block text-[12px] text-text-3">
                  {action.description}
                </span>
              </span>
              <span className="ml-auto text-[13px] text-text-3">&rarr;</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div>
        <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
          Actividad Reciente
        </h2>
        <div className="overflow-hidden rounded-[10px] border border-admin-border bg-admin-surface">
          <div className="py-28 text-center">
            <p className="text-[13px] text-text-3">Proximamente</p>
            <p className="mt-1 text-[12px] text-text-3">
              Aqui veras un resumen de la actividad reciente del sistema
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
