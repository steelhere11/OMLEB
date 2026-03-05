"use client";

import { useState, useTransition } from "react";
import {
  createCuadrilla,
  updateCuadrilla,
  deleteCuadrilla,
  addMiembro,
  removeMiembro,
} from "@/app/actions/cuadrillas";

interface CuadrillaRow {
  id: string;
  nombre: string;
  lider_id: string | null;
  activa: boolean;
  cuadrilla_miembros: { id: string; usuario_id: string }[];
}

interface UserRow {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

interface Props {
  initialCuadrillas: CuadrillaRow[];
  availableUsers: UserRow[];
}

export function CuadrillasManager({ initialCuadrillas, availableUsers }: Props) {
  const [cuadrillas, setCuadrillas] = useState(initialCuadrillas);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [liderId, setLiderId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setNombre("");
    setLiderId("");
    setShowForm(false);
    setEditId(null);
    setError(null);
  };

  const handleCreate = () => {
    setError(null);
    startTransition(async () => {
      const result = await createCuadrilla(nombre, liderId || null);
      if (result.error) {
        setError(result.error);
        return;
      }
      // Refresh page data
      window.location.reload();
    });
  };

  const handleUpdate = () => {
    if (!editId) return;
    setError(null);
    startTransition(async () => {
      const result = await updateCuadrilla(editId, {
        nombre,
        lider_id: liderId || null,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      window.location.reload();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Eliminar esta cuadrilla?")) return;
    startTransition(async () => {
      await deleteCuadrilla(id);
      setCuadrillas((prev) => prev.filter((c) => c.id !== id));
    });
  };

  const handleToggleActive = (id: string, activa: boolean) => {
    startTransition(async () => {
      await updateCuadrilla(id, { activa: !activa });
      setCuadrillas((prev) =>
        prev.map((c) => (c.id === id ? { ...c, activa: !activa } : c))
      );
    });
  };

  const handleAddMember = (cuadrillaId: string, usuarioId: string) => {
    startTransition(async () => {
      const result = await addMiembro(cuadrillaId, usuarioId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setCuadrillas((prev) =>
        prev.map((c) =>
          c.id === cuadrillaId
            ? {
                ...c,
                cuadrilla_miembros: [
                  ...c.cuadrilla_miembros,
                  { id: crypto.randomUUID(), usuario_id: usuarioId },
                ],
              }
            : c
        )
      );
    });
  };

  const handleRemoveMember = (cuadrillaId: string, usuarioId: string) => {
    startTransition(async () => {
      await removeMiembro(cuadrillaId, usuarioId);
      setCuadrillas((prev) =>
        prev.map((c) =>
          c.id === cuadrillaId
            ? {
                ...c,
                cuadrilla_miembros: c.cuadrilla_miembros.filter(
                  (m) => m.usuario_id !== usuarioId
                ),
              }
            : c
        )
      );
    });
  };

  const startEdit = (c: CuadrillaRow) => {
    setEditId(c.id);
    setNombre(c.nombre);
    setLiderId(c.lider_id ?? "");
    setShowForm(true);
    setError(null);
  };

  const getUserName = (id: string) =>
    availableUsers.find((u) => u.id === id)?.nombre ?? "—";

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-[-0.025em] text-text-0">
          Cuadrillas
        </h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-[6px] border border-admin-border px-3 py-1.5 text-[13px] font-medium text-text-1 transition-colors duration-[80ms] hover:bg-admin-surface-hover"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva Cuadrilla
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="mb-6 rounded-[10px] border border-admin-border bg-admin-surface p-4 space-y-3">
          <h2 className="text-[15px] font-semibold text-text-0">
            {editId ? "Editar Cuadrilla" : "Nueva Cuadrilla"}
          </h2>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Nombre de la cuadrilla"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-[6px] border border-admin-border bg-admin-bg px-3 py-2 text-[13px] text-text-0 placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <select
              value={liderId}
              onChange={(e) => setLiderId(e.target.value)}
              className="w-full rounded-[6px] border border-admin-border bg-admin-bg px-3 py-2 text-[13px] text-text-0 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Sin lider asignado</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} ({u.rol})
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-[13px] text-status-error">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={editId ? handleUpdate : handleCreate}
              disabled={isPending || !nombre.trim()}
              className="rounded-[6px] bg-accent px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
            >
              {isPending ? "Guardando..." : editId ? "Guardar" : "Crear"}
            </button>
            <button
              onClick={resetForm}
              className="rounded-[6px] border border-admin-border px-3 py-1.5 text-[13px] font-medium text-text-1 transition-colors hover:bg-admin-surface-hover"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Cuadrillas List */}
      {cuadrillas.length === 0 ? (
        <div className="rounded-[10px] border border-admin-border bg-admin-surface py-28 text-center">
          <p className="text-[13px] text-text-3">No hay cuadrillas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cuadrillas.map((c) => {
            const isExpanded = expandedId === c.id;
            const memberIds = c.cuadrilla_miembros.map((m) => m.usuario_id);
            const nonMembers = availableUsers.filter(
              (u) => !memberIds.includes(u.id)
            );

            return (
              <div
                key={c.id}
                className="overflow-hidden rounded-[10px] border border-admin-border bg-admin-surface"
              >
                {/* Cuadrilla header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : c.id)
                    }
                    className="text-text-2 transition-transform"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-text-0">
                        {c.nombre}
                      </span>
                      {!c.activa && (
                        <span className="rounded-full bg-text-2/10 px-2 py-0.5 text-[11px] font-medium text-text-2">
                          Inactiva
                        </span>
                      )}
                    </div>
                    <span className="text-[12px] text-text-2">
                      {c.cuadrilla_miembros.length} miembro{c.cuadrilla_miembros.length !== 1 ? "s" : ""}
                      {c.lider_id && ` · Lider: ${getUserName(c.lider_id)}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(c)}
                      className="rounded-[5px] p-1.5 text-text-2 transition-colors hover:bg-admin-surface-hover hover:text-text-0"
                      title="Editar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleToggleActive(c.id, c.activa)}
                      className="rounded-[5px] p-1.5 text-text-2 transition-colors hover:bg-admin-surface-hover hover:text-text-0"
                      title={c.activa ? "Desactivar" : "Activar"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        {c.activa ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        )}
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="rounded-[5px] p-1.5 text-text-2 transition-colors hover:bg-status-error/10 hover:text-status-error"
                      title="Eliminar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded members section */}
                {isExpanded && (
                  <div className="border-t border-admin-border-subtle px-4 py-3">
                    <h3 className="mb-2 text-[12px] font-medium uppercase tracking-[0.04em] text-text-2">
                      Miembros
                    </h3>

                    {/* Current members */}
                    {memberIds.length === 0 ? (
                      <p className="text-[13px] text-text-3 mb-2">Sin miembros</p>
                    ) : (
                      <div className="mb-3 space-y-1">
                        {memberIds.map((uid) => {
                          const u = availableUsers.find((x) => x.id === uid);
                          return (
                            <div
                              key={uid}
                              className="flex items-center justify-between rounded-[5px] px-2 py-1.5 hover:bg-admin-surface-hover"
                            >
                              <span className="text-[13px] text-text-0">
                                {u?.nombre ?? uid}
                                <span className="ml-1.5 text-text-2">
                                  ({u?.rol ?? "?"})
                                </span>
                              </span>
                              <button
                                onClick={() => handleRemoveMember(c.id, uid)}
                                disabled={isPending}
                                className="text-[12px] text-status-error transition-colors hover:text-status-error/80"
                              >
                                Remover
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add member */}
                    {nonMembers.length > 0 && (
                      <div className="flex items-center gap-2">
                        <select
                          id={`add-member-${c.id}`}
                          className="flex-1 rounded-[6px] border border-admin-border bg-admin-bg px-2 py-1.5 text-[13px] text-text-0 focus:outline-none focus:ring-2 focus:ring-accent"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Agregar miembro...
                          </option>
                          {nonMembers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.nombre} ({u.rol})
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            const select = document.getElementById(
                              `add-member-${c.id}`
                            ) as HTMLSelectElement;
                            if (select?.value) {
                              handleAddMember(c.id, select.value);
                              select.value = "";
                            }
                          }}
                          disabled={isPending}
                          className="rounded-[6px] bg-accent px-2.5 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
                        >
                          Agregar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
