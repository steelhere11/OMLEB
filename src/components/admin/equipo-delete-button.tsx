"use client";

import { CascadeDeleteButton } from "./cascade-delete-button";
import { adminDeleteEquipo } from "@/app/actions/admin-delete";

interface EquipoDeleteButtonProps {
  equipoId: string;
  equipoLabel: string;
  reportRefCount: number;
}

export function EquipoDeleteButton({
  equipoId,
  equipoLabel,
  reportRefCount,
}: EquipoDeleteButtonProps) {
  const impactSummary =
    reportRefCount > 0
      ? `${reportRefCount} referencia${reportRefCount > 1 ? "s" : ""} en reportes (se desvincularan)`
      : undefined;

  return (
    <CascadeDeleteButton
      entityType="equipo"
      entityId={equipoId}
      entityLabel={equipoLabel}
      onDelete={adminDeleteEquipo}
      impactSummary={impactSummary}
      requireTypedConfirmation={reportRefCount > 0}
    />
  );
}
