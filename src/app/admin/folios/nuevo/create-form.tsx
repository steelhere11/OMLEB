"use client";

import { useActionState, useState, useCallback } from "react";
import Link from "next/link";
import { createFolio } from "@/app/actions/folios";
import { createEquipo } from "@/app/actions/equipos";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { ActionState } from "@/types/actions";
import type { Sucursal, Cliente, User, Equipo, TipoEquipo } from "@/types";

interface CreateFolioFormProps {
  branches: Sucursal[];
  clientes: Cliente[];
  users: User[];
  tiposEquipo: TipoEquipo[];
}

export function CreateFolioForm({
  branches,
  clientes,
  users,
  tiposEquipo,
}: CreateFolioFormProps) {
  const [state, formAction, isPending] = useActionState<
    ActionState | null,
    FormData
  >(createFolio, null);

  const [selectedSucursalId, setSelectedSucursalId] = useState("");
  const [branchEquipment, setBranchEquipment] = useState<Equipo[]>([]);
  const [selectedEquipoIds, setSelectedEquipoIds] = useState<Set<string>>(
    new Set()
  );
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [showNewEquipoForm, setShowNewEquipoForm] = useState(false);
  const [creatingEquipo, setCreatingEquipo] = useState(false);
  const [newEquipoError, setNewEquipoError] = useState<string | null>(null);

  // Fetch equipment when branch changes
  const handleBranchChange = useCallback(
    async (sucursalId: string) => {
      setSelectedSucursalId(sucursalId);
      setSelectedEquipoIds(new Set());
      setBranchEquipment([]);

      if (!sucursalId) return;

      setLoadingEquipment(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("equipos")
        .select("*")
        .eq("sucursal_id", sucursalId)
        .order("numero_etiqueta");
      setBranchEquipment((data as Equipo[] | null) ?? []);
      setLoadingEquipment(false);
    },
    []
  );

  const toggleEquipo = (id: string) => {
    setSelectedEquipoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Create new equipment inline
  const handleCreateEquipo = async (formData: FormData) => {
    setCreatingEquipo(true);
    setNewEquipoError(null);

    const result = await createEquipo(null, formData);

    if (result.error) {
      setNewEquipoError(result.error);
      setCreatingEquipo(false);
      return;
    }

    // Refresh equipment list
    if (selectedSucursalId) {
      const supabase = createClient();
      const { data } = await supabase
        .from("equipos")
        .select("*")
        .eq("sucursal_id", selectedSucursalId)
        .order("numero_etiqueta");
      const refreshed = (data as Equipo[] | null) ?? [];
      setBranchEquipment(refreshed);

      // Auto-select the newly created equipment (last one)
      const newIds = refreshed
        .filter((eq) => !branchEquipment.some((old) => old.id === eq.id))
        .map((eq) => eq.id);
      if (newIds.length > 0) {
        setSelectedEquipoIds((prev) => {
          const next = new Set(prev);
          newIds.forEach((id) => next.add(id));
          return next;
        });
      }
    }

    setShowNewEquipoForm(false);
    setCreatingEquipo(false);
  };

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
              value={selectedSucursalId}
              onChange={(e) => handleBranchChange(e.target.value)}
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

          {/* Equipment Assignment */}
          <div>
            <Label className="text-[13px] text-text-1">
              Equipos del Folio
            </Label>
            <p className="mt-0.5 text-[12px] text-text-3">
              Seleccione los equipos que se trabajaran en este folio
            </p>

            {!selectedSucursalId ? (
              <div className="mt-2 rounded-[6px] border border-admin-border bg-admin-surface-elevated px-4 py-3">
                <p className="text-[13px] text-text-3">
                  Seleccione una sucursal para ver los equipos disponibles
                </p>
              </div>
            ) : loadingEquipment ? (
              <div className="mt-2 rounded-[6px] border border-admin-border bg-admin-surface-elevated px-4 py-3">
                <p className="text-[13px] text-text-3">Cargando equipos...</p>
              </div>
            ) : (
              <>
                {branchEquipment.length === 0 ? (
                  <div className="mt-2 rounded-[6px] border border-admin-border bg-admin-surface-elevated px-4 py-3">
                    <p className="text-[13px] text-text-2">
                      No hay equipos en esta sucursal.
                    </p>
                  </div>
                ) : (
                  <div className="mt-2 max-h-60 space-y-1 overflow-y-auto rounded-[6px] border border-admin-border bg-admin-surface-elevated p-2">
                    {branchEquipment.map((equipo) => (
                      <label
                        key={equipo.id}
                        className="flex cursor-pointer items-center gap-3 rounded-[6px] px-3 py-2 transition-colors duration-[80ms] hover:bg-admin-surface-hover"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEquipoIds.has(equipo.id)}
                          onChange={() => toggleEquipo(equipo.id)}
                          className="h-4 w-4 rounded border-admin-border bg-admin-surface-elevated text-accent focus:ring-accent"
                        />
                        <span className="flex-1 text-[13px] text-text-0">
                          {equipo.numero_etiqueta}
                          {equipo.marca && (
                            <span className="text-text-2">
                              {" "}
                              — {equipo.marca}
                            </span>
                          )}
                          {equipo.modelo && (
                            <span className="text-text-3"> {equipo.modelo}</span>
                          )}
                        </span>
                        {!equipo.revisado && (
                          <span className="inline-flex items-center rounded-full bg-status-warning/10 px-2 py-0.5 text-xs font-medium text-status-warning">
                            Pendiente
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                )}

                {/* Hidden inputs for selected equipment */}
                {Array.from(selectedEquipoIds).map((id) => (
                  <input key={id} type="hidden" name="equipos" value={id} />
                ))}

                {/* Add new equipment inline */}
                {!showNewEquipoForm ? (
                  <button
                    type="button"
                    onClick={() => setShowNewEquipoForm(true)}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-[6px] border border-dashed border-admin-border px-3 py-2 text-[13px] font-medium text-text-2 transition-colors duration-[80ms] hover:bg-admin-surface-hover"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar equipo nuevo
                  </button>
                ) : (
                  <div className="mt-2 rounded-[6px] border border-admin-border bg-admin-surface-elevated p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-medium text-text-0">
                        Nuevo equipo
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewEquipoForm(false);
                          setNewEquipoError(null);
                        }}
                        className="text-[12px] text-text-3 hover:text-text-1"
                      >
                        Cancelar
                      </button>
                    </div>

                    {newEquipoError && (
                      <p className="text-[12px] text-status-error">
                        {newEquipoError}
                      </p>
                    )}

                    {/* Inline form — uses a separate form to avoid nesting */}
                    <div className="space-y-2">
                      <Input
                        id="new-equipo-etiqueta"
                        placeholder="Etiqueta / Numero *"
                        required
                      />
                      <Select id="new-equipo-tipo" className="admin-select">
                        <option value="">Tipo de equipo...</option>
                        {tiposEquipo.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nombre}
                          </option>
                        ))}
                      </Select>
                      <div className="grid grid-cols-2 gap-2">
                        <Input id="new-equipo-marca" placeholder="Marca" />
                        <Input id="new-equipo-modelo" placeholder="Modelo" />
                      </div>
                      <Input
                        id="new-equipo-serie"
                        placeholder="Numero de serie"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        fullWidth
                        loading={creatingEquipo}
                        onClick={() => {
                          const etiqueta = (
                            document.getElementById(
                              "new-equipo-etiqueta"
                            ) as HTMLInputElement
                          )?.value;
                          if (!etiqueta) {
                            setNewEquipoError(
                              "La etiqueta del equipo es requerida"
                            );
                            return;
                          }
                          const tipoSelect = document.getElementById(
                            "new-equipo-tipo"
                          ) as HTMLSelectElement;
                          const selectedTipo = tiposEquipo.find(
                            (t) => t.id === tipoSelect?.value
                          );

                          const fd = new FormData();
                          fd.set("sucursal_id", selectedSucursalId);
                          fd.set("numero_etiqueta", etiqueta);
                          fd.set(
                            "marca",
                            (
                              document.getElementById(
                                "new-equipo-marca"
                              ) as HTMLInputElement
                            )?.value ?? ""
                          );
                          fd.set(
                            "modelo",
                            (
                              document.getElementById(
                                "new-equipo-modelo"
                              ) as HTMLInputElement
                            )?.value ?? ""
                          );
                          fd.set(
                            "numero_serie",
                            (
                              document.getElementById(
                                "new-equipo-serie"
                              ) as HTMLInputElement
                            )?.value ?? ""
                          );
                          fd.set(
                            "tipo_equipo",
                            selectedTipo?.nombre ?? ""
                          );
                          handleCreateEquipo(fd);
                        }}
                      >
                        Crear Equipo
                      </Button>
                    </div>
                  </div>
                )}
              </>
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
