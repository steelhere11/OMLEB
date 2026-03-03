"use client";

import { CascadeDeleteButton } from "./cascade-delete-button";
import { adminDeleteSucursal } from "@/app/actions/admin-delete";

interface SucursalDeleteButtonProps {
  sucursalId: string;
  sucursalLabel: string;
  ordenCount: number;
  reportCount: number;
  equipoCount: number;
  photoCount: number;
}

export function SucursalDeleteButton({
  sucursalId,
  sucursalLabel,
  ordenCount,
  reportCount,
  equipoCount,
  photoCount,
}: SucursalDeleteButtonProps) {
  const parts: string[] = [];
  if (ordenCount > 0) parts.push(`${ordenCount} orden${ordenCount > 1 ? "es" : ""} de servicio`);
  if (reportCount > 0) parts.push(`${reportCount} reporte${reportCount > 1 ? "s" : ""}`);
  if (equipoCount > 0) parts.push(`${equipoCount} equipo${equipoCount > 1 ? "s" : ""}`);
  if (photoCount > 0) parts.push(`${photoCount} foto${photoCount > 1 ? "s" : ""}`);

  return (
    <CascadeDeleteButton
      entityType="sucursal"
      entityId={sucursalId}
      entityLabel={sucursalLabel}
      onDelete={adminDeleteSucursal}
      impactSummary={parts.length > 0 ? parts.join(", ") : undefined}
      requireTypedConfirmation
    />
  );
}
