import { createClient } from "@/lib/supabase/server";
import { ReportForm } from "./report-form";
import type { ReporteEstatus, ReporteEquipo, Equipo, ReporteMaterial, TipoEquipo } from "@/types";

type ReportWithRelations = {
  id: string;
  folio_id: string;
  fecha: string;
  estatus: ReporteEstatus;
  sucursal_id: string;
  folios: {
    numero_folio: string;
    descripcion_problema: string;
    sucursal_id: string;
    sucursales: { nombre: string; numero: string } | null;
    clientes: { nombre: string } | null;
  } | null;
};

export default async function ReportePage({
  params,
}: {
  params: Promise<{ reporteId: string }>;
}) {
  const { reporteId } = await params;
  const supabase = await createClient();

  // Fetch the report with folio details
  const { data: report } = await supabase
    .from("reportes")
    .select(
      "id, folio_id, fecha, estatus, sucursal_id, folios(numero_folio, descripcion_problema, sucursal_id, sucursales(nombre, numero), clientes(nombre))"
    )
    .eq("id", reporteId)
    .single();

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-base font-medium text-gray-600">
          Reporte no encontrado
        </p>
      </div>
    );
  }

  const typedReport = report as unknown as ReportWithRelations;

  // Fetch equipment entries with equipment details and tipo_equipo join
  const { data: entries } = await supabase
    .from("reporte_equipos")
    .select(
      "id, reporte_id, equipo_id, tipo_trabajo, diagnostico, trabajo_realizado, observaciones, equipos(id, sucursal_id, numero_etiqueta, marca, modelo, numero_serie, tipo_equipo, tipo_equipo_id, agregado_por, revisado, created_at, updated_at, tipos_equipo:tipo_equipo_id(slug, nombre))"
    )
    .eq("reporte_id", reporteId);

  // Fetch materials
  const { data: materials } = await supabase
    .from("reporte_materiales")
    .select("id, reporte_id, cantidad, unidad, descripcion")
    .eq("reporte_id", reporteId);

  // Fetch available equipment for the branch
  const sucursalId = typedReport.sucursal_id;
  const { data: availableEquipment } = await supabase
    .from("equipos")
    .select("*")
    .eq("sucursal_id", sucursalId)
    .order("numero_etiqueta");

  // Fetch tipos_equipo for the add-equipment modal
  const { data: tiposEquipo } = await supabase
    .from("tipos_equipo")
    .select("*")
    .order("is_system", { ascending: false })
    .order("nombre", { ascending: true });

  // Fetch team members
  const folioId = typedReport.folio_id;
  const { data: asignados } = await supabase
    .from("folio_asignados")
    .select("usuario_id, users(nombre, rol)")
    .eq("folio_id", folioId);

  const teamMembers = (asignados ?? []).map((a) => {
    const user = a.users as unknown as { nombre: string; rol: string } | null;
    return {
      nombre: user?.nombre ?? "Sin nombre",
      rol: user?.rol ?? "tecnico",
    };
  });

  const folio = typedReport.folios;
  const isCompleted = typedReport.estatus === "completado";

  return (
    <ReportForm
      reporteId={reporteId}
      folioNumero={folio?.numero_folio ?? ""}
      folioDescripcion={folio?.descripcion_problema ?? ""}
      sucursalNombre={
        folio?.sucursales
          ? `${folio.sucursales.nombre} (${folio.sucursales.numero})`
          : ""
      }
      sucursalId={sucursalId}
      clienteNombre={folio?.clientes?.nombre ?? ""}
      initialEntries={
        (entries as unknown as (ReporteEquipo & { equipos: Equipo & { tipos_equipo?: { slug: string; nombre: string } | null } })[]) ?? []
      }
      initialMaterials={(materials as ReporteMaterial[]) ?? []}
      availableEquipment={(availableEquipment as Equipo[]) ?? []}
      tiposEquipo={(tiposEquipo as TipoEquipo[]) ?? []}
      teamMembers={teamMembers}
      currentStatus={typedReport.estatus}
      isCompleted={isCompleted}
    />
  );
}
