"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { saveEquipmentEntry, removeEquipmentEntry } from "@/app/actions/reportes";
import { EquipmentEntryForm } from "./equipment-entry-form";
import { AddEquipmentModal } from "./add-equipment-modal";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { ReporteEquipo, Equipo, TipoEquipo } from "@/types";

interface EquipmentSectionProps {
  reporteId: string;
  ordenServicioId: string;
  initialEntries: (ReporteEquipo & { equipos: Equipo & { tipos_equipo?: { slug: string; nombre: string } | null } })[];
  availableEquipment: Equipo[];
  tiposEquipo: TipoEquipo[];
  sucursalId: string;
  isCompleted: boolean;
  onUnsavedChange?: (hasChanges: boolean) => void;
  onEntriesChange?: (count: number) => void;
}

export function EquipmentSection({
  reporteId,
  ordenServicioId,
  initialEntries,
  availableEquipment,
  tiposEquipo,
  sucursalId,
  isCompleted,
  onUnsavedChange,
  onEntriesChange,
}: EquipmentSectionProps) {
  const [entries, setEntries] =
    useState<(ReporteEquipo & { equipos: Equipo & { tipos_equipo?: { slug: string; nombre: string } | null } })[]>(initialEntries);
  const [allEquipment, setAllEquipment] = useState<Equipo[]>(availableEquipment);
  const [isAdding, startAddTransition] = useTransition();
  const [isRemoving, startRemoveTransition] = useTransition();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEquipoId, setSelectedEquipoId] = useState("");

  // Sync entries when server data changes (e.g. after revalidatePath)
  const prevInitialRef = useRef(initialEntries);
  useEffect(() => {
    if (prevInitialRef.current !== initialEntries) {
      setEntries(initialEntries);
      prevInitialRef.current = initialEntries;
    }
  }, [initialEntries]);

  // Sync available equipment when server data changes
  const prevEquipRef = useRef(availableEquipment);
  useEffect(() => {
    if (prevEquipRef.current !== availableEquipment) {
      setAllEquipment(availableEquipment);
      prevEquipRef.current = availableEquipment;
    }
  }, [availableEquipment]);

  // Notify parent of entry count changes for reactive validation
  useEffect(() => {
    onEntriesChange?.(entries.length);
  }, [entries.length, onEntriesChange]);

  // Build a map of equipo_id -> Set of tipo_trabajo already in the report
  const usedWorkTypes = new Map<string, Set<string>>();
  for (const e of entries) {
    if (!usedWorkTypes.has(e.equipo_id)) {
      usedWorkTypes.set(e.equipo_id, new Set());
    }
    usedWorkTypes.get(e.equipo_id)!.add(e.tipo_trabajo);
  }

  // Only hide equipment that already has BOTH preventivo and correctivo entries
  const availableToAdd = allEquipment.filter((eq) => {
    const types = usedWorkTypes.get(eq.id);
    if (!types) return true; // not added at all
    return !(types.has("preventivo") && types.has("correctivo")); // show if missing one type
  });

  const handleAddExistingEquipment = () => {
    if (!selectedEquipoId) return;

    const equipo = allEquipment.find((eq) => eq.id === selectedEquipoId);
    if (!equipo) return;

    // Smart default: if preventivo already exists, default to correctivo
    const existingTypes = usedWorkTypes.get(selectedEquipoId);
    const defaultTipo = existingTypes?.has("preventivo") ? "correctivo" : "preventivo";

    startAddTransition(async () => {
      const formData = new FormData();
      formData.set("equipo_id", selectedEquipoId);
      formData.set("tipo_trabajo", defaultTipo);
      formData.set("diagnostico", "");
      formData.set("trabajo_realizado", "");
      formData.set("observaciones", "");

      const result = await saveEquipmentEntry(reporteId, null, null, formData);

      if (result.success) {
        const optimisticEntry: ReporteEquipo & { equipos: Equipo & { tipos_equipo?: { slug: string; nombre: string } | null } } = {
          id: crypto.randomUUID(),
          reporte_id: reporteId,
          equipo_id: selectedEquipoId,
          tipo_trabajo: defaultTipo,
          diagnostico: null,
          trabajo_realizado: null,
          observaciones: null,
          registro_completado: false,
          equipos: { ...equipo, tipos_equipo: undefined },
        };

        setEntries((prev) => [...prev, optimisticEntry]);
        setSelectedEquipoId("");
      }
    });
  };

  const handleAddOtherWorkType = (equipoId: string, currentTipoTrabajo: string) => {
    const equipo = allEquipment.find((eq) => eq.id === equipoId);
    if (!equipo) return;

    const oppositeTipo = currentTipoTrabajo === "preventivo" ? "correctivo" : "preventivo";

    startAddTransition(async () => {
      const formData = new FormData();
      formData.set("equipo_id", equipoId);
      formData.set("tipo_trabajo", oppositeTipo);
      formData.set("diagnostico", "");
      formData.set("trabajo_realizado", "");
      formData.set("observaciones", "");

      const result = await saveEquipmentEntry(reporteId, null, null, formData);

      if (result.success) {
        const optimisticEntry: ReporteEquipo & { equipos: Equipo & { tipos_equipo?: { slug: string; nombre: string } | null } } = {
          id: crypto.randomUUID(),
          reporte_id: reporteId,
          equipo_id: equipoId,
          tipo_trabajo: oppositeTipo,
          diagnostico: null,
          trabajo_realizado: null,
          observaciones: null,
          registro_completado: false,
          equipos: { ...equipo, tipos_equipo: undefined },
        };

        setEntries((prev) => [...prev, optimisticEntry]);
      }
    });
  };

  const handleRemoveEntry = (entryId: string) => {
    // Optimistic removal
    const removedEntry = entries.find((e) => e.id === entryId);
    setEntries((prev) => prev.filter((e) => e.id !== entryId));

    startRemoveTransition(async () => {
      const result = await removeEquipmentEntry(entryId);

      if (result.error) {
        // Revert on failure
        if (removedEntry) {
          setEntries((prev) => [...prev, removedEntry]);
        }
      }
    });
  };

  const handleEquipmentCreated = () => {
    // Server action already inserted reporte_equipos and called revalidatePath.
    // The sync effects above will pick up the fresh initialEntries/availableEquipment
    // from the server re-render. Nothing else to do here.
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">Equipos</h2>
        <span className="text-sm text-gray-500">
          {entries.length} {entries.length === 1 ? "equipo" : "equipos"}
        </span>
      </div>

      {/* Add equipment controls */}
      {!isCompleted && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Agregar equipo</p>

          {/* Select from existing equipment */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                value={selectedEquipoId}
                onChange={(e) => setSelectedEquipoId(e.target.value)}
                disabled={availableToAdd.length === 0}
              >
                <option value="">
                  {availableToAdd.length === 0
                    ? "Todos los equipos agregados"
                    : "Seleccionar equipo..."}
                </option>
                {availableToAdd.map((eq) => {
                  const types = usedWorkTypes.get(eq.id);
                  const hint = types?.has("preventivo")
                    ? " (+ Correctivo)"
                    : types?.has("correctivo")
                      ? " (+ Preventivo)"
                      : "";
                  return (
                    <option key={eq.id} value={eq.id}>
                      {eq.numero_etiqueta}
                      {eq.marca && ` - ${eq.marca}`}
                      {eq.modelo && ` ${eq.modelo}`}
                      {hint}
                    </option>
                  );
                })}
              </Select>
            </div>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleAddExistingEquipment}
              disabled={!selectedEquipoId || isAdding}
              loading={isAdding}
            >
              Agregar
            </Button>
          </div>

          {/* Add new equipment from field */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors active:bg-gray-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Agregar equipo nuevo
          </button>
        </div>
      )}

      {/* Equipment entries list */}
      {entries.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-sm text-gray-500">
            No hay equipos agregados al reporte
          </p>
          {!isCompleted && (
            <p className="mt-1 text-xs text-gray-400">
              Selecciona un equipo de la lista o agrega uno nuevo
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {[...entries]
            .sort((a, b) => {
              // Group same equipment together, preventivo first
              if (a.equipo_id !== b.equipo_id) return a.equipo_id.localeCompare(b.equipo_id);
              if (a.tipo_trabajo === "preventivo" && b.tipo_trabajo !== "preventivo") return -1;
              if (a.tipo_trabajo !== "preventivo" && b.tipo_trabajo === "preventivo") return 1;
              return 0;
            })
            .map((entry) => {
              const siblingTypes = usedWorkTypes.get(entry.equipo_id);
              const hasOtherWorkType = siblingTypes ? siblingTypes.size >= 2 : false;
              return (
                <EquipmentEntryForm
                  key={entry.id}
                  entry={entry}
                  reporteId={reporteId}
                  onRemove={() => handleRemoveEntry(entry.id)}
                  isCompleted={isCompleted}
                  isRemoving={isRemoving}
                  onUnsavedChange={onUnsavedChange}
                  hasOtherWorkType={hasOtherWorkType}
                  onAddOtherWorkType={() => handleAddOtherWorkType(entry.equipo_id, entry.tipo_trabajo)}
                />
              );
            })}
        </div>
      )}

      {/* Add equipment modal */}
      <AddEquipmentModal
        ordenServicioId={ordenServicioId}
        reporteId={reporteId}
        tiposEquipo={tiposEquipo}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onEquipmentCreated={handleEquipmentCreated}
      />
    </div>
  );
}
