import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ReportDetail } from "./report-detail";
import { getRevisionHistory } from "@/app/actions/admin-revisions";
import type { ReporteComentario } from "@/types";

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
      ordenes_servicio:orden_servicio_id(*, clientes(nombre, logo_url)),
      sucursales(nombre, numero, direccion),
      users:creado_por(nombre, rol),
      reporte_equipos(
        *,
        equipos(id, numero_etiqueta, marca, modelo, numero_serie, tipo_equipo, tipo_equipo_id, forma_factor, capacidad, refrigerante, voltaje, fase, ubicacion, tipos_equipo:tipo_equipo_id(slug, nombre)),
        reporte_pasos(*, plantillas_pasos(nombre, procedimiento, lecturas_requeridas, orden), fallas_correctivas(nombre, diagnostico))
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

  // Fetch team members, tipos_equipo, comments, revisions, required materials, and catalog in parallel
  const [{ data: asignados }, { data: tiposEquipo }, { data: comentarios }, revisions, { data: materialesRequeridos }, { data: catalogoData }] = await Promise.all([
    supabase
      .from("orden_asignados")
      .select("usuario_id, users(nombre, rol)")
      .eq("orden_servicio_id", reporte.orden_servicio_id),
    supabase
      .from("tipos_equipo")
      .select("id, slug, nombre, categoria, is_system, created_at")
      .order("categoria", { ascending: true, nullsFirst: false })
      .order("nombre"),
    supabase
      .from("reporte_comentarios")
      .select("*, users:autor_id(nombre)")
      .eq("reporte_id", reporteId)
      .order("created_at", { ascending: true }),
    getRevisionHistory(reporteId),
    supabase
      .from("materiales_requeridos")
      .select("*")
      .eq("reporte_id", reporteId)
      .order("created_at"),
    supabase
      .from("materiales_catalogo")
      .select("id, nombre, unidad_default")
      .eq("activo", true)
      .order("nombre"),
  ]);

  const teamMembers =
    (asignados as { usuario_id: string; users: { nombre: string; rol: string } | null }[] | null) ??
    [];

  // Flatten author name into comment objects
  type ComentarioRow = ReporteComentario & { users: { nombre: string } | null };
  const comments = ((comentarios ?? []) as ComentarioRow[]).map((c) => ({
    id: c.id,
    reporte_id: c.reporte_id,
    equipo_id: c.equipo_id,
    autor_id: c.autor_id,
    contenido: c.contenido,
    created_at: c.created_at,
    autor_nombre: c.users?.nombre ?? undefined,
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/reportes"
        className="mb-4 inline-flex items-center gap-1 text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
      >
        ← Reportes
      </Link>

      <ReportDetail
        reporte={reporte}
        teamMembers={teamMembers}
        tiposEquipo={tiposEquipo ?? []}
        comments={comments}
        revisions={revisions}
        materialesRequeridos={materialesRequeridos ?? []}
        catalogo={catalogoData ?? []}
      />
    </div>
  );
}
