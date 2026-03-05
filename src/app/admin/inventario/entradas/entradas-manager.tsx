"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { registrarEntrada } from "@/app/actions/stock";
import type { MaterialCatalogo, StockFuente } from "@/types/inventory";

interface MovimientoRow {
  id: string;
  catalogo_id: string;
  cantidad: number;
  fuente: string | null;
  contratista_nombre: string | null;
  costo_unitario: number | null;
  costo_total: number | null;
  numero_factura: string | null;
  notas: string | null;
  created_at: string;
  materiales_catalogo: { nombre: string; unidad_default: string } | null;
}

interface Props {
  initialEntradas: MovimientoRow[];
  catalogo: MaterialCatalogo[];
}

const subNav = [
  { label: "Dashboard", href: "/admin/inventario" },
  { label: "Catalogo", href: "/admin/inventario/catalogo" },
  { label: "Entradas", href: "/admin/inventario/entradas", active: true },
  { label: "Movimientos", href: "/admin/inventario/movimientos" },
  { label: "Pendientes", href: "/admin/inventario/pendientes" },
];

export function EntradasManager({ initialEntradas, catalogo }: Props) {
  const [entradas, setEntradas] = useState(initialEntradas);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [catalogoId, setCatalogoId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [fuente, setFuente] = useState<StockFuente>("empresa");
  const [contratistaNombre, setContratistaNombre] = useState("");
  const [costoUnitario, setCostoUnitario] = useState("");
  const [costoTotal, setCostoTotal] = useState("");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setCatalogoId("");
    setCantidad("");
    setFuente("empresa");
    setContratistaNombre("");
    setCostoUnitario("");
    setCostoTotal("");
    setNumeroFactura("");
    setNotas("");
    setShowForm(false);
    setError(null);
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await registrarEntrada({
        catalogo_id: catalogoId,
        cantidad: parseFloat(cantidad) || 0,
        fuente,
        contratista_nombre: fuente === "contratista" ? contratistaNombre : undefined,
        costo_unitario: fuente === "empresa" && costoUnitario ? parseFloat(costoUnitario) : undefined,
        costo_total: fuente === "empresa" && costoTotal ? parseFloat(costoTotal) : undefined,
        numero_factura: numeroFactura || undefined,
        notas: notas || undefined,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      window.location.reload();
    });
  };

  const selectedMaterial = catalogo.find((c) => c.id === catalogoId);

  // Auto-calc costo_total when costo_unitario changes
  const handleCostoUnitarioChange = (val: string) => {
    setCostoUnitario(val);
    const unitCost = parseFloat(val);
    const qty = parseFloat(cantidad);
    if (!isNaN(unitCost) && !isNaN(qty)) {
      setCostoTotal((unitCost * qty).toFixed(2));
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-[-0.025em] text-text-0">
          Entradas de Material
        </h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-1.5 rounded-[6px] border border-admin-border px-3 py-1.5 text-[13px] font-medium text-text-1 transition-colors hover:bg-admin-surface-hover"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Registrar Entrada
        </button>
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

      {/* Entry Form */}
      {showForm && (
        <div className="mb-6 rounded-[10px] border border-admin-border bg-admin-surface p-4 space-y-3">
          <h2 className="text-[15px] font-semibold text-text-0">Registrar Entrada</h2>

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

            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Cantidad"
                value={cantidad}
                onChange={(e) => {
                  setCantidad(e.target.value);
                  if (costoUnitario) {
                    const total = parseFloat(e.target.value) * parseFloat(costoUnitario);
                    if (!isNaN(total)) setCostoTotal(total.toFixed(2));
                  }
                }}
                min="0"
                step="any"
                className="flex-1 rounded-[6px] border border-admin-border bg-admin-bg px-3 py-2 text-[13px] text-text-0 placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              {selectedMaterial && (
                <span className="flex items-center text-[13px] text-text-2 px-2">
                  {selectedMaterial.unidad_default}
                </span>
              )}
            </div>
          </div>

          {/* Source */}
          <div className="flex gap-3">
            <label className="flex items-center gap-1.5 text-[13px] text-text-1">
              <input
                type="radio"
                name="fuente"
                value="empresa"
                checked={fuente === "empresa"}
                onChange={() => setFuente("empresa")}
                className="accent-accent"
              />
              Empresa
            </label>
            <label className="flex items-center gap-1.5 text-[13px] text-text-1">
              <input
                type="radio"
                name="fuente"
                value="contratista"
                checked={fuente === "contratista"}
                onChange={() => setFuente("contratista")}
                className="accent-accent"
              />
              Contratista
            </label>
          </div>

          {fuente === "contratista" && (
            <input
              type="text"
              placeholder="Nombre del contratista"
              value={contratistaNombre}
              onChange={(e) => setContratistaNombre(e.target.value)}
              className="w-full rounded-[6px] border border-admin-border bg-admin-bg px-3 py-2 text-[13px] text-text-0 placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          )}

          {fuente === "empresa" && (
            <div className="grid gap-2 md:grid-cols-3">
              <input
                type="number"
                placeholder="Costo unitario"
                value={costoUnitario}
                onChange={(e) => handleCostoUnitarioChange(e.target.value)}
                min="0"
                step="0.01"
                className="rounded-[6px] border border-admin-border bg-admin-bg px-3 py-2 text-[13px] text-text-0 placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                type="number"
                placeholder="Costo total"
                value={costoTotal}
                onChange={(e) => setCostoTotal(e.target.value)}
                min="0"
                step="0.01"
                className="rounded-[6px] border border-admin-border bg-admin-bg px-3 py-2 text-[13px] text-text-0 placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                type="text"
                placeholder="# Factura (opcional)"
                value={numeroFactura}
                onChange={(e) => setNumeroFactura(e.target.value)}
                className="rounded-[6px] border border-admin-border bg-admin-bg px-3 py-2 text-[13px] text-text-0 placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          )}

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
              {isPending ? "Registrando..." : "Registrar"}
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

      {/* Entry history */}
      {entradas.length === 0 ? (
        <div className="rounded-[10px] border border-admin-border bg-admin-surface py-28 text-center">
          <p className="text-[13px] text-text-3">No hay entradas registradas</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-admin-border bg-admin-surface">
          <div className="flex items-center border-b border-admin-border-subtle px-[14px] py-[10px] text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
            <div className="flex-1">Material</div>
            <div className="w-[80px] text-right">Cantidad</div>
            <div className="w-[90px] text-center">Fuente</div>
            <div className="w-[90px] text-right">Costo</div>
            <div className="w-[100px] text-right">Fecha</div>
          </div>

          {entradas.map((e, i) => {
            const mat = e.materiales_catalogo as { nombre: string; unidad_default: string } | null;
            return (
              <div
                key={e.id}
                className={`flex items-center px-[14px] py-[9px] transition-colors hover:bg-admin-surface-hover${i > 0 ? " row-inset-divider" : ""}`}
              >
                <div className="flex-1">
                  <span className="text-[13px] font-medium text-text-0">
                    {mat?.nombre ?? "—"}
                  </span>
                  {e.contratista_nombre && (
                    <span className="ml-1.5 text-[12px] text-text-2">
                      ({e.contratista_nombre})
                    </span>
                  )}
                  {e.numero_factura && (
                    <span className="ml-1 text-[12px] text-text-3">
                      #{e.numero_factura}
                    </span>
                  )}
                </div>
                <div className="w-[80px] text-right text-[13px] text-text-1">
                  {e.cantidad} {mat?.unidad_default ?? ""}
                </div>
                <div className="w-[90px] text-center">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      e.fuente === "empresa"
                        ? "bg-status-progress/10 text-status-progress"
                        : "bg-status-warning/10 text-status-warning"
                    }`}
                  >
                    {e.fuente === "empresa" ? "Empresa" : "Contratista"}
                  </span>
                </div>
                <div className="w-[90px] text-right text-[13px] text-text-2">
                  {e.costo_total
                    ? `$${Number(e.costo_total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
                    : "—"}
                </div>
                <div className="w-[100px] text-right text-[12px] text-text-2">
                  {new Date(e.created_at).toLocaleDateString("es-MX", {
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
