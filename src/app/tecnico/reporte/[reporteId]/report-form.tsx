"use client";

import type { ReporteEquipo, Equipo, ReporteMaterial, ReporteEstatus } from "@/types";

interface ReportFormProps {
  reporteId: string;
  folioNumero: string;
  folioDescripcion: string;
  sucursalNombre: string;
  sucursalId: string;
  clienteNombre: string;
  initialEntries: (ReporteEquipo & { equipos: Equipo })[];
  initialMaterials: ReporteMaterial[];
  availableEquipment: Equipo[];
  teamMembers: { nombre: string; rol: string }[];
  currentStatus: ReporteEstatus;
  isCompleted: boolean;
}

export function ReportForm({ folioNumero }: ReportFormProps) {
  return (
    <div>
      <p className="text-lg font-bold">{folioNumero}</p>
      <p className="text-sm text-gray-500">Cargando formulario...</p>
    </div>
  );
}
