import { createClient } from "@/lib/supabase/server";
import { ReportForm } from "./report-form";
import type { ReporteEstatus, ReporteEquipo, Equipo, ReporteMaterial, TipoEquipo, ReporteFoto } from "@/types";

type ReportWithRelations = {
  id: string;
  folio_id: string;
  fecha: string;
  estatus: ReporteEstatus;
  sucursal_id: string;
  llegada_completada: boolean;
  sitio_completado: boolean;
  folios: {
    numero_folio: string;
    descripcion_problema: string;
    sucursal_id: string;
    sucursales: { nombre: string; numero: string } | null;
    clientes: { nombre: string } | null;
  } | null;
};

export type RegistrationEntry = {
  reporteEquipoId: string;
  equipo: Equipo;
  tipoEquipoNombre: string | null;
  existingPhotos: {
    equipo_general: ReporteFoto | null;
    placa: ReporteFoto | null;
  };
  isComplete: boolean;
};

export default async function ReportePage({
  params,
}: {
  params: Promise<{ reporteId: string }>;
}) {
  const { reporteId } = await params;
  const supabase = await createClient();

  // Fetch the report with folio details + gating fields
  const { data: report } = await supabase
    .from("reportes")
    .select(
      "id, folio_id, fecha, estatus, sucursal_id, llegada_completada, sitio_completado, folios(numero_folio, descripcion_problema, sucursal_id, sucursales(nombre, numero), clientes(nombre))"
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

  // Fetch equipment entries with equipment details, tipo_equipo join, and registration status
  const { data: entries } = await supabase
    .from("reporte_equipos")
    .select(
      "id, reporte_id, equipo_id, tipo_trabajo, diagnostico, trabajo_realizado, observaciones, registro_completado, equipos(id, sucursal_id, numero_etiqueta, marca, modelo, numero_serie, tipo_equipo, tipo_equipo_id, agregado_por, revisado, capacidad, refrigerante, voltaje, fase, ubicacion, created_at, updated_at, tipos_equipo:tipo_equipo_id(slug, nombre))"
    )
    .eq("reporte_id", reporteId);

  // Fetch materials
  const { data: materials } = await supabase
    .from("reporte_materiales")
    .select("id, reporte_id, cantidad, unidad, descripcion")
    .eq("reporte_id", reporteId);

  const sucursalId = typedReport.sucursal_id;
  const folioId = typedReport.folio_id;

  // Fetch folio-scoped equipment via join table
  const { data: folioEquipos } = await supabase
    .from("folio_equipos")
    .select("equipo_id, equipos(*)")
    .eq("folio_id", folioId);

  const availableEquipment = (folioEquipos ?? [])
    .map((fe) => (fe as unknown as { equipo_id: string; equipos: Equipo | null }).equipos)
    .filter(Boolean) as Equipo[];

  // Fetch tipos_equipo for the add-equipment modal
  const { data: tiposEquipo } = await supabase
    .from("tipos_equipo")
    .select("*")
    .order("is_system", { ascending: false })
    .order("nombre", { ascending: true });

  // Fetch team members
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

  // --- Registration data fetching ---

  // Fetch existing arrival photo for this report
  const { data: arrivalPhoto } = await supabase
    .from("reporte_fotos")
    .select("url, metadata_fecha, metadata_gps")
    .eq("reporte_id", reporteId)
    .eq("etiqueta", "llegada")
    .limit(1)
    .maybeSingle();

  // Fetch existing site photo for this report
  const { data: sitePhoto } = await supabase
    .from("reporte_fotos")
    .select("url, metadata_fecha, metadata_gps")
    .eq("reporte_id", reporteId)
    .eq("etiqueta", "sitio")
    .limit(1)
    .maybeSingle();

  // Fetch existing folio-level site photo from ANY report for this folio
  // Step 1: Get all report IDs for this folio
  const { data: folioReports } = await supabase
    .from("reportes")
    .select("id")
    .eq("folio_id", folioId);

  const folioReportIds = (folioReports ?? []).map((r) => r.id);

  let existingFolioSitePhoto: { url: string } | null = null;
  if (folioReportIds.length > 0) {
    const { data: folioSitePhoto } = await supabase
      .from("reporte_fotos")
      .select("url")
      .in("reporte_id", folioReportIds)
      .eq("etiqueta", "sitio")
      .limit(1)
      .maybeSingle();

    existingFolioSitePhoto = folioSitePhoto;
  }

  // Fetch registration photos per equipment (equipo_general + placa)
  // Includes cross-folio photos: photos from any report for this folio's equipment
  const equipoIds = (entries ?? []).map(
    (e) => (e as unknown as { equipo_id: string }).equipo_id
  );

  let registrationPhotos: ReporteFoto[] = [];
  if (equipoIds.length > 0 && folioReportIds.length > 0) {
    const { data: regPhotos } = await supabase
      .from("reporte_fotos")
      .select("id, reporte_id, equipo_id, reporte_paso_id, url, etiqueta, tipo_media, metadata_gps, metadata_fecha, created_at")
      .in("reporte_id", folioReportIds)
      .in("equipo_id", equipoIds)
      .in("etiqueta", ["equipo_general", "placa"]);

    registrationPhotos = (regPhotos as ReporteFoto[]) ?? [];
  }

  // Build registration entries data structure
  const typedEntries = (entries as unknown as (ReporteEquipo & {
    equipos: Equipo & { tipos_equipo?: { slug: string; nombre: string } | null };
    registro_completado: boolean;
  })[]) ?? [];

  const registrationEntries: RegistrationEntry[] = typedEntries.map((entry) => {
    const equipoPhotos = registrationPhotos.filter(
      (p) => p.equipo_id === entry.equipo_id
    );

    return {
      reporteEquipoId: entry.id,
      equipo: entry.equipos,
      tipoEquipoNombre: entry.equipos?.tipos_equipo?.nombre ?? null,
      existingPhotos: {
        equipo_general:
          equipoPhotos.find((p) => p.etiqueta === "equipo_general") ?? null,
        placa: equipoPhotos.find((p) => p.etiqueta === "placa") ?? null,
      },
      isComplete: entry.registro_completado,
    };
  });

  const folio = typedReport.folios;
  const isCompleted = typedReport.estatus === "completado";

  return (
    <ReportForm
      reporteId={reporteId}
      folioId={folioId}
      folioNumero={folio?.numero_folio ?? ""}
      folioDescripcion={folio?.descripcion_problema ?? ""}
      sucursalNombre={
        folio?.sucursales
          ? `${folio.sucursales.nombre} (${folio.sucursales.numero})`
          : ""
      }
      sucursalId={sucursalId}
      clienteNombre={folio?.clientes?.nombre ?? ""}
      initialEntries={typedEntries}
      initialMaterials={(materials as ReporteMaterial[]) ?? []}
      availableEquipment={(availableEquipment as Equipo[]) ?? []}
      tiposEquipo={(tiposEquipo as TipoEquipo[]) ?? []}
      teamMembers={teamMembers}
      currentStatus={typedReport.estatus}
      isCompleted={isCompleted}
      llegadaCompletada={typedReport.llegada_completada}
      sitioCompletado={typedReport.sitio_completado}
      arrivalPhoto={
        arrivalPhoto
          ? {
              url: arrivalPhoto.url,
              metadata_fecha: arrivalPhoto.metadata_fecha,
              metadata_gps: arrivalPhoto.metadata_gps,
            }
          : null
      }
      sitePhoto={
        sitePhoto
          ? {
              url: sitePhoto.url,
              metadata_fecha: sitePhoto.metadata_fecha,
              metadata_gps: sitePhoto.metadata_gps,
            }
          : null
      }
      existingFolioSitePhoto={existingFolioSitePhoto}
      registrationEntries={registrationEntries}
    />
  );
}
