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
    <div className="mx-auto max-w-[480px]">
      {/* Back link */}
      <Link
        href="/admin/clientes"
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
        Volver a clientes
      </Link>

      <h1 className="mb-6 text-[22px] font-bold tracking-[-0.025em] text-text-0">
        Editar Cliente
      </h1>

      <div className="rounded-[10px] border border-admin-border bg-admin-surface p-6">
        <form action={formAction} className="space-y-5">
          <div>
            <Label htmlFor="nombre" required className="text-[13px] text-text-1">
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
              className="mt-1.5 admin-input"
            />
          </div>

          <div>
            <Label htmlFor="logo" className="text-[13px] text-text-1">
              Logo
            </Label>
            {cliente.logo_url && (
              <div className="mt-2 mb-3">
                <p className="mb-1.5 text-[12px] text-text-3">Logo actual:</p>
                <Image
                  src={cliente.logo_url}
                  alt={`Logo de ${cliente.nombre}`}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-[6px] border border-admin-border object-cover"
                />
              </div>
            )}
            <p className="mt-0.5 text-[12px] text-text-3">
              {cliente.logo_url
                ? "Selecciona una imagen para reemplazar el logo actual."
                : "JPG, PNG o WebP. Maximo 2MB."}
            </p>
            <input
              id="logo"
              name="logo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="mt-1.5 block w-full text-[13px] text-text-2 file:mr-4 file:cursor-pointer file:rounded-[6px] file:border file:border-admin-border file:bg-admin-surface file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-text-1 file:transition-colors file:duration-[80ms] hover:file:bg-admin-surface-hover"
            />
          </div>

          {/* Error message */}
          {state?.error && (
            <div className="rounded-[6px] border border-status-error/30 bg-admin-surface px-4 py-3">
              <p className="text-[13px] text-status-error">{state.error}</p>
            </div>
          )}

          <Button type="submit" variant="outline" fullWidth loading={isPending}>
            Guardar Cambios
          </Button>
        </form>
      </div>
    </div>
  );
}
