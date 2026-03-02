import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ReportDetail } from "./report-detail";

export default async function ReporteDetailPage({
  params,
}: {
  params: Promise<{ reporteId: string }>;
}) {
  const { reporteId } = await params;
  const supabase = await createClient();

  // Fetch complete report with all related data
  const { data: reporte } = await supabase
    .from("reportes")
    .select(
      `
      *,
      folios(*, clientes(nombre, logo_url)),
      sucursales(nombre, numero, direccion),
      users:creado_por(nombre, rol),
      reporte_equipos(
        *,
        equipos(id, numero_etiqueta, marca, modelo, numero_serie, tipo_equipo, tipo_equipo_id, capacidad, refrigerante, voltaje, fase, ubicacion),
        reporte_pasos(*, plantillas_pasos(nombre, procedimiento, lecturas_requeridas), fallas_correctivas(nombre, diagnostico))
      ),
      reporte_fotos(*),
      reporte_materiales(*)
    `
    )
    .eq("id", reporteId)
    .single();

  if (!reporte) {
    return (
      <div className="mx-auto max-w-4xl">
        <Link
          href="/admin/reportes"
          className="mb-4 inline-flex items-center gap-1 text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
        >
          ← Reportes
        </Link>
        <div className="rounded-[10px] border border-admin-border bg-admin-surface py-28 text-center">
          <p className="text-[15px] font-medium text-text-1">
            Reporte no encontrado
          </p>
          <Link
            href="/admin/reportes"
            className="mt-3 inline-block text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
          >
            Volver a la lista →
          </Link>
        </div>
      </div>
    );
  }

  // Fetch team members and tipos_equipo in parallel
  const [{ data: asignados }, { data: tiposEquipo }] = await Promise.all([
    supabase
      .from("folio_asignados")
      .select("usuario_id, users(nombre, rol)")
      .eq("folio_id", reporte.folio_id),
    supabase
      .from("tipos_equipo")
      .select("id, slug, nombre, is_system, created_at")
      .order("nombre"),
  ]);

  const teamMembers =
    (asignados as { usuario_id: string; users: { nombre: string; rol: string } | null }[] | null) ??
    [];

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/reportes"
        className="mb-4 inline-flex items-center gap-1 text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
      >
        ← Reportes
      </Link>

      <ReportDetail reporte={reporte} teamMembers={teamMembers} tiposEquipo={tiposEquipo ?? []} />
    </div>
  );
}
