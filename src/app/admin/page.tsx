import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const quickActions = [
  {
    label: "Crear Cliente",
    href: "/admin/clientes/nuevo",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    description: "Agregar un nuevo cliente al sistema",
  },
  {
    label: "Crear Sucursal",
    href: "/admin/sucursales/nuevo",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
        <h1 className="text-2xl font-bold text-white md:text-3xl">
          Bienvenido, {nombre}
        </h1>
        <p className="mt-1 text-gray-400">
          Panel de administracion de OMLEB
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-gray-300">
          Acciones Rapidas
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-xl border border-admin-border bg-admin-surface p-6 transition-all hover:border-brand-500/50 hover:bg-admin-surface/80 hover:shadow-lg hover:shadow-brand-500/5"
            >
              <div className="mb-4 inline-flex rounded-lg bg-brand-500/10 p-3 text-brand-400 transition-colors group-hover:bg-brand-500/20">
                {action.icon}
              </div>
              <h3 className="text-base font-semibold text-white">
                {action.label}
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-300">
          Actividad Reciente
        </h2>
        <div className="rounded-xl border border-admin-border bg-admin-surface p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-admin-border bg-admin-bg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-400">Proximamente</p>
          <p className="mt-1 text-sm text-gray-500">
            Aqui veras un resumen de la actividad reciente del sistema
          </p>
        </div>
      </div>
    </div>
  );
}
