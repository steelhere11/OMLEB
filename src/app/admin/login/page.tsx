"use client";

import { useActionState } from "react";
import { login, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState<AuthState | null, FormData>(
    login,
    null
  );

  return (
    <div className="flex min-h-dvh items-center justify-center bg-admin-bg px-4 py-8">
      <div className="w-full max-w-sm rounded-[10px] border border-admin-border bg-admin-surface p-8">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-admin-surface-elevated">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-text-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-[22px] font-bold tracking-[-0.025em] text-text-0">OMLEB</h1>
          <p className="mt-1 text-[13px] text-text-2">
            Panel de Administracion
          </p>
        </div>

        {/* Login Form */}
        <form action={formAction} className="space-y-5">
          <div>
            <Label htmlFor="email" required className="text-[13px] text-text-1">
              Correo electronico
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="admin@omleb.com"
              required
              className="admin-input mt-1.5"
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
              autoComplete="current-password"
              placeholder="••••••••"
              required
              error={state?.error}
              className="admin-input mt-1.5"
            />
          </div>

          <Button
            type="submit"
            variant="outline"
            fullWidth
            size="lg"
            loading={isPending}
          >
            Iniciar Sesion
          </Button>
        </form>
      </div>
    </div>
  );
}
