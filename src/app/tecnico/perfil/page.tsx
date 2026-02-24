import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/tecnico/logout-button";

export default async function TecnicoPerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const nombre = (user?.user_metadata?.nombre as string) ?? "Usuario";
  const email = user?.email ?? "";
  const rolRaw = (user?.app_metadata?.rol as string) ?? "tecnico";

  const rolLabels: Record<string, string> = {
    admin: "Administrador",
    tecnico: "Tecnico",
    ayudante: "Ayudante",
  };

  const rolLabel = rolLabels[rolRaw] ?? rolRaw;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-xl font-bold text-gray-900">Mi Perfil</h1>

      {/* Profile Card */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* Avatar */}
        <div className="mb-5 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-brand-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        </div>

        {/* Info rows */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Nombre
            </p>
            <p className="mt-0.5 text-base font-medium text-gray-900">
              {nombre}
            </p>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Correo electronico
            </p>
            <p className="mt-0.5 text-base text-gray-700">{email}</p>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Rol
            </p>
            <p className="mt-0.5">
              <span className="inline-flex rounded-full bg-brand-100 px-3 py-0.5 text-sm font-medium text-brand-700">
                {rolLabel}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Logout */}
      <LogoutButton />
    </div>
  );
}
