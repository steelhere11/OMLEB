"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminCreateReport } from "@/app/actions/admin-create-report";

interface CreateReportButtonProps {
  ordenServicioId: string;
}

export function CreateReportButton({ ordenServicioId }: CreateReportButtonProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleCreate = () => {
    setError(null);
    startTransition(async () => {
      const result = await adminCreateReport(ordenServicioId, fecha);
      if ("error" in result) {
        setError(result.error);
      } else {
        router.push(`/admin/reportes/${result.reporteId}`);
      }
    });
  };

  if (!showPicker) {
    return (
      <button
        type="button"
        onClick={() => setShowPicker(true)}
        className="inline-flex items-center gap-1 text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3"
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
        Crear Reporte
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={fecha}
        onChange={(e) => {
          setFecha(e.target.value);
          setError(null);
        }}
        className="rounded-[6px] border border-admin-border bg-admin-surface-elevated px-2 py-1 text-[13px] text-text-0 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <button
        type="button"
        onClick={handleCreate}
        disabled={isPending}
        className="inline-flex items-center rounded-[6px] border border-admin-border bg-admin-surface px-2.5 py-1 text-[13px] font-medium text-text-1 transition-colors duration-[80ms] hover:bg-admin-surface-hover disabled:opacity-50"
      >
        {isPending ? "Creando..." : "Crear"}
      </button>
      <button
        type="button"
        onClick={() => {
          setShowPicker(false);
          setError(null);
        }}
        className="text-[12px] text-text-3 transition-colors duration-[80ms] hover:text-text-1"
      >
        Cancelar
      </button>
      {error && (
        <span className="text-[12px] text-status-error">{error}</span>
      )}
    </div>
  );
}
