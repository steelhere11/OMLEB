"use client";

import { useEffect, useState, useTransition } from "react";
import { saveEquipmentEntry, removeEquipmentEntry } from "@/app/actions/reportes";
import { EquipmentEntryForm } from "./equipment-entry-form";
import { AddEquipmentModal } from "./add-equipment-modal";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { ReporteEquipo, Equipo, TipoEquipo } from "@/types";

interface EquipmentSectionProps {
  reporteId: string;
  folioId: string;
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
  folioId,
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

  // Notify parent of entry count changes for reactive validation
  useEffect(() => {
    onEntriesChange?.(entries.length);
  }, [entries.length, onEntriesChange]);

  // Filter out equipment already added to the report
  const usedEquipoIds = new Set(entries.map((e) => e.equipo_id));
  const availableToAdd = allEquipment.filter((eq) => !usedEquipoIds.has(eq.id));

  const handleAddExistingEquipment = () => {
    if (!selectedEquipoId) return;

    const equipo = allEquipment.find((eq) => eq.id === selectedEquipoId);
    if (!equipo) return;

    startAddTransition(async () => {
      const formData = new FormData();
      formData.set("equipo_id", selectedEquipoId);
      formData.set("tipo_trabajo", "preventivo");
      formData.set("diagnostico", "");
      formData.set("trabajo_realizado", "");
      formData.set("observaciones", "");

      const result = await saveEquipmentEntry(reporteId, null, null, formData);

      if (result.success) {
        // We need to refetch to get the entry ID, or construct it optimistically
        // Since the server action doesn't return the new entry ID, we'll use router.refresh via a page-level mechanism
        // For now, construct an optimistic entry
        const optimisticEntry: ReporteEquipo & { equipos: Equipo & { tipos_equipo?: { slug: string; nombre: string } | null } } = {
          id: crypto.randomUUID(), // temporary ID until refresh
          reporte_id: reporteId,
          equipo_id: selectedEquipoId,
          tipo_trabajo: "preventivo",
          diagnostico: null,
          trabajo_realizado: null,
          observaciones: null,
          equipos: { ...equipo, tipos_equipo: undefined },
        };

        setEntries((prev) => [...prev, optimisticEntry]);
        setSelectedEquipoId("");
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

  const handleEquipmentCreated = (equipo: Equipo) => {
    // Add to the available equipment list
    setAllEquipment((prev) => [...prev, equipo]);
    // Automatically select it so they can add it to the report
    setSelectedEquipoId(equipo.id);
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
                {availableToAdd.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.numero_etiqueta}
                    {eq.marca && ` - ${eq.marca}`}
                    {eq.modelo && ` ${eq.modelo}`}
                  </option>
                ))}
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
          {entries.map((entry) => (
            <EquipmentEntryForm
              key={entry.id}
              entry={entry}
              reporteId={reporteId}
              onRemove={() => handleRemoveEntry(entry.id)}
              isCompleted={isCompleted}
              isRemoving={isRemoving}
              onUnsavedChange={onUnsavedChange}
            />
          ))}
        </div>
      )}

      {/* Add equipment modal */}
      <AddEquipmentModal
        folioId={folioId}
        tiposEquipo={tiposEquipo}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onEquipmentCreated={handleEquipmentCreated}
      />
    </div>
  );
}
