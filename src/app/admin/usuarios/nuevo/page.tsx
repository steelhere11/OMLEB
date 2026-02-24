"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createTechnicianAccount, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NuevoUsuarioPage() {
  const [state, formAction, isPending] = useActionState<AuthState | null, FormData>(
    createTechnicianAccount,
    null
  );

  return (
    <div className="min-h-dvh bg-admin-bg px-4 py-8 text-white">
      <div className="mx-auto max-w-lg">
        {/* Back link */}
        <Link
          href="/admin/usuarios"
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
          Volver a usuarios
        </Link>

        <h1 className="mb-8 text-2xl font-bold">Crear Usuario</h1>

        {/* Success state */}
        {state?.success ? (
          <div className="rounded-xl border border-green-800 bg-green-900/30 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-900/50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-green-300">
              {state.message}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/admin/usuarios/nuevo"
                onClick={() => window.location.reload()}
                className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
              >
                Crear otro usuario
              </Link>
              <Link
                href="/admin/usuarios"
                className="rounded-lg border border-admin-border px-6 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-admin-bg"
              >
                Ver todos los usuarios
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-admin-border bg-admin-surface p-6">
            <form action={formAction} className="space-y-5">
              <div>
                <Label htmlFor="nombre" required className="text-gray-300">
                  Nombre completo
                </Label>
                <Input
                  id="nombre"
                  name="nombre"
                  type="text"
                  placeholder="Juan Perez"
                  required
                  className="mt-1.5 border-admin-border bg-admin-bg text-white placeholder:text-gray-500"
                />
              </div>

              <div>
                <Label htmlFor="email" required className="text-gray-300">
                  Correo electronico
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tecnico@omleb.com"
                  required
                  className="mt-1.5 border-admin-border bg-admin-bg text-white placeholder:text-gray-500"
                />
              </div>

              <div>
                <Label htmlFor="password" required className="text-gray-300">
                  Contrasena
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Minimo 6 caracteres"
                  required
                  minLength={6}
                  className="mt-1.5 border-admin-border bg-admin-bg text-white placeholder:text-gray-500"
                />
              </div>

              <div>
                <Label htmlFor="rol" required className="text-gray-300">
                  Rol
                </Label>
                <select
                  id="rol"
                  name="rol"
                  required
                  className="mt-1.5 block w-full rounded-lg border border-admin-border bg-admin-bg px-3 py-2.5 text-base text-white min-h-[48px] transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1"
                  defaultValue="tecnico"
                >
                  <option value="tecnico">Tecnico</option>
                  <option value="ayudante">Ayudante</option>
                </select>
              </div>

              {/* Error message */}
              {state?.error && (
                <div className="rounded-lg border border-red-800 bg-red-900/30 px-4 py-3">
                  <p className="text-sm text-red-400">{state.error}</p>
                </div>
              )}

              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={isPending}
              >
                Crear Cuenta
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
