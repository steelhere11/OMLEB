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
    <div className="mx-auto max-w-[480px]">
      {/* Back link */}
      <Link
        href="/admin/usuarios"
        className="mb-6 inline-flex items-center gap-1 text-[13px] text-text-2 transition-colors duration-[80ms] hover:text-text-1"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5"
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

      <h1 className="mb-6 text-[22px] font-bold tracking-[-0.025em] text-text-0">
        Crear Usuario
      </h1>

      {/* Success state */}
      {state?.success ? (
        <div className="rounded-[10px] border border-status-success/30 bg-admin-surface p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-status-success/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-status-success"
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
          <p className="text-[15px] font-medium text-status-success">
            {state.message}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/admin/usuarios/nuevo"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-[6px] border border-admin-border px-4 py-2 text-[13px] font-medium text-text-1 transition-colors duration-[80ms] hover:bg-admin-surface-hover"
            >
              Crear otro usuario
            </Link>
            <Link
              href="/admin/usuarios"
              className="inline-flex items-center justify-center rounded-[6px] px-4 py-2 text-[13px] font-medium text-text-2 transition-colors duration-[80ms] hover:text-text-1"
            >
              Ver todos los usuarios
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-[10px] border border-admin-border bg-admin-surface p-6">
          <form action={formAction} className="space-y-5">
            <div>
              <Label htmlFor="nombre" required className="text-[13px] text-text-1">
                Nombre completo
              </Label>
              <Input
                id="nombre"
                name="nombre"
                type="text"
                placeholder="Juan Perez"
                required
                className="mt-1.5 admin-input"
              />
            </div>

            <div>
              <Label htmlFor="email" required className="text-[13px] text-text-1">
                Correo electronico
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tecnico@omleb.com"
                required
                className="mt-1.5 admin-input"
              />
            </div>

            <div>
              <Label htmlFor="password" required className="text-[13px] text-text-1">
                Contrasena
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Minimo 6 caracteres"
                required
                minLength={6}
                className="mt-1.5 admin-input"
              />
            </div>

            <div>
              <Label htmlFor="rol" required className="text-[13px] text-text-1">
                Rol
              </Label>
              <select
                id="rol"
                name="rol"
                required
                className="admin-select mt-1.5 block w-full rounded-[6px] border border-admin-border bg-admin-surface-elevated px-3 py-2 text-[13px] text-text-0 transition-colors focus:outline-none"
                defaultValue="tecnico"
              >
                <option value="tecnico">Tecnico</option>
                <option value="ayudante">Ayudante</option>
              </select>
            </div>

            {/* Error message */}
            {state?.error && (
              <div className="rounded-[6px] border border-status-error/30 bg-admin-surface px-4 py-3">
                <p className="text-[13px] text-status-error">{state.error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="outline"
              fullWidth
              loading={isPending}
            >
              Crear Cuenta
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
