"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateEstatusMaterial, deleteMaterialRequerido } from "@/app/actions/materiales-requeridos";
import type { MaterialRequeridoEstatus } from "@/types/inventory";

interface PendienteRow {
  id: string;
  reporte_id: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  prioridad: string;
  estatus: string;
  notas: string | null;
  created_at: string;
  materiales_catalogo: { nombre: string; unidad_default: string } | null;
  reportes: {
    id: string;
    fecha: string;
    orden_servicio_id: string;
    ordenes_servicio: { numero_orden: string } | null;
  } | null;
}

interface Props {
  initialPendientes: PendienteRow[];
}

const subNav = [
  { label: "Dashboard", href: "/admin/inventario" },
  { label: "Catalogo", href: "/admin/inventario/catalogo" },
  { label: "Entradas", href: "/admin/inventario/entradas" },
  { label: "Movimientos", href: "/admin/inventario/movimientos" },
  { label: "Pendientes", href: "/admin/inventario/pendientes", active: true },
];

const statusLabels: Record<string, string> = {
  pendiente: "Pendiente",
  en_camino: "En Camino",
  recibido: "Recibido",
};

const statusBadge: Record<string, string> = {
  pendiente: "bg-status-error/10 text-status-error",
  en_camino: "bg-status-warning/10 text-status-warning",
  recibido: "bg-status-success/10 text-status-success",
};

export function PendientesView({ initialPendientes }: Props) {
  const [pendientes, setPendientes] = useState(initialPendientes);
  const [isPending, startTransition] = useTransition();

  const handleUpdateStatus = (id: string, newStatus: MaterialRequeridoEstatus) => {
    startTransition(async () => {
      const result = await updateEstatusMaterial(id, newStatus);
      if (result.success) {
        if (newStatus === "recibido") {
          setPendientes((prev) => prev.filter((p) => p.id !== id));
        } else {
          setPendientes((prev) =>
            prev.map((p) => (p.id === id ? { ...p, estatus: newStatus } : p))
          );
        }
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Eliminar este material requerido?")) return;
    startTransition(async () => {
      const result = await deleteMaterialRequerido(id);
      if (result.success) {
        setPendientes((prev) => prev.filter((p) => p.id !== id));
      }
    });
  };

  // Group by ODS
  const grouped = new Map<string, { orden: string; items: PendienteRow[] }>();
  for (const p of pendientes) {
    const reporte = p.reportes as PendienteRow["reportes"];
    const ods = reporte?.ordenes_servicio as { numero_orden: string } | null;
    const key = reporte?.orden_servicio_id ?? "sin-orden";
    if (!grouped.has(key)) {
      grouped.set(key, { orden: ods?.numero_orden ?? "Sin ODS", items: [] });
    }
    grouped.get(key)!.items.push(p);
  }

  return (
    <>
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-[22px] font-bold tracking-[-0.025em] text-text-0">
          Materiales Pendientes
        </h1>
        <p className="mt-1 text-[13px] text-text-2">
          {pendientes.length} material{pendientes.length !== 1 ? "es" : ""} pendiente{pendientes.length !== 1 ? "s" : ""} de recibir
        </p>
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

      {pendientes.length === 0 ? (
        <div className="rounded-[10px] border border-admin-border bg-admin-surface py-28 text-center">
          <p className="text-[13px] text-text-3">No hay materiales pendientes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([key, group]) => (
            <div key={key}>
              <h3 className="mb-2 text-[12px] font-medium uppercase tracking-[0.04em] text-text-2">
                {group.orden}
              </h3>
              <div className="overflow-hidden rounded-[10px] border border-admin-border bg-admin-surface">
                {group.items.map((p, i) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 px-[14px] py-[10px] transition-colors hover:bg-admin-surface-hover${i > 0 ? " row-inset-divider" : ""}`}
                  >
                    {/* Priority indicator */}
                    {p.prioridad === "urgente" && (
                      <span className="shrink-0 rounded-full bg-status-error/10 px-1.5 py-0.5 text-[10px] font-bold text-status-error">
                        URGENTE
                      </span>
                    )}

                    <div className="flex-1">
                      <span className="text-[13px] font-medium text-text-0">
                        {p.descripcion}
                      </span>
                      <span className="ml-1.5 text-[12px] text-text-2">
                        {p.cantidad} {p.unidad}
                      </span>
                      {p.notas && (
                        <p className="text-[12px] text-text-2 mt-0.5">{p.notas}</p>
                      )}
                    </div>

                    {/* Status badge */}
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadge[p.estatus] ?? ""}`}
                    >
                      {statusLabels[p.estatus] ?? p.estatus}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {p.estatus === "pendiente" && (
                        <button
                          onClick={() => handleUpdateStatus(p.id, "en_camino")}
                          disabled={isPending}
                          className="rounded-[5px] px-2 py-1 text-[11px] font-medium text-status-warning transition-colors hover:bg-status-warning/10"
                        >
                          En Camino
                        </button>
                      )}
                      {(p.estatus === "pendiente" || p.estatus === "en_camino") && (
                        <button
                          onClick={() => handleUpdateStatus(p.id, "recibido")}
                          disabled={isPending}
                          className="rounded-[5px] px-2 py-1 text-[11px] font-medium text-status-success transition-colors hover:bg-status-success/10"
                        >
                          Recibido
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={isPending}
                        className="rounded-[5px] p-1 text-text-3 transition-colors hover:bg-status-error/10 hover:text-status-error"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
