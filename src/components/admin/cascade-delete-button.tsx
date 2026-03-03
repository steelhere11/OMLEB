"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface CascadeDeleteButtonProps {
  entityType: "orden" | "reporte" | "equipo" | "sucursal";
  entityId: string;
  entityLabel: string;
  onDelete: (id: string) => Promise<{ success?: boolean; error?: string }>;
  impactSummary?: string;
  requireTypedConfirmation?: boolean;
  redirectTo?: string;
}

const entityNames: Record<CascadeDeleteButtonProps["entityType"], string> = {
  orden: "la orden de servicio",
  reporte: "el reporte",
  equipo: "el equipo",
  sucursal: "la sucursal",
};

export function CascadeDeleteButton({
  entityType,
  entityId,
  entityLabel,
  onDelete,
  impactSummary,
  requireTypedConfirmation = false,
  redirectTo,
}: CascadeDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canConfirm = requireTypedConfirmation
    ? confirmText === entityLabel
    : true;

  const handleDelete = useCallback(async () => {
    if (!canConfirm) return;
    setLoading(true);
    setError(null);

    try {
      const result = await onDelete(entityId);
      if (result.error) {
        setError(result.error);
        setLoading(false);
      } else {
        setOpen(false);
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.refresh();
        }
      }
    } catch {
      setError("Error inesperado al eliminar");
      setLoading(false);
    }
  }, [canConfirm, onDelete, entityId, redirectTo, router]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setConfirmText("");
          setError(null);
        }}
        className="text-[13px] font-medium text-text-3 transition-colors duration-[80ms] hover:text-status-error"
      >
        Eliminar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !loading && setOpen(false)}
          />

          {/* Dialog */}
          <div className="relative z-10 mx-4 w-full max-w-md rounded-[10px] border border-admin-border bg-admin-surface p-6 shadow-xl">
            <h3 className="text-[15px] font-semibold text-text-0">
              Eliminar {entityNames[entityType]}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-text-1">
              Esta a punto de eliminar {entityNames[entityType]}{" "}
              <span className="font-semibold text-text-0">
                &quot;{entityLabel}&quot;
              </span>
              .
            </p>

            {impactSummary && (
              <div className="mt-3 rounded-[6px] border border-status-error/20 bg-status-error/5 px-3 py-2">
                <p className="text-[12px] font-medium text-status-error">
                  Se eliminaran: {impactSummary}
                </p>
              </div>
            )}

            {requireTypedConfirmation && (
              <div className="mt-4">
                <label className="block text-[12px] text-text-2">
                  Escriba{" "}
                  <span className="font-mono font-semibold text-text-0">
                    {entityLabel}
                  </span>{" "}
                  para confirmar
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={entityLabel}
                  className="mt-1.5 w-full rounded-[6px] border border-admin-border bg-transparent px-3 py-1.5 text-[13px] text-text-0 placeholder:text-text-3 focus:border-status-error focus:outline-none focus:ring-1 focus:ring-status-error"
                  disabled={loading}
                  autoFocus
                />
              </div>
            )}

            {error && (
              <div className="mt-3 rounded-[6px] border border-status-error/20 bg-status-error/5 px-3 py-2">
                <p className="text-[12px] text-status-error">{error}</p>
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="rounded-[6px] border border-admin-border px-3 py-1.5 text-[13px] font-medium text-text-1 transition-colors duration-[80ms] hover:bg-admin-surface-hover disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canConfirm || loading}
                className="inline-flex items-center gap-1.5 rounded-[6px] bg-red-600 px-3 py-1.5 text-[13px] font-medium text-white transition-colors duration-[80ms] hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && (
                  <svg
                    className="h-3.5 w-3.5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
