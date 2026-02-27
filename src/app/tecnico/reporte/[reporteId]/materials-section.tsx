"use client";

import { useState, useTransition } from "react";
import { saveMaterials } from "@/app/actions/reportes";
import { Button } from "@/components/ui/button";
import type { ReporteMaterial } from "@/types";

interface MaterialRow {
  id: string;
  cantidad: string;
  unidad: string;
  descripcion: string;
}

interface MaterialsSectionProps {
  reporteId: string;
  initialMaterials: ReporteMaterial[];
  isCompleted: boolean;
  onUnsavedChange?: (hasChanges: boolean) => void;
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
  }));
}

export function MaterialsSection({
  reporteId,
  initialMaterials,
  isCompleted,
  onUnsavedChange,
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

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">
          Materiales Utilizados
        </h2>
        <span className="text-sm text-gray-500">
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
            className="rounded-xl border border-gray-200 bg-white p-3 space-y-2"
          >
            {/* Row header with number and remove */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400">
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
                className="w-20 rounded-lg border border-gray-300 px-2.5 py-2 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <input
                type="text"
                list="unidades-comunes"
                placeholder="Unidad (pza, m, kg...)"
                value={row.unidad}
                onChange={(e) => updateRow(row.id, "unidad", e.target.value)}
                disabled={isCompleted}
                className="w-0 flex-1 rounded-lg border border-gray-300 px-2.5 py-2 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            {/* Descripcion on its own line */}
            <input
              type="text"
              placeholder="Descripcion del material"
              value={row.descripcion}
              onChange={(e) => updateRow(row.id, "descripcion", e.target.value)}
              disabled={isCompleted}
              className="w-full rounded-lg border border-gray-300 px-2.5 py-2 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
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
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors active:bg-gray-50"
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
