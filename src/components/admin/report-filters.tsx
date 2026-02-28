"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface ReportFiltersProps {
  sucursales: { id: string; nombre: string; numero: string }[];
  currentParams: {
    estatus?: string;
    sucursal_id?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  };
}

export function ReportFilters({ sucursales, currentParams }: ReportFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      const qs = params.toString();
      router.push(qs ? `/admin/reportes?${qs}` : "/admin/reportes");
    },
    [router, searchParams]
  );

  const clearAll = useCallback(() => {
    router.push("/admin/reportes");
  }, [router]);

  const hasFilters =
    currentParams.estatus ||
    currentParams.sucursal_id ||
    currentParams.fecha_desde ||
    currentParams.fecha_hasta;

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      {/* Status */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
          Estatus
        </label>
        <select
          value={currentParams.estatus ?? ""}
          onChange={(e) => updateFilter("estatus", e.target.value)}
          className="h-8 rounded-[6px] border border-admin-border bg-admin-surface px-2 text-[13px] text-text-1 outline-none transition-colors duration-[80ms] focus:border-accent"
        >
          <option value="">Todos</option>
          <option value="en_progreso">En Progreso</option>
          <option value="en_espera">En Espera</option>
          <option value="completado">Completado</option>
        </select>
      </div>

      {/* Sucursal */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
          Sucursal
        </label>
        <select
          value={currentParams.sucursal_id ?? ""}
          onChange={(e) => updateFilter("sucursal_id", e.target.value)}
          className="h-8 rounded-[6px] border border-admin-border bg-admin-surface px-2 text-[13px] text-text-1 outline-none transition-colors duration-[80ms] focus:border-accent"
        >
          <option value="">Todas las sucursales</option>
          {sucursales.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre} ({s.numero})
            </option>
          ))}
        </select>
      </div>

      {/* Fecha Desde */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
          Desde
        </label>
        <input
          type="date"
          value={currentParams.fecha_desde ?? ""}
          onChange={(e) => updateFilter("fecha_desde", e.target.value)}
          className="h-8 rounded-[6px] border border-admin-border bg-admin-surface px-2 text-[13px] text-text-1 outline-none transition-colors duration-[80ms] focus:border-accent"
        />
      </div>

      {/* Fecha Hasta */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
          Hasta
        </label>
        <input
          type="date"
          value={currentParams.fecha_hasta ?? ""}
          onChange={(e) => updateFilter("fecha_hasta", e.target.value)}
          className="h-8 rounded-[6px] border border-admin-border bg-admin-surface px-2 text-[13px] text-text-1 outline-none transition-colors duration-[80ms] focus:border-accent"
        />
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="h-8 text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
