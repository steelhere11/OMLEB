"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateFolio } from "@/app/actions/folios";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/types/actions";
import type { Folio, Sucursal, Cliente, User, FolioEstatus } from "@/types";

interface EditFolioFormProps {
  folio: Folio;
  branches: Sucursal[];
  clientes: Cliente[];
  users: User[];
  currentAssignmentIds: string[];
}

const statusConfig: Record<
  FolioEstatus,
  { label: string; className: string }
> = {
  abierto: {
    label: "Abierto",
    className: "bg-blue-900/30 text-blue-400",
  },
  en_progreso: {
    label: "En Progreso",
    className: "bg-yellow-900/30 text-yellow-400",
  },
  completado: {
    label: "Completado",
    className: "bg-green-900/30 text-green-400",
  },
  en_espera: {
    label: "En Espera",
    className: "bg-orange-900/30 text-orange-400",
  },
};

export function EditFolioForm({
  folio,
  branches,
  clientes,
  users,
  currentAssignmentIds,
}: EditFolioFormProps) {
  const updateWithId = updateFolio.bind(null, folio.id);
  const [state, formAction, isPending] = useActionState<
    ActionState | null,
    FormData
  >(updateWithId, null);

  const status = statusConfig[folio.estatus] ?? statusConfig.abierto;

  return (
    <div className="min-h-dvh bg-admin-bg px-4 py-8 text-white">
      <div className="mx-auto max-w-lg">
        {/* Back link */}
        <Link
          href="/admin/folios"
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
          Volver a folios
        </Link>

        <h1 className="mb-8 text-2xl font-bold">Editar Folio</h1>

        <div className="rounded-xl border border-admin-border bg-admin-surface p-6">
          {/* Read-only info */}
          <div className="mb-6 flex items-center justify-between rounded-lg border border-admin-border bg-admin-bg px-4 py-3">
            <div>
              <p className="text-xs text-gray-400">Numero de folio</p>
              <p className="text-lg font-bold text-white">
                {folio.numero_folio}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Estatus</p>
              <span
                className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
              >
                {status.label}
              </span>
            </div>
          </div>

          <form action={formAction} className="space-y-5">
            {/* Sucursal */}
            <div>
              <Label
                htmlFor="sucursal_id"
                required
                className="text-gray-300"
              >
                Sucursal
              </Label>
              <Select
                id="sucursal_id"
                name="sucursal_id"
                required
                defaultValue={folio.sucursal_id}
                error={state?.fieldErrors?.sucursal_id?.[0]}
                className="mt-1.5 border-admin-border bg-admin-bg text-white"
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
              <Label
                htmlFor="cliente_id"
                required
                className="text-gray-300"
              >
                Cliente
              </Label>
              <Select
                id="cliente_id"
                name="cliente_id"
                required
                defaultValue={folio.cliente_id}
                error={state?.fieldErrors?.cliente_id?.[0]}
                className="mt-1.5 border-admin-border bg-admin-bg text-white"
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
                className="text-gray-300"
              >
                Descripcion del problema
              </Label>
              <Textarea
                id="descripcion_problema"
                name="descripcion_problema"
                placeholder="Describa el problema reportado..."
                required
                defaultValue={folio.descripcion_problema}
                error={state?.fieldErrors?.descripcion_problema?.[0]}
                className="mt-1.5 border-admin-border bg-admin-bg text-white placeholder:text-gray-500"
              />
            </div>

            {/* User Assignment (Cuadrilla) */}
            <div>
              <Label className="text-gray-300">
                Asignar Equipo (Cuadrilla)
              </Label>
              <p className="mt-0.5 text-xs text-gray-500">
                Seleccione al menos un tecnico o ayudante
              </p>

              {users.length === 0 ? (
                <div className="mt-2 rounded-lg border border-admin-border bg-admin-bg px-4 py-3">
                  <p className="text-sm text-gray-400">
                    No hay tecnicos o ayudantes registrados.{" "}
                    <Link
                      href="/admin/usuarios"
                      className="text-brand-400 hover:text-brand-300"
                    >
                      Crear usuarios
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="mt-2 max-h-60 space-y-2 overflow-y-auto rounded-lg border border-admin-border bg-admin-bg p-3">
                  {users.map((user) => (
                    <label
                      key={user.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-admin-surface"
                    >
                      <input
                        type="checkbox"
                        name="usuarios"
                        value={user.id}
                        defaultChecked={currentAssignmentIds.includes(
                          user.id
                        )}
                        className="h-4 w-4 rounded border-gray-600 bg-admin-bg text-brand-500 focus:ring-brand-400"
                      />
                      <span className="flex-1 text-sm text-white">
                        {user.nombre}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.rol === "tecnico"
                            ? "bg-brand-500/20 text-brand-300"
                            : "bg-gray-700 text-gray-300"
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
