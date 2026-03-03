"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createEquipoForOrden } from "@/app/actions/equipos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { TipoEquipo } from "@/types";
import type { ActionState } from "@/types/actions";

interface AddEquipmentModalProps {
  ordenServicioId: string;
  reporteId: string;
  tiposEquipo: TipoEquipo[];
  isOpen: boolean;
  onClose: () => void;
  onEquipmentCreated: () => void;
}

export function AddEquipmentModal({
  ordenServicioId,
  reporteId,
  tiposEquipo,
  isOpen,
  onClose,
  onEquipmentCreated,
}: AddEquipmentModalProps) {
  const boundAction = createEquipoForOrden.bind(null, ordenServicioId, reporteId);
  const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
    boundAction,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);
  const prevSuccessRef = useRef(false);
  const [selectedTipoId, setSelectedTipoId] = useState("");
  const [customTipoText, setCustomTipoText] = useState("");

  // Find the "otro" tipo for fallback
  const otroTipo = tiposEquipo.find((t) => t.slug === "otro");
  const isOtroSelected = selectedTipoId === otroTipo?.id;

  // Handle success: notify parent and close
  useEffect(() => {
    if (state?.success && state.data && !prevSuccessRef.current) {
      prevSuccessRef.current = true;

      onEquipmentCreated();
      onClose();
      formRef.current?.reset();
      setSelectedTipoId("");
      setCustomTipoText("");
    }
  }, [state, onEquipmentCreated, onClose]);

  // Reset prevSuccessRef when modal re-opens
  useEffect(() => {
    if (isOpen) {
      prevSuccessRef.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const fieldErrors = state?.fieldErrors as
    | Record<string, string[] | undefined>
    | undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            Agregar Equipo Nuevo
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-gray-600 active:bg-gray-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Info notice */}
        <div className="mb-4 rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-blue-700">
            Este equipo sera revisado por un administrador y se vinculara a esta
            orden de servicio.
          </p>
        </div>

        {/* Error message */}
        {state?.error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{state.error}</p>
          </div>
        )}

        {/* Form */}
        <form ref={formRef} action={formAction} className="space-y-4">
          {/* Hidden field for tipo_equipo_id */}
          <input type="hidden" name="tipo_equipo_id" value={selectedTipoId} />
          {/* Hidden field for tipo_equipo text (for backward compat) */}
          <input
            type="hidden"
            name="tipo_equipo"
            value={
              isOtroSelected && customTipoText
                ? customTipoText
                : tiposEquipo.find((t) => t.id === selectedTipoId)?.nombre ?? ""
            }
          />

          {/* Numero/Etiqueta (required) */}
          <div>
            <Label htmlFor="modal-numero-etiqueta" required className="mb-1.5">
              Etiqueta / Numero
            </Label>
            <Input
              id="modal-numero-etiqueta"
              name="numero_etiqueta"
              placeholder='Ej. "Equipo 2", "AC-01"'
              required
              error={fieldErrors?.numero_etiqueta?.[0]}
            />
          </div>

          {/* Tipo de equipo (dropdown) */}
          <div>
            <Label htmlFor="modal-tipo-equipo" className="mb-1.5">
              Tipo de Equipo
            </Label>
            <Select
              id="modal-tipo-equipo"
              value={selectedTipoId}
              onChange={(e) => {
                setSelectedTipoId(e.target.value);
                if (e.target.value !== otroTipo?.id) {
                  setCustomTipoText("");
                }
              }}
            >
              <option value="">Seleccionar tipo...</option>
              {tiposEquipo.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </Select>
            {isOtroSelected && (
              <div className="mt-2">
                <Input
                  placeholder="Especifica el tipo de equipo..."
                  value={customTipoText}
                  onChange={(e) => setCustomTipoText(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Marca (optional) */}
          <div>
            <Label htmlFor="modal-marca" className="mb-1.5">
              Marca
            </Label>
            <Input
              id="modal-marca"
              name="marca"
              placeholder="Ej. Carrier, LG, Trane"
              error={fieldErrors?.marca?.[0]}
            />
          </div>

          {/* Modelo (optional) */}
          <div>
            <Label htmlFor="modal-modelo" className="mb-1.5">
              Modelo
            </Label>
            <Input
              id="modal-modelo"
              name="modelo"
              placeholder="Ej. 38CKC048"
              error={fieldErrors?.modelo?.[0]}
            />
          </div>

          {/* Numero de serie (optional) */}
          <div>
            <Label htmlFor="modal-numero-serie" className="mb-1.5">
              Numero de Serie
            </Label>
            <Input
              id="modal-numero-serie"
              name="numero_serie"
              placeholder="Ej. ABC123456"
              error={fieldErrors?.numero_serie?.[0]}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              fullWidth
              onClick={onClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              loading={isPending}
              disabled={isPending}
            >
              Agregar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
