import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ReorderableList } from "./reorderable-list";
import type { PlantillaPaso, TipoEquipo } from "@/types";

export default async function MantenimientosPreventivosPage() {
  const supabase = await createClient();

  const [{ data: pasos }, { data: tipos }] = await Promise.all([
    supabase
      .from("plantillas_pasos")
      .select("*")
      .eq("tipo_mantenimiento", "preventivo")
      .order("tipo_equipo_slug", { ascending: true })
      .order("orden", { ascending: true }),
    supabase
      .from("tipos_equipo")
      .select("*")
      .order("nombre", { ascending: true }),
  ]);

  const list = (pasos as PlantillaPaso[] | null) ?? [];
  const tiposList = (tipos as TipoEquipo[] | null) ?? [];
  const tiposMap = Object.fromEntries(tiposList.map((t) => [t.slug, t.nombre]));

  // Group by tipo_equipo_slug
  const grouped: Record<string, PlantillaPaso[]> = {};
  for (const paso of list) {
    const key = paso.tipo_equipo_slug;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(paso);
  }

  const slugOrder = Object.keys(grouped).sort((a, b) =>
    (tiposMap[a] ?? a).localeCompare(tiposMap[b] ?? b)
  );

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.025em] text-text-0">
            Mantenimientos Preventivos
          </h1>
          <p className="mt-1 text-[13px] text-text-2">
            Pasos predefinidos para mantenimiento preventivo
          </p>
        </div>
        <Link
          href="/admin/mantenimientos-preventivos/nuevo"
          className="inline-flex items-center gap-1.5 rounded-[6px] border border-admin-border px-3 py-1.5 text-[13px] font-medium text-text-1 transition-colors duration-[80ms] hover:bg-admin-surface-hover"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Agregar Paso
        </Link>
      </div>

      {/* Content */}
      {list.length === 0 ? (
        <div className="rounded-[10px] border border-admin-border bg-admin-surface py-28 text-center">
          <p className="text-[13px] text-text-3">No hay pasos preventivos registrados</p>
          <Link
            href="/admin/mantenimientos-preventivos/nuevo"
            className="mt-3 inline-block text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
          >
            Crear primer paso →
          </Link>
        </div>
      ) : (
        <ReorderableList
          grouped={grouped}
          slugOrder={slugOrder}
          tiposMap={tiposMap}
        />
      )}
    </div>
  );
}
