"use client";

import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { updateCliente } from "@/app/actions/clientes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/types/actions";
import type { Cliente } from "@/types";

interface EditClienteFormProps {
  cliente: Cliente;
}

export function EditClienteForm({ cliente }: EditClienteFormProps) {
  const updateWithId = updateCliente.bind(null, cliente.id);
  const [state, formAction, isPending] = useActionState<
    ActionState | null,
    FormData
  >(updateWithId, null);

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

        <h1 className="mb-8 text-2xl font-bold">Editar Cliente</h1>

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
                defaultValue={cliente.nombre}
                error={state?.fieldErrors?.nombre?.[0]}
                className="mt-1.5 border-admin-border bg-admin-bg text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <Label htmlFor="logo" className="text-gray-300">
                Logo
              </Label>
              {cliente.logo_url && (
                <div className="mt-2 mb-3">
                  <p className="mb-1.5 text-xs text-gray-500">Logo actual:</p>
                  <Image
                    src={cliente.logo_url}
                    alt={`Logo de ${cliente.nombre}`}
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-lg border border-admin-border object-cover"
                  />
                </div>
              )}
              <p className="mt-0.5 text-xs text-gray-500">
                {cliente.logo_url
                  ? "Selecciona una imagen para reemplazar el logo actual."
                  : "JPG, PNG o WebP. Maximo 2MB."}
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
              Guardar Cambios
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
