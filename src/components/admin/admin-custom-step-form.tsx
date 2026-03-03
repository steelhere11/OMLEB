"use client";

import { useState, useTransition } from "react";
import { addCustomStep } from "@/app/actions/workflows";
import type { ReportePaso } from "@/types";

interface AdminCustomStepFormProps {
  reporteEquipoId: string;
  onStepAdded: () => void;
}

export function AdminCustomStepForm({
  reporteEquipoId,
  onStepAdded,
}: AdminCustomStepFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [procedimiento, setProcedimiento] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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

      // Reset form
      setNombre("");
      setProcedimiento("");
      setIsOpen(false);
      onStepAdded();
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
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-[6px] border border-dashed border-admin-border px-3 py-2 text-[12px] font-medium text-text-3 transition-colors duration-[80ms] hover:border-accent hover:text-accent"
      >
        <svg
          className="h-3.5 w-3.5"
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
    <div className="mt-2 rounded-[6px] border border-dashed border-accent/40 bg-admin-surface-raised p-3 space-y-2.5">
      <p className="text-[12px] font-semibold text-text-1">
        Nuevo paso personalizado
      </p>

      {/* Nombre */}
      <div>
        <label className="mb-0.5 block text-[11px] font-medium text-text-2">
          Nombre del paso <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Limpieza de drenaje adicional"
          className="w-full rounded-[6px] border border-admin-border bg-admin-surface px-2.5 py-1.5 text-[12px] text-text-0 placeholder:text-text-3 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          autoFocus
          disabled={isPending}
        />
      </div>

      {/* Procedimiento */}
      <div>
        <label className="mb-0.5 block text-[11px] font-medium text-text-2">
          Descripcion / procedimiento (opcional)
        </label>
        <textarea
          value={procedimiento}
          onChange={(e) => setProcedimiento(e.target.value)}
          placeholder="Describe el procedimiento a seguir..."
          rows={2}
          className="w-full rounded-[6px] border border-admin-border bg-admin-surface px-2.5 py-1.5 text-[12px] text-text-0 placeholder:text-text-3 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          disabled={isPending}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-[11px] text-status-error">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="text-[12px] font-medium text-text-3 transition-colors duration-[80ms] hover:text-text-0 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !nombre.trim()}
          className="rounded-[6px] bg-accent px-3 py-1 text-[12px] font-medium text-white transition-colors duration-[80ms] hover:bg-accent/90 disabled:opacity-50"
        >
          {isPending ? "Agregando..." : "Agregar"}
        </button>
      </div>
    </div>
  );
}
