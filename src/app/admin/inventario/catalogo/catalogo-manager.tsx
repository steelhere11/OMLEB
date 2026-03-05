"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  createMaterial,
  updateMaterial,
  toggleActivoMaterial,
} from "@/app/actions/catalogo";
import type { MaterialCatalogo, MaterialCategoria } from "@/types/inventory";

interface Props {
  initialCatalogo: MaterialCatalogo[];
}

const UNIDADES = ["kg", "pza", "lt", "m", "rollo", "tramo", "juego", "caja"];

const subNav = [
  { label: "Dashboard", href: "/admin/inventario" },
  { label: "Catalogo", href: "/admin/inventario/catalogo", active: true },
  { label: "Entradas", href: "/admin/inventario/entradas" },
  { label: "Movimientos", href: "/admin/inventario/movimientos" },
  { label: "Pendientes", href: "/admin/inventario/pendientes" },
];

export function CatalogoManager({ initialCatalogo }: Props) {
  const [items, setItems] = useState(initialCatalogo);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");

  // Form state
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<MaterialCategoria>("consumible");
  const [unidadDefault, setUnidadDefault] = useState("pza");
  const [stockMinimo, setStockMinimo] = useState("0");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setNombre("");
    setCategoria("consumible");
    setUnidadDefault("pza");
    setStockMinimo("0");
    setNotas("");
    setShowForm(false);
    setEditId(null);
    setError(null);
  };

  const handleCreate = () => {
    setError(null);
    startTransition(async () => {
      const result = await createMaterial(
        nombre,
        categoria,
        unidadDefault,
        parseFloat(stockMinimo) || 0,
        notas || undefined
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      window.location.reload();
    });
  };

  const handleUpdate = () => {
    if (!editId) return;
    setError(null);
    startTransition(async () => {
      const result = await updateMaterial(editId, {
        nombre,
        categoria,
        unidad_default: unidadDefault,
        stock_minimo: parseFloat(stockMinimo) || 0,
        notas: notas || null,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      window.location.reload();
    });
  };

  const handleToggle = (id: string, activo: boolean) => {
    startTransition(async () => {
      await toggleActivoMaterial(id, !activo);
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, activo: !activo } : i))
      );
    });
  };

  const startEdit = (item: MaterialCatalogo) => {
    setEditId(item.id);
    setNombre(item.nombre);
    setCategoria(item.categoria);
    setUnidadDefault(item.unidad_default);
    setStockMinimo(String(item.stock_minimo));
    setNotas(item.notas ?? "");
    setShowForm(true);
    setError(null);
  };

  // Filtering
  const filtered = items.filter((i) => {
    if (filterCat !== "all" && i.categoria !== filterCat) return false;
    if (search && !i.nombre.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const consumibles = filtered.filter((i) => i.categoria === "consumible");
  const componentes = filtered.filter((i) => i.categoria === "componente");

  return (
    <>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-[-0.025em] text-text-0">
          Catalogo de Materiales
        </h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-[6px] border border-admin-border px-3 py-1.5 text-[13px] font-medium text-text-1 transition-colors hover:bg-admin-surface-hover"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Material
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

      {/* Create/Edit Form */}
      {showForm && (
        <div className="mb-6 rounded-[10px] border border-admin-border bg-admin-surface p-4 space-y-3">
          <h2 className="text-[15px] font-semibold text-text-0">
            {editId ? "Editar Material" : "Nuevo Material"}
          </h2>
          <div className="grid gap-2 md:grid-cols-2">
            <input
              type="text"
              placeholder="Nombre del material"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="rounded-[6px] border border-admin-border bg-admin-bg px-3 py-2 text-[13px] text-text-0 placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as MaterialCategoria)}
              className="rounded-[6px] border border-admin-border bg-admin-bg px-3 py-2 text-[13px] text-text-0 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="consumible">Consumible</option>
              <option value="componente">Componente</option>
            </select>
            <select
              value={unidadDefault}
              onChange={(e) => setUnidadDefault(e.target.value)}
              className="rounded-[6px] border border-admin-border bg-admin-bg px-3 py-2 text-[13px] text-text-0 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {UNIDADES.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Stock minimo"
              value={stockMinimo}
              onChange={(e) => setStockMinimo(e.target.value)}
              min="0"
              className="rounded-[6px] border border-admin-border bg-admin-bg px-3 py-2 text-[13px] text-text-0 placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
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

      {/* Search + Filters */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Buscar material..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-[6px] border border-admin-border bg-admin-surface px-3 py-2 text-[13px] text-text-0 placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="rounded-[6px] border border-admin-border bg-admin-surface px-3 py-2 text-[13px] text-text-0 focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="all">Todos</option>
          <option value="consumible">Consumibles</option>
          <option value="componente">Componentes</option>
        </select>
      </div>

      {/* Materials list grouped by category */}
      {[
        { label: "Consumibles", items: consumibles },
        { label: "Componentes", items: componentes },
      ]
        .filter((g) => g.items.length > 0)
        .map((group) => (
          <div key={group.label} className="mb-6">
            <h3 className="mb-2 text-[12px] font-medium uppercase tracking-[0.04em] text-text-2">
              {group.label} ({group.items.length})
            </h3>
            <div className="overflow-hidden rounded-[10px] border border-admin-border bg-admin-surface">
              {group.items.map((item, i) => (
                <div
                  key={item.id}
                  className={`flex items-center px-[14px] py-[9px] transition-colors hover:bg-admin-surface-hover${i > 0 ? " row-inset-divider" : ""}${!item.activo ? " opacity-50" : ""}`}
                >
                  <div className="flex-1">
                    <span className="text-[13px] font-medium text-text-0">
                      {item.nombre}
                    </span>
                    {!item.activo && (
                      <span className="ml-1.5 rounded-full bg-text-2/10 px-1.5 py-0.5 text-[10px] font-medium text-text-2">
                        Inactivo
                      </span>
                    )}
                    {item.notas && (
                      <p className="text-[12px] text-text-2 mt-0.5">{item.notas}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[12px] text-text-2">
                    <span>{item.unidad_default}</span>
                    <span>Min: {item.stock_minimo}</span>
                    <button
                      onClick={() => startEdit(item)}
                      className="rounded-[5px] p-1 text-text-2 transition-colors hover:bg-admin-surface-hover hover:text-text-0"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleToggle(item.id, item.activo)}
                      disabled={isPending}
                      className="rounded-[5px] p-1 text-text-2 transition-colors hover:bg-admin-surface-hover hover:text-text-0"
                      title={item.activo ? "Desactivar" : "Activar"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        {item.activo ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

      {filtered.length === 0 && (
        <div className="rounded-[10px] border border-admin-border bg-admin-surface py-28 text-center">
          <p className="text-[13px] text-text-3">
            {search ? "No se encontraron materiales" : "No hay materiales en el catalogo"}
          </p>
        </div>
      )}
    </>
  );
}
