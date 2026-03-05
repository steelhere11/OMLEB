"use client";

import { useState, useTransition } from "react";
import { saveEquipmentEntry } from "@/app/actions/reportes";
import { WorkTypeToggle } from "@/components/tecnico/work-type-toggle";
import { WorkflowPreventive } from "./workflow-preventive";
import { WorkflowCorrective } from "./workflow-corrective";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { VoiceInput } from "@/components/shared/voice-input";
import { Button } from "@/components/ui/button";
import type { ReporteEquipo, Equipo, TipoTrabajo } from "@/types";

interface EquipmentEntryFormProps {
  entry: ReporteEquipo & {
    equipos: Equipo & {
      tipos_equipo?: { slug: string; nombre: string } | null;
    };
  };
  reporteId: string;
  onRemove: () => void;
  isCompleted: boolean;
  isRemoving: boolean;
  onUnsavedChange?: (hasChanges: boolean) => void;
  hasOtherWorkType: boolean;
  onAddOtherWorkType?: () => void;
  photoCount?: number;
  flaggedCount?: number;
}

export function EquipmentEntryForm({
  entry,
  reporteId,
  onRemove,
  isCompleted,
  isRemoving,
  onUnsavedChange,
  hasOtherWorkType,
  onAddOtherWorkType,
  photoCount = 0,
  flaggedCount = 0,
}: EquipmentEntryFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tipoTrabajo, setTipoTrabajo] = useState<TipoTrabajo>(
    entry.tipo_trabajo
  );
  const [observaciones, setObservaciones] = useState(
    entry.observaciones ?? ""
  );
  const [isSaving, startSaveTransition] = useTransition();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const equipo = entry.equipos;
  const tipoEquipoSlug = equipo.tipos_equipo?.slug ?? "otro";

  const handleSave = () => {
    startSaveTransition(async () => {
      const formData = new FormData();
      formData.set("equipo_id", entry.equipo_id);
      formData.set("tipo_trabajo", tipoTrabajo);
      formData.set("diagnostico", "");
      formData.set("trabajo_realizado", "");
      formData.set("observaciones", observaciones);

      const result = await saveEquipmentEntry(
        reporteId,
        entry.id,
        null,
        formData
      );

      if (result.success) {
        setSavedMessage("Guardado");
        setErrorMessage(null);
        onUnsavedChange?.(false);
        setTimeout(() => setSavedMessage(null), 2000);
      } else {
        setErrorMessage(result.error ?? "Error al guardar");
        setTimeout(() => setErrorMessage(null), 3000);
      }
    });
  };

  const handleFieldChange = () => {
    onUnsavedChange?.(true);
  };

  // Scroll input into view on focus (mobile keyboard handling)
  const handleInputFocus = (
    e: React.FocusEvent<HTMLTextAreaElement>
  ) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  return (
    <div className="rounded-card border border-tech-border bg-tech-surface overflow-hidden">
      {/* Accordion header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors active:bg-gray-50"
      >
        <div className="flex-1">
          <p className="text-body font-bold text-tech-text-primary">
            {equipo.numero_etiqueta}
          </p>
          <div className="flex items-center gap-2">
            {(equipo.marca || equipo.modelo) && (
              <p className="text-label text-tech-text-muted">
                {[equipo.marca, equipo.modelo].filter(Boolean).join(" ")}
              </p>
            )}
            {equipo.tipos_equipo && (
              <span className="text-label text-tech-text-muted">
                · {equipo.tipos_equipo.nombre}
              </span>
            )}
          </div>
        </div>

        {/* Flagged photos indicator */}
        {flaggedCount > 0 && (
          <span className="mr-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {flaggedCount}
          </span>
        )}

        {/* Photo count badge */}
        {photoCount > 0 && flaggedCount === 0 && (
          <span className="mr-1 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {photoCount}
          </span>
        )}

        {/* Work type indicator */}
        <span
          className={`mr-3 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            tipoTrabajo === "preventivo"
              ? "bg-blue-50 text-blue-600"
              : "bg-amber-50 text-amber-600"
          }`}
        >
          {tipoTrabajo === "preventivo" ? "Prev." : "Corr."}
        </span>

        {/* Expand/collapse chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 text-tech-text-muted transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Expanded form */}
      {isExpanded && (
        <div className="border-t border-tech-border-subtle p-4 space-y-4">
          {/* Work type toggle / read-only label */}
          <div>
            <Label className="mb-2">Tipo de trabajo</Label>
            {hasOtherWorkType ? (
              /* Both types exist — show read-only label to prevent accidental switching */
              <div
                className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium ${
                  tipoTrabajo === "preventivo"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {tipoTrabajo === "preventivo" ? "Preventivo" : "Correctivo"}
              </div>
            ) : (
              <>
                <WorkTypeToggle
                  name="tipo_trabajo"
                  value={tipoTrabajo}
                  onChange={(val) => {
                    setTipoTrabajo(val);
                    handleFieldChange();
                  }}
                  disabled={isCompleted}
                />
                {!isCompleted && onAddOtherWorkType && (
                  <button
                    type="button"
                    onClick={onAddOtherWorkType}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-tech-text-muted transition-colors active:bg-gray-50"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar {tipoTrabajo === "preventivo" ? "Correctivo" : "Preventivo"}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Workflow section -- conditionally renders based on tipo_trabajo */}
          {tipoTrabajo === "preventivo" ? (
            <WorkflowPreventive
              reporteEquipoId={entry.id}
              tipoEquipoSlug={tipoEquipoSlug}
              isCompleted={isCompleted}
              reporteId={reporteId}
              equipoId={entry.equipo_id}
            />
          ) : (
            <WorkflowCorrective
              reporteEquipoId={entry.id}
              tipoEquipoSlug={tipoEquipoSlug}
              isCompleted={isCompleted}
              reporteId={reporteId}
              equipoId={entry.equipo_id}
            />
          )}

          {/* General observations textarea */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor={`observaciones-${entry.id}`}>
                Observaciones generales
              </Label>
              <VoiceInput
                currentValue={observaciones}
                onTranscript={(text) => {
                  setObservaciones(text);
                  handleFieldChange();
                }}
                disabled={isCompleted}
              />
            </div>
            <Textarea
              id={`observaciones-${entry.id}`}
              value={observaciones}
              onChange={(e) => {
                setObservaciones(e.target.value);
                handleFieldChange();
              }}
              onFocus={handleInputFocus}
              placeholder="Observaciones adicionales sobre este equipo..."
              disabled={isCompleted}
              className="min-h-[80px]"
            />
          </div>

          {/* Save/remove buttons and status */}
          {!isCompleted && (
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={onRemove}
                disabled={isRemoving}
              >
                Eliminar
              </Button>

              <div className="flex items-center gap-3">
                {/* Saved indicator */}
                {savedMessage && (
                  <span className="text-sm font-medium text-green-600">
                    {savedMessage}
                  </span>
                )}
                {errorMessage && (
                  <span className="text-sm font-medium text-red-600">
                    {errorMessage}
                  </span>
                )}
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  loading={isSaving}
                  disabled={isSaving}
                >
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
