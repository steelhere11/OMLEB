"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createFolio } from "@/app/actions/folios";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/types/actions";
import type { Sucursal, Cliente, User } from "@/types";

interface CreateFolioFormProps {
  branches: Sucursal[];
  clientes: Cliente[];
  users: User[];
}

export function CreateFolioForm({
  branches,
  clientes,
  users,
}: CreateFolioFormProps) {
  const [state, formAction, isPending] = useActionState<
    ActionState | null,
    FormData
  >(createFolio, null);

  return (
    <div className="mx-auto max-w-[480px]">
      {/* Back link */}
      <Link
        href="/admin/folios"
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
        Volver a folios
      </Link>

      <h1 className="mb-6 text-[22px] font-bold tracking-[-0.025em] text-text-0">
        Crear Folio
      </h1>

      <div className="rounded-[10px] border border-admin-border bg-admin-surface p-6">
        <form action={formAction} className="space-y-5">
          {/* Sucursal */}
          <div>
            <Label htmlFor="sucursal_id" required className="text-[13px] text-text-1">
              Sucursal
            </Label>
            <Select
              id="sucursal_id"
              name="sucursal_id"
              required
              error={state?.fieldErrors?.sucursal_id?.[0]}
              className="mt-1.5 admin-select"
            >
              <option value="">Seleccionar sucursal...</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.nombre} ({branch.numero})
                </option>
              ))}
            </Select>
          </div>

          {/* Cliente */}
          <div>
            <Label htmlFor="cliente_id" required className="text-[13px] text-text-1">
              Cliente
            </Label>
            <Select
              id="cliente_id"
              name="cliente_id"
              required
              error={state?.fieldErrors?.cliente_id?.[0]}
              className="mt-1.5 admin-select"
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre}
                </option>
              ))}
            </Select>
          </div>

          {/* Descripcion del problema */}
          <div>
            <Label
              htmlFor="descripcion_problema"
              required
              className="text-[13px] text-text-1"
            >
              Descripcion del problema
            </Label>
            <Textarea
              id="descripcion_problema"
              name="descripcion_problema"
              placeholder="Describa el problema reportado..."
              required
              error={state?.fieldErrors?.descripcion_problema?.[0]}
              className="mt-1.5 admin-textarea"
            />
          </div>

          {/* User Assignment (Cuadrilla) */}
          <div>
            <Label className="text-[13px] text-text-1">
              Asignar Equipo (Cuadrilla)
            </Label>
            <p className="mt-0.5 text-[12px] text-text-3">
              Seleccione al menos un tecnico o ayudante
            </p>

            {users.length === 0 ? (
              <div className="mt-2 rounded-[6px] border border-admin-border bg-admin-surface-elevated px-4 py-3">
                <p className="text-[13px] text-text-2">
                  No hay tecnicos o ayudantes registrados.{" "}
                  <Link
                    href="/admin/usuarios"
                    className="text-accent transition-colors duration-[80ms] hover:text-text-0"
                  >
                    Crear usuarios →
                  </Link>
                </p>
              </div>
            ) : (
              <div className="mt-2 max-h-60 space-y-1 overflow-y-auto rounded-[6px] border border-admin-border bg-admin-surface-elevated p-2">
                {users.map((user) => (
                  <label
                    key={user.id}
                    className="flex cursor-pointer items-center gap-3 rounded-[6px] px-3 py-2 transition-colors duration-[80ms] hover:bg-admin-surface-hover"
                  >
                    <input
                      type="checkbox"
                      name="usuarios"
                      value={user.id}
                      className="h-4 w-4 rounded border-admin-border bg-admin-surface-elevated text-accent focus:ring-accent"
                    />
                    <span className="flex-1 text-[13px] text-text-0">
                      {user.nombre}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.rol === "tecnico"
                          ? "bg-status-progress/10 text-status-progress"
                          : "bg-text-3/10 text-text-2"
                      }`}
                    >
                      {user.rol === "tecnico" ? "Tecnico" : "Ayudante"}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Error message */}
          {state?.error && (
            <div className="rounded-[6px] border border-status-error/30 bg-admin-surface px-4 py-3">
              <p className="text-[13px] text-status-error">{state.error}</p>
            </div>
          )}

          <Button type="submit" variant="outline" fullWidth loading={isPending}>
            Crear Folio
          </Button>
        </form>
      </div>
    </div>
  );
}
