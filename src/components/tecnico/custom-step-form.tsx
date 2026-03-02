"use client";

import { useState, useTransition } from "react";
import { addCustomStep } from "@/app/actions/workflows";
import type { ReportePaso } from "@/types";

interface CustomStepFormProps {
  reporteEquipoId: string;
  onStepAdded: (step: ReportePaso) => void;
  disabled?: boolean;
}

export function CustomStepForm({
  reporteEquipoId,
  onStepAdded,
  disabled = false,
}: CustomStepFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [procedimiento, setProcedimiento] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (disabled) return null;

  function handleSubmit() {
    if (!nombre.trim()) {
      setError("El nombre del paso es requerido");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await addCustomStep(
        reporteEquipoId,
        nombre.trim(),
        procedimiento.trim() || undefined
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data) {
        onStepAdded(result.data);
      }

      // Reset form
      setNombre("");
      setProcedimiento("");
      setIsOpen(false);
    });
  }

  function handleCancel() {
    setNombre("");
    setProcedimiento("");
    setError(null);
    setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-500 transition-colors active:border-brand-400 active:text-brand-600"
      >
        <svg
          className="h-5 w-5"
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
        Agregar paso personalizado
      </button>
    );
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-brand-300 bg-brand-50/30 p-4 space-y-3">
      <p className="text-sm font-semibold text-gray-800">
        Nuevo paso personalizado
      </p>

      {/* Nombre */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Nombre del paso <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Limpieza de drenaje adicional"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          autoFocus
          disabled={isPending}
        />
      </div>

      {/* Procedimiento */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Descripcion / procedimiento (opcional)
        </label>
        <textarea
          value={procedimiento}
          onChange={(e) => setProcedimiento(e.target.value)}
          placeholder="Describe el procedimiento a seguir..."
          rows={2}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          disabled={isPending}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors active:bg-gray-100 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !nombre.trim()}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors active:bg-brand-600 disabled:opacity-50"
        >
          {isPending ? "Agregando..." : "Agregar"}
        </button>
      </div>
    </div>
  );
}
