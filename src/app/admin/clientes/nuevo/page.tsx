"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createCliente } from "@/app/actions/clientes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/types/actions";

export default function NuevoClientePage() {
  const [state, formAction, isPending] = useActionState<
    ActionState | null,
    FormData
  >(createCliente, null);

  return (
    <div className="min-h-dvh bg-admin-bg px-4 py-8 text-white">
      <div className="mx-auto max-w-lg">
        {/* Back link */}
        <Link
          href="/admin/clientes"
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
          Volver a clientes
        </Link>

        <h1 className="mb-8 text-2xl font-bold">Crear Cliente</h1>

        <div className="rounded-xl border border-admin-border bg-admin-surface p-6">
          <form action={formAction} className="space-y-5">
            <div>
              <Label htmlFor="nombre" required className="text-gray-300">
                Nombre
              </Label>
              <Input
                id="nombre"
                name="nombre"
                type="text"
                placeholder="Nombre del cliente"
                required
                error={state?.fieldErrors?.nombre?.[0]}
                className="mt-1.5 border-admin-border bg-admin-bg text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <Label htmlFor="logo" className="text-gray-300">
                Logo
              </Label>
              <p className="mt-0.5 text-xs text-gray-500">
                JPG, PNG o WebP. Maximo 2MB.
              </p>
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="mt-1.5 block w-full text-sm text-gray-400 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-600 file:cursor-pointer file:transition-colors"
              />
            </div>

            {/* Error message */}
            {state?.error && (
              <div className="rounded-lg border border-red-800 bg-red-900/30 px-4 py-3">
                <p className="text-sm text-red-400">{state.error}</p>
              </div>
            )}

            <Button type="submit" fullWidth size="lg" loading={isPending}>
              Crear Cliente
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
