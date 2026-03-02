"use client";

import { CascadeDeleteButton } from "./cascade-delete-button";
import { adminDeleteReport } from "@/app/actions/admin-delete";

interface ReporteDeleteButtonProps {
  reporteId: string;
  reporteLabel: string;
  photoCount: number;
  equipmentCount?: number;
  materialCount?: number;
  redirectTo?: string;
}

export function ReporteDeleteButton({
  reporteId,
  reporteLabel,
  photoCount,
  equipmentCount,
  materialCount,
  redirectTo,
}: ReporteDeleteButtonProps) {
  const parts: string[] = [];
  if (equipmentCount && equipmentCount > 0)
    parts.push(`${equipmentCount} equipo${equipmentCount > 1 ? "s" : ""}`);
  if (photoCount > 0)
    parts.push(`${photoCount} foto${photoCount > 1 ? "s" : ""}`);
  if (materialCount && materialCount > 0)
    parts.push(`${materialCount} material${materialCount > 1 ? "es" : ""}`);

  return (
    <CascadeDeleteButton
      entityType="reporte"
      entityId={reporteId}
      entityLabel={reporteLabel}
      onDelete={adminDeleteReport}
      impactSummary={parts.length > 0 ? parts.join(", ") : undefined}
      requireTypedConfirmation={photoCount > 0}
      redirectTo={redirectTo}
    />
  );
}
