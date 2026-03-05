"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { saveMaterials } from "@/app/actions/reportes";
import { Button } from "@/components/ui/button";
import type { ReporteMaterial } from "@/types";
import type { MaterialCatalogo } from "@/types/inventory";

interface MaterialRow {
  id: string;
  cantidad: string;
  unidad: string;
  descripcion: string;
  catalogo_id: string | null;
}

interface MaterialsSectionProps {
  reporteId: string;
  initialMaterials: ReporteMaterial[];
  isCompleted: boolean;
  onUnsavedChange?: (hasChanges: boolean) => void;
  catalogo?: MaterialCatalogo[];
}

const COMMON_UNITS = [
  "pza",
  "m",
  "kg",
  "lt",
  "rollo",
  "tramo",
  "juego",
  "caja",
  "par",
  "bolsa",
];

function createEmptyRow(): MaterialRow {
  return {
    id: crypto.randomUUID(),
    cantidad: "",
    unidad: "",
    descripcion: "",
    catalogo_id: null,
  };
}

function materialsToRows(materials: ReporteMaterial[]): MaterialRow[] {
  if (materials.length === 0) {
    return [createEmptyRow()];
  }
  return materials.map((m) => ({
    id: crypto.randomUUID(),
    cantidad: String(m.cantidad),
    unidad: m.unidad,
    descripcion: m.descripcion,
    catalogo_id: m.catalogo_id ?? null,
  }));
}

// ── Catalog Autocomplete Input ──────────────────────────────────────────

function CatalogAutocomplete({
  value,
  catalogoId,
  catalogo,
  disabled,
  onSelect,
  onFreeText,
}: {
  value: string;
  catalogoId: string | null;
  catalogo: MaterialCatalogo[];
  disabled: boolean;
  onSelect: (item: MaterialCatalogo) => void;
  onFreeText: (text: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Sync external value
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filtered = catalogo.filter((c) =>
    c.nombre.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={ref} className="relative w-full">
      <input
        type="text"
        placeholder="Buscar material o escribir..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          // If user types, clear catalog selection
          if (catalogoId) {
            onFreeText(e.target.value);
          }
        }}
        onFocus={() => setOpen(true)}
        disabled={disabled}
        className="w-full rounded-input border border-gray-300 px-2.5 py-2 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
      />
      {catalogoId && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
          Catalogo
        </span>
      )}

      {/* Dropdown */}
      {open && !disabled && query.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-input border border-tech-border bg-tech-surface shadow-lg max-h-48 overflow-y-auto">
          {filtered.length > 0 && filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect(item);
                setQuery(item.nombre);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 active:bg-gray-100"
            >
              <span className="font-medium text-tech-text-primary">{item.nombre}</span>
              <span className="text-label text-tech-text-muted">{item.unidad_default}</span>
            </button>
          ))}
          {/* Free-text option */}
          <button
            type="button"
            onClick={() => {
              onFreeText(query);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 border-t border-tech-border-subtle px-3 py-2 text-left text-sm text-tech-text-muted hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Usar &quot;{query}&quot; como texto libre
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

export function MaterialsSection({
  reporteId,
  initialMaterials,
  isCompleted,
  onUnsavedChange,
  catalogo = [],
}: MaterialsSectionProps) {
  const [rows, setRows] = useState<MaterialRow[]>(() =>
    materialsToRows(initialMaterials)
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const nonEmptyCount = rows.filter(
    (r) => r.cantidad || r.unidad || r.descripcion
  ).length;

  const markChanged = () => {
    onUnsavedChange?.(true);
    setSaved(false);
    setError(null);
    setValidationError(null);
  };

  const addRow = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
    markChanged();
  };

  const removeRow = (id: string) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((r) => r.id !== id);
    });
    markChanged();
  };

  const updateRow = (id: string, field: keyof MaterialRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
    markChanged();
  };

  const handleCatalogSelect = (rowId: string, item: MaterialCatalogo) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              descripcion: item.nombre,
              unidad: item.unidad_default,
              catalogo_id: item.id,
            }
          : r
      )
    );
    markChanged();
  };

  const handleFreeText = (rowId: string, text: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? { ...r, descripcion: text, catalogo_id: null }
          : r
      )
    );
    markChanged();
  };

  const handleSave = () => {
    setValidationError(null);
    setError(null);

    // Filter out completely empty rows
    const filledRows = rows.filter(
      (r) => r.cantidad || r.unidad || r.descripcion
    );

    // Validate filled rows
    for (let i = 0; i < filledRows.length; i++) {
      const r = filledRows[i];
      const num = parseFloat(r.cantidad);
      if (!r.cantidad || isNaN(num) || num <= 0) {
        setValidationError(
          `Material ${i + 1}: La cantidad debe ser un numero mayor a 0`
        );
        return;
      }
      if (!r.unidad.trim()) {
        setValidationError(`Material ${i + 1}: La unidad es requerida`);
        return;
      }
      if (!r.descripcion.trim()) {
        setValidationError(`Material ${i + 1}: La descripcion es requerida`);
        return;
      }
    }

    const materialsPayload = filledRows.map((r) => ({
      cantidad: parseFloat(r.cantidad),
      unidad: r.unidad.trim(),
      descripcion: r.descripcion.trim(),
      catalogo_id: r.catalogo_id,
    }));

    startTransition(async () => {
      const result = await saveMaterials(reporteId, materialsPayload);

      if (result.error) {
        setError(result.error);
        return;
      }

      onUnsavedChange?.(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  const hasCatalog = catalogo.length > 0;

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-tech-text-primary">
          Materiales Utilizados
        </h2>
        <span className="text-body text-tech-text-muted">
          {nonEmptyCount} {nonEmptyCount === 1 ? "material" : "materiales"}
        </span>
      </div>

      {/* Common units datalist */}
      <datalist id="unidades-comunes">
        {COMMON_UNITS.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>

      {/* Material rows */}
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="rounded-card border border-tech-border bg-tech-surface p-3 space-y-2"
          >
            {/* Row header with number and remove */}
            <div className="flex items-center justify-between">
              <span className="text-label font-medium text-tech-text-muted">
                Material {index + 1}
              </span>
              {!isCompleted && rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-red-400 transition-colors active:bg-red-50 active:text-red-600"
                  aria-label={`Eliminar material ${index + 1}`}
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Description — catalog autocomplete or plain text */}
            {hasCatalog ? (
              <CatalogAutocomplete
                value={row.descripcion}
                catalogoId={row.catalogo_id}
                catalogo={catalogo}
                disabled={isCompleted}
                onSelect={(item) => handleCatalogSelect(row.id, item)}
                onFreeText={(text) => handleFreeText(row.id, text)}
              />
            ) : (
              <input
                type="text"
                placeholder="Descripcion del material"
                value={row.descripcion}
                onChange={(e) => updateRow(row.id, "descripcion", e.target.value)}
                disabled={isCompleted}
                className="w-full rounded-input border border-gray-300 px-2.5 py-2 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
            )}

            {/* Cantidad + Unidad on same line */}
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                placeholder="Cant."
                value={row.cantidad}
                onChange={(e) => updateRow(row.id, "cantidad", e.target.value)}
                disabled={isCompleted}
                className="w-20 rounded-input border border-gray-300 px-2.5 py-2 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <input
                type="text"
                list="unidades-comunes"
                placeholder="Unidad (pza, m, kg...)"
                value={row.unidad}
                onChange={(e) => updateRow(row.id, "unidad", e.target.value)}
                disabled={isCompleted || !!row.catalogo_id}
                className={`w-0 flex-1 rounded-input border border-gray-300 px-2.5 py-2 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-500 ${
                  row.catalogo_id ? "bg-gray-50 text-gray-500" : ""
                }`}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      {!isCompleted && (
        <div className="space-y-2">
          {/* Add row button */}
          <button
            type="button"
            onClick={addRow}
            className="flex w-full items-center justify-center gap-2 rounded-input border border-dashed border-gray-300 px-3 py-2.5 text-sm font-medium text-tech-text-secondary transition-colors active:bg-gray-50"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Agregar material
          </button>

          {/* Validation error */}
          {validationError && (
            <p className="text-sm text-red-600" role="alert">
              {validationError}
            </p>
          )}

          {/* Server error */}
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {/* Save success */}
          {saved && (
            <p className="text-sm text-green-600 text-center">
              Materiales guardados
            </p>
          )}

          {/* Save button */}
          <Button
            type="button"
            variant="secondary"
            size="md"
            fullWidth
            loading={isPending}
            onClick={handleSave}
          >
            Guardar materiales
          </Button>
        </div>
      )}
    </div>
  );
}
