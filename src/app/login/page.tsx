"use client";

import { useActionState } from "react";
import { login, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TechnicianLoginPage() {
  const [state, formAction, isPending] = useActionState<AuthState | null, FormData>(
    login,
    null
  );

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          {/* Wrench icon as HVAC visual element */}
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-brand-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">OMLEB</h1>
          <p className="mt-1 text-sm text-gray-500">
            Reportes de Mantenimiento HVAC
          </p>
        </div>

        {/* Login Form */}
        <form action={formAction} className="space-y-5">
          <div>
            <Label htmlFor="email" required className="text-gray-700">
              Correo electronico
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="tecnico@omleb.com"
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="password" required className="text-gray-700">
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
              className="mt-1.5"
            />
          </div>

          <Button
            type="submit"
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
