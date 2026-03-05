"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  asignarACuadrilla,
  registrarDevolucion,
  registrarAjuste,
} from "@/app/actions/stock";
import type { MaterialCatalogo } from "@/types/inventory";

interface CuadrillaRow {
  id: string;
  nombre: string;
  activa: boolean;
}

interface MovimientoRow {
  id: string;
  catalogo_id: string;
  tipo: string;
  cantidad: number;
  fuente: string | null;
  cuadrilla_id: string | null;
  notas: string | null;
  created_at: string;
  materiales_catalogo: { nombre: string; unidad_default: string } | null;
  cuadrillas: { nombre: string } | null;
}

interface Props {
  initialMovimientos: MovimientoRow[];
  catalogo: MaterialCatalogo[];
  cuadrillas: CuadrillaRow[];
}

type FormMode = "asignacion" | "devolucion" | "ajuste" | null;

const subNav = [
  { label: "Dashboard", href: "/admin/inventario" },
  { label: "Catalogo", href: "/admin/inventario/catalogo" },
  { label: "Entradas", href: "/admin/inventario/entradas" },
  { label: "Movimientos", href: "/admin/inventario/movimientos", active: true },
  { label: "Pendientes", href: "/admin/inventario/pendientes" },
];

const tipoLabels: Record<string, string> = {
  entrada: "Entrada",
  asignacion: "Asignacion",
  uso: "Uso",
  devolucion: "Devolucion",
  ajuste: "Ajuste",
};

const tipoBadge: Record<string, string> = {
  entrada: "bg-status-success/10 text-status-success",
  asignacion: "bg-status-progress/10 text-status-progress",
  uso: "bg-status-error/10 text-status-error",
  devolucion: "bg-status-warning/10 text-status-warning",
  ajuste: "bg-text-1/10 text-text-1",
};

export function MovimientosManager({ initialMovimientos, catalogo, cuadrillas }: Props) {
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [catalogoId, setCatalogoId] = useState("");
  const [cuadrillaId, setCuadrillaId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [notas, setNotas] = useState("");
  const [filterTipo, setFilterTipo] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeCuadrillas = cuadrillas.filter((c) => c.activa);

  const resetForm = () => {
    setFormMode(null);
    setCatalogoId("");
    setCuadrillaId("");
    setCantidad("");
    setNotas("");
    setError(null);
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      let result;
      const qty = parseFloat(cantidad) || 0;

      if (formMode === "asignacion") {
        result = await asignarACuadrilla({
          catalogo_id: catalogoId,
          cuadrilla_id: cuadrillaId,
          cantidad: qty,
          notas: notas || undefined,
        });
      } else if (formMode === "devolucion") {
        result = await registrarDevolucion({
          catalogo_id: catalogoId,
          cuadrilla_id: cuadrillaId,
          cantidad: qty,
          notas: notas || undefined,
        });
      } else if (formMode === "ajuste") {
        result = await registrarAjuste({
          catalogo_id: catalogoId,
          cuadrilla_id: cuadrillaId || undefined,
          cantidad: qty,
          notas: notas || undefined,
        });
      }

      if (result?.error) {
        setError(result.error);
        return;
      }
      window.location.reload();
    });
  };

  const filteredMovimientos = filterTipo === "all"
    ? initialMovimientos
    : initialMovimientos.filter((m) => m.tipo === filterTipo);

  const formTitle: Record<string, string> = {
    asignacion: "Asignar a Cuadrilla",
    devolucion: "Registrar Devolucion",
    ajuste: "Ajuste Manual",
  };

  return (
    <>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-[22px] font-bold tracking-[-0.025em] text-text-0">
          Movimientos
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => { resetForm(); setFormMode("asignacion"); }}
            className="inline-flex items-center gap-1 rounded-[6px] border border-admin-border px-2.5 py-1.5 text-[12px] font-medium text-text-1 transition-colors hover:bg-admin-surface-hover"
          >
            Asignar
          </button>
          <button
            onClick={() => { resetForm(); setFormMode("devolucion"); }}
            className="inline-flex items-center gap-1 rounded-[6px] border border-admin-border px-2.5 py-1.5 text-[12px] font-medium text-text-1 transition-colors hover:bg-admin-surface-hover"
          >
            Devolucion
          </button>
          <button
            onClick={() => { resetForm(); setFormMode("ajuste"); }}
            className="inline-flex items-center gap-1 rounded-[6px] border border-admin-border px-2.5 py-1.5 text-[12px] font-medium text-text-1 transition-colors hover:bg-admin-surface-hover"
          >
            Ajuste
          </button>
        </div>
      </div>

      {/* Sub-nav */}
      <div className="mb-6 flex gap-1 rounded-[8px] border border-admin-border bg-admin-surface p-1">
        {subNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-[6px] px-3 py-1.5 text-[13px] font-medium transition-colors ${
              item.active
                ? "bg-admin-surface-elevated text-text-0"
                : "text-text-2 hover:text-text-1 hover:bg-admin-surface-hover"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Action Form */}
      {formMode && (
        <div className="mb-6 rounded-[10px] border border-admin-border bg-admin-surface p-4 space-y-3">
          <h2 className="text-[15px] font-semibold text-text-0">
            {formTitle[formMode]}
          </h2>

          <div className="grid gap-2 md:grid-cols-2">
            <select
              value={catalogoId}
              onChange={(e) => setCatalogoId(e.target.value)}
              className="rounded-[6px] border border-admin-border bg-admin-bg px-3 py-2 text-[13px] text-text-0 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Seleccionar material...</option>
              {catalogo.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.unidad_default})
                </option>
              ))}
            </select>

            {(formMode === "asignacion" || formMode === "devolucion") && (
              <select
                value={cuadrillaId}
                onChange={(e) => setCuadrillaId(e.target.value)}
                className="rounded-[6px] border border-admin-border bg-admin-bg px-3 py-2 text-[13px] text-text-0 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Seleccionar cuadrilla...</option>
                {activeCuadrillas.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            )}

            {formMode === "ajuste" && (
              <select
                value={cuadrillaId}
                onChange={(e) => setCuadrillaId(e.target.value)}
                className="rounded-[6px] border border-admin-border bg-admin-bg px-3 py-2 text-[13px] text-text-0 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Bodega (sin cuadrilla)</option>
                {activeCuadrillas.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            )}
          </div>

          <input
            type="number"
            placeholder={formMode === "ajuste" ? "Cantidad (negativo para reducir)" : "Cantidad"}
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            step="any"
            className="w-full rounded-[6px] border border-admin-border bg-admin-bg px-3 py-2 text-[13px] text-text-0 placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-accent"
          />

          <input
            type="text"
            placeholder="Notas (opcional)"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="w-full rounded-[6px] border border-admin-border bg-admin-bg px-3 py-2 text-[13px] text-text-0 placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-accent"
          />

          {error && <p className="text-[13px] text-status-error">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={isPending || !catalogoId || !cantidad}
              className="rounded-[6px] bg-accent px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
            >
              {isPending ? "Registrando..." : "Confirmar"}
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

      {/* Filter */}
      <div className="mb-4">
        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="rounded-[6px] border border-admin-border bg-admin-surface px-3 py-2 text-[13px] text-text-0 focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="all">Todos los tipos</option>
          <option value="entrada">Entradas</option>
          <option value="asignacion">Asignaciones</option>
          <option value="uso">Usos</option>
          <option value="devolucion">Devoluciones</option>
          <option value="ajuste">Ajustes</option>
        </select>
      </div>

      {/* Movements table */}
      {filteredMovimientos.length === 0 ? (
        <div className="rounded-[10px] border border-admin-border bg-admin-surface py-28 text-center">
          <p className="text-[13px] text-text-3">No hay movimientos</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-admin-border bg-admin-surface">
          <div className="flex items-center border-b border-admin-border-subtle px-[14px] py-[10px] text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
            <div className="flex-1">Material</div>
            <div className="w-[90px] text-center">Tipo</div>
            <div className="w-[80px] text-right">Cantidad</div>
            <div className="w-[120px] text-center">Cuadrilla</div>
            <div className="w-[100px] text-right">Fecha</div>
          </div>

          {filteredMovimientos.map((m, i) => {
            const mat = m.materiales_catalogo as { nombre: string; unidad_default: string } | null;
            const cuadrilla = m.cuadrillas as { nombre: string } | null;
            return (
              <div
                key={m.id}
                className={`flex items-center px-[14px] py-[9px] transition-colors hover:bg-admin-surface-hover${i > 0 ? " row-inset-divider" : ""}`}
              >
                <div className="flex-1">
                  <span className="text-[13px] font-medium text-text-0">
                    {mat?.nombre ?? "—"}
                  </span>
                  {m.notas && (
                    <p className="text-[12px] text-text-2 mt-0.5 truncate max-w-[200px]">
                      {m.notas}
                    </p>
                  )}
                </div>
                <div className="w-[90px] text-center">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${tipoBadge[m.tipo] ?? "bg-text-1/10 text-text-1"}`}
                  >
                    {tipoLabels[m.tipo] ?? m.tipo}
                  </span>
                </div>
                <div className="w-[80px] text-right text-[13px] text-text-1">
                  {m.tipo === "ajuste" && m.cantidad > 0 ? "+" : ""}
                  {m.cantidad} {mat?.unidad_default ?? ""}
                </div>
                <div className="w-[120px] text-center text-[13px] text-text-2">
                  {cuadrilla?.nombre ?? "—"}
                </div>
                <div className="w-[100px] text-right text-[12px] text-text-2">
                  {new Date(m.created_at).toLocaleDateString("es-MX", {
                    day: "2-digit",
                    month: "short",
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
