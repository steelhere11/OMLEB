"use client";

import { useState, useTransition } from "react";
import type { TipoEquipo } from "@/types";
import { REFRIGERANTES, VOLTAJES, FASES } from "@/lib/constants/nameplate-options";
import { UBICACIONES_BBVA } from "@/lib/constants/ubicaciones";

// ---------- Types ----------

interface EquipoForEdit {
  id: string;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  tipo_equipo_id: string | null;
  capacidad: string | null;
  refrigerante: string | null;
  voltaje: string | null;
  fase: string | null;
  ubicacion: string | null;
}

interface AdminEquipmentInfoEditorProps {
  equipo: EquipoForEdit;
  tiposEquipo: TipoEquipo[];
  onSave: (data: {
    marca?: string;
    modelo?: string;
    numero_serie?: string;
    tipo_equipo_id?: string;
    capacidad?: string;
    refrigerante?: string;
    voltaje?: string;
    fase?: string;
    ubicacion?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

// ---------- Component ----------

export function AdminEquipmentInfoEditor({
  equipo,
  tiposEquipo,
  onSave,
  onCancel,
}: AdminEquipmentInfoEditorProps) {
  const [marca, setMarca] = useState(equipo.marca ?? "");
  const [modelo, setModelo] = useState(equipo.modelo ?? "");
  const [numeroSerie, setNumeroSerie] = useState(equipo.numero_serie ?? "");
  const [tipoEquipoId, setTipoEquipoId] = useState(equipo.tipo_equipo_id ?? "");
  const [capacidad, setCapacidad] = useState(equipo.capacidad ?? "");
  const [refrigerante, setRefrigerante] = useState(equipo.refrigerante ?? "");
  const [voltaje, setVoltaje] = useState(equipo.voltaje ?? "");
  const [fase, setFase] = useState(equipo.fase ?? "");
  const [ubicacion, setUbicacion] = useState(equipo.ubicacion ?? "");

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await onSave({
          marca,
          modelo,
          numero_serie: numeroSerie,
          tipo_equipo_id: tipoEquipoId,
          capacidad,
          refrigerante,
          voltaje,
          fase,
          ubicacion,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al guardar");
      }
    });
  }

  const inputClass =
    "w-full rounded-[6px] border border-admin-border bg-admin-surface px-2.5 py-1 text-[13px]";
  const labelClass =
    "mb-0.5 block text-[11px] font-medium uppercase tracking-[0.04em] text-text-2";

  return (
    <div className="mt-2 rounded-[6px] border border-accent/30 bg-accent/5 px-3 py-3 space-y-3">
      <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-accent">
        Editar Datos del Equipo
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Marca */}
        <div>
          <label className={labelClass}>Marca</label>
          <input
            type="text"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            className={inputClass}
            placeholder="Marca"
          />
        </div>

        {/* Modelo */}
        <div>
          <label className={labelClass}>Modelo</label>
          <input
            type="text"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            className={inputClass}
            placeholder="Modelo"
          />
        </div>

        {/* Numero de serie */}
        <div>
          <label className={labelClass}>No. Serie</label>
          <input
            type="text"
            value={numeroSerie}
            onChange={(e) => setNumeroSerie(e.target.value)}
            className={inputClass}
            placeholder="Numero de serie"
          />
        </div>

        {/* Tipo equipo dropdown */}
        <div>
          <label className={labelClass}>Tipo de Equipo</label>
          <select
            value={tipoEquipoId}
            onChange={(e) => setTipoEquipoId(e.target.value)}
            className={inputClass}
          >
            <option value="">-- Sin tipo --</option>
            {tiposEquipo.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Capacidad */}
        <div>
          <label className={labelClass}>Capacidad</label>
          <input
            type="text"
            value={capacidad}
            onChange={(e) => setCapacidad(e.target.value)}
            className={inputClass}
            placeholder="Ej: 2 TON, 36000 BTU"
          />
        </div>

        {/* Refrigerante dropdown */}
        <div>
          <label className={labelClass}>Refrigerante</label>
          <select
            value={refrigerante}
            onChange={(e) => setRefrigerante(e.target.value)}
            className={inputClass}
          >
            <option value="">-- Sin refrigerante --</option>
            {REFRIGERANTES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Voltaje dropdown */}
        <div>
          <label className={labelClass}>Voltaje</label>
          <select
            value={voltaje}
            onChange={(e) => setVoltaje(e.target.value)}
            className={inputClass}
          >
            <option value="">-- Sin voltaje --</option>
            {VOLTAJES.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        {/* Fase dropdown */}
        <div>
          <label className={labelClass}>Fase</label>
          <select
            value={fase}
            onChange={(e) => setFase(e.target.value)}
            className={inputClass}
          >
            <option value="">-- Sin fase --</option>
            {FASES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Ubicacion dropdown */}
        <div>
          <label className={labelClass}>Ubicacion</label>
          <select
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            className={inputClass}
          >
            <option value="">-- Sin ubicacion --</option>
            {UBICACIONES_BBVA.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {error && (
          <span className="text-[12px] text-red-600">{error}</span>
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={onCancel}
          className="text-[12px] font-medium text-text-2 transition-colors duration-[80ms] hover:text-text-0"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-[6px] bg-accent px-3 py-1 text-[12px] font-medium text-white transition-colors duration-[80ms] hover:bg-accent/90 disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}
