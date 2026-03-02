"use client";

import { CascadeDeleteButton } from "./cascade-delete-button";
import { adminDeleteFolio } from "@/app/actions/admin-delete";

interface FolioDeleteButtonProps {
  folioId: string;
  folioLabel: string;
  reportCount: number;
  photoCount?: number;
  redirectTo?: string;
}

export function FolioDeleteButton({
  folioId,
  folioLabel,
  reportCount,
  photoCount,
  redirectTo,
}: FolioDeleteButtonProps) {
  const parts: string[] = [];
  if (reportCount > 0) parts.push(`${reportCount} reporte${reportCount > 1 ? "s" : ""}`);
  if (photoCount && photoCount > 0) parts.push(`${photoCount} foto${photoCount > 1 ? "s" : ""}`);

  return (
    <CascadeDeleteButton
      entityType="folio"
      entityId={folioId}
      entityLabel={folioLabel}
      onDelete={adminDeleteFolio}
      impactSummary={parts.length > 0 ? parts.join(" con ") : undefined}
      requireTypedConfirmation={reportCount > 0}
      redirectTo={redirectTo}
    />
  );
}
