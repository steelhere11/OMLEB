"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createEquipoForOrden } from "@/app/actions/equipos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GroupedEquipoTypeSelect } from "@/components/ui/grouped-equipo-type-select";
import { REFRIGERANTES, VOLTAJES, FASES } from "@/lib/constants/nameplate-options";
import { UBICACIONES_BBVA } from "@/lib/constants/ubicaciones";
import { FORMA_FACTORES, SLUGS_WITH_FORMA_FACTOR } from "@/lib/constants/equipment-taxonomy";
import type { TipoEquipo } from "@/types";
import type { ActionState } from "@/types/actions";

interface AddEquipmentModalProps {
  ordenServicioId: string;
  reporteId: string;
  tiposEquipo: TipoEquipo[];
  isOpen: boolean;
  onClose: () => void;
  onEquipmentCreated: () => void;
  variant?: "tech" | "admin";
}

export function AddEquipmentModal({
  ordenServicioId,
  reporteId,
  tiposEquipo,
  isOpen,
  onClose,
  onEquipmentCreated,
  variant = "tech",
}: AddEquipmentModalProps) {
  const isAdmin = variant === "admin";
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

  // Resolve slug for forma_factor visibility
  const selectedTipo = tiposEquipo.find((t) => t.id === selectedTipoId);
  const showFormaFactor = selectedTipo?.slug ? SLUGS_WITH_FORMA_FACTOR.has(selectedTipo.slug) : false;

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

  const adminInputClass = "block w-full rounded-lg border border-admin-border bg-admin-bg px-3 py-2 text-[13px] text-text-0 placeholder:text-text-3 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent";
  const adminInputErrorClass = "block w-full rounded-lg border border-red-500/50 bg-admin-bg px-3 py-2 text-[13px] text-text-0 placeholder:text-text-3 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-400/40";
  const adminSelectClass = "block w-full rounded-lg border border-admin-border bg-admin-bg px-3 py-2 text-[13px] text-text-0 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent";
  const techSelectClass = "block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base min-h-[48px] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-400 focus:border-brand-500";

  const adminLabelClass = "mb-1 text-[12px] text-text-1";

  // Admin uses raw <input> to avoid Input component's hardcoded light-theme base classes
  function AdminInput({ id, name, placeholder, required, error, value, onChange }: {
    id?: string; name?: string; placeholder?: string; required?: boolean;
    error?: string; value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) {
    return (
      <div>
        <input
          id={id}
          name={name}
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={onChange}
          className={error ? adminInputErrorClass : adminInputClass}
        />
        {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
      </div>
    );
  }

  function AdminSelect({ id, name, children }: {
    id?: string; name: string; children: React.ReactNode;
  }) {
    return (
      <select id={id} name={name} className={adminSelectClass}>
        {children}
      </select>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={
        isAdmin
          ? "relative w-full max-w-lg rounded-[10px] border border-admin-border bg-admin-surface p-5 shadow-xl max-h-[90vh] overflow-y-auto"
          : "relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
      }>
        {/* Header */}
        <div className={`${isAdmin ? "mb-4" : "mb-5"} flex items-center justify-between`}>
          <h2 className={isAdmin ? "text-[15px] font-semibold text-text-0" : "text-lg font-bold text-gray-900"}>
            Agregar Equipo Nuevo
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={
              isAdmin
                ? "flex h-7 w-7 items-center justify-center rounded-lg text-text-3 transition-colors hover:text-text-1"
                : "flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-gray-600 active:bg-gray-100"
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={isAdmin ? "h-4 w-4" : "h-5 w-5"}
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

        {/* Info notice — only show for tech */}
        {!isAdmin && (
          <div className="mb-4 rounded-lg bg-blue-50 p-3">
            <p className="text-xs text-blue-700">
              Este equipo sera revisado por un administrador y se vinculara a esta
              orden de servicio.
            </p>
          </div>
        )}

        {/* Error message */}
        {state?.error && (
          <div className={
            isAdmin
              ? "mb-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5"
              : "mb-4 rounded-lg border border-red-200 bg-red-50 p-3"
          }>
            <p className={isAdmin ? "text-[12px] text-red-400" : "text-sm text-red-700"}>{state.error}</p>
          </div>
        )}

        {/* Form */}
        <form ref={formRef} action={formAction} className={isAdmin ? "space-y-3" : "space-y-4"}>
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
            <Label htmlFor="modal-numero-etiqueta" required className={isAdmin ? adminLabelClass : "mb-1.5"}>
              Etiqueta / Numero
            </Label>
            {isAdmin ? (
              <AdminInput
                id="modal-numero-etiqueta"
                name="numero_etiqueta"
                placeholder='Ej. "Equipo 2", "AC-01"'
                required
                error={fieldErrors?.numero_etiqueta?.[0]}
              />
            ) : (
              <Input
                id="modal-numero-etiqueta"
                name="numero_etiqueta"
                placeholder='Ej. "Equipo 2", "AC-01"'
                required
                error={fieldErrors?.numero_etiqueta?.[0]}
              />
            )}
          </div>

          {/* Tipo de equipo (grouped dropdown) */}
          <div>
            <Label htmlFor="modal-tipo-equipo" className={isAdmin ? adminLabelClass : "mb-1.5"}>
              Tipo de Equipo
            </Label>
            <GroupedEquipoTypeSelect
              id="modal-tipo-equipo"
              tiposEquipo={tiposEquipo}
              value={selectedTipoId}
              onChange={(e) => {
                setSelectedTipoId(e.target.value);
                if (e.target.value !== otroTipo?.id) {
                  setCustomTipoText("");
                }
              }}
              className={isAdmin ? adminSelectClass : techSelectClass}
            />
            {isOtroSelected && (
              <div className="mt-2">
                {isAdmin ? (
                  <AdminInput
                    placeholder="Especifica el tipo de equipo..."
                    value={customTipoText}
                    onChange={(e) => setCustomTipoText(e.target.value)}
                  />
                ) : (
                  <Input
                    placeholder="Especifica el tipo de equipo..."
                    value={customTipoText}
                    onChange={(e) => setCustomTipoText(e.target.value)}
                  />
                )}
              </div>
            )}
          </div>

          {/* Forma Factor — only when tipo_equipo has forma factor */}
          {isAdmin && showFormaFactor && (
            <div>
              <Label htmlFor="modal-forma-factor" className={adminLabelClass}>
                Forma / Factor
              </Label>
              <AdminSelect id="modal-forma-factor" name="forma_factor">
                <option value="">Seleccionar...</option>
                {FORMA_FACTORES.map((ff) => (
                  <option key={ff.value} value={ff.value}>{ff.label}</option>
                ))}
              </AdminSelect>
            </div>
          )}

          {/* Marca / Modelo — side by side for admin, stacked for tech */}
          {isAdmin ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="modal-marca" className={adminLabelClass}>
                  Marca
                </Label>
                <AdminInput
                  id="modal-marca"
                  name="marca"
                  placeholder="Ej. Carrier, LG"
                  error={fieldErrors?.marca?.[0]}
                />
              </div>
              <div>
                <Label htmlFor="modal-modelo" className={adminLabelClass}>
                  Modelo
                </Label>
                <AdminInput
                  id="modal-modelo"
                  name="modelo"
                  placeholder="Ej. 38CKC048"
                  error={fieldErrors?.modelo?.[0]}
                />
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}

          {/* Numero de serie (optional) */}
          <div>
            <Label htmlFor="modal-numero-serie" className={isAdmin ? adminLabelClass : "mb-1.5"}>
              Numero de Serie
            </Label>
            {isAdmin ? (
              <AdminInput
                id="modal-numero-serie"
                name="numero_serie"
                placeholder="Ej. ABC123456"
                error={fieldErrors?.numero_serie?.[0]}
              />
            ) : (
              <Input
                id="modal-numero-serie"
                name="numero_serie"
                placeholder="Ej. ABC123456"
                error={fieldErrors?.numero_serie?.[0]}
              />
            )}
          </div>

          {/* Admin-only: additional nameplate fields */}
          {isAdmin && (
            <>
              {/* Capacidad */}
              <div>
                <Label htmlFor="modal-capacidad" className={adminLabelClass}>
                  Capacidad
                </Label>
                <AdminInput
                  id="modal-capacidad"
                  name="capacidad"
                  placeholder="Ej: 5 Ton, 60000 BTU"
                />
              </div>

              {/* Refrigerante / Voltaje side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="modal-refrigerante" className={adminLabelClass}>
                    Refrigerante
                  </Label>
                  <AdminSelect id="modal-refrigerante" name="refrigerante">
                    <option value="">Seleccionar...</option>
                    {REFRIGERANTES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </AdminSelect>
                </div>
                <div>
                  <Label htmlFor="modal-voltaje" className={adminLabelClass}>
                    Voltaje
                  </Label>
                  <AdminSelect id="modal-voltaje" name="voltaje">
                    <option value="">Seleccionar...</option>
                    {VOLTAJES.map((v) => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </AdminSelect>
                </div>
              </div>

              {/* Fase / Ubicacion side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="modal-fase" className={adminLabelClass}>
                    Fase
                  </Label>
                  <AdminSelect id="modal-fase" name="fase">
                    <option value="">Seleccionar...</option>
                    {FASES.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </AdminSelect>
                </div>
                <div>
                  <Label htmlFor="modal-ubicacion" className={adminLabelClass}>
                    Ubicacion
                  </Label>
                  <AdminSelect id="modal-ubicacion" name="ubicacion">
                    <option value="">Seleccionar...</option>
                    {UBICACIONES_BBVA.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </AdminSelect>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className={`flex gap-3 ${isAdmin ? "pt-1" : "pt-2"}`}>
            <Button
              type="button"
              variant="outline"
              size={isAdmin ? "sm" : "md"}
              fullWidth
              onClick={onClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size={isAdmin ? "sm" : "md"}
              fullWidth
              loading={isPending}
              disabled={isPending}
              className={isAdmin ? "bg-accent text-white hover:bg-accent/90" : undefined}
            >
              Agregar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
