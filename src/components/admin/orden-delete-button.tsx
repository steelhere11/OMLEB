"use client";

import { CascadeDeleteButton } from "./cascade-delete-button";
import { adminDeleteOrdenServicio } from "@/app/actions/admin-delete";

interface OrdenDeleteButtonProps {
  ordenId: string;
  ordenLabel: string;
  reportCount: number;
  photoCount?: number;
  redirectTo?: string;
}

export function OrdenDeleteButton({
  ordenId,
  ordenLabel,
  reportCount,
  photoCount,
  redirectTo,
}: OrdenDeleteButtonProps) {
  const parts: string[] = [];
  if (reportCount > 0) parts.push(`${reportCount} reporte${reportCount > 1 ? "s" : ""}`);
  if (photoCount && photoCount > 0) parts.push(`${photoCount} foto${photoCount > 1 ? "s" : ""}`);

  return (
    <CascadeDeleteButton
      entityType="orden"
      entityId={ordenId}
      entityLabel={ordenLabel}
      onDelete={adminDeleteOrdenServicio}
      impactSummary={parts.length > 0 ? parts.join(" con ") : undefined}
      requireTypedConfirmation={reportCount > 0}
      redirectTo={redirectTo}
    />
  );
}
