import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/admin/delete-button";
import { deletePlantillaPaso } from "@/app/actions/mantenimientos-preventivos";
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
        <div className="space-y-6">
          {slugOrder.map((slug) => (
            <div key={slug}>
              {/* Group header */}
              <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-text-2">
                {tiposMap[slug] ?? slug}
              </h2>

              <div className="overflow-hidden rounded-[10px] border border-admin-border bg-admin-surface">
                {/* Header row */}
                <div className="flex items-center border-b border-admin-border-subtle px-[14px] py-[10px] text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
                  <div className="w-[50px]">Orden</div>
                  <div className="flex-1">Nombre</div>
                  <div className="hidden w-[260px] sm:block">Procedimiento</div>
                  <div className="w-[120px] text-right">Acciones</div>
                </div>

                {/* Data rows */}
                {grouped[slug].map((paso, i) => (
                  <div
                    key={paso.id}
                    className={`flex items-center px-[14px] py-[9px] transition-colors duration-[80ms] hover:bg-admin-surface-hover${i > 0 ? " row-inset-divider" : ""}`}
                  >
                    <div className="w-[50px]">
                      <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-[4px] bg-admin-surface-elevated px-1.5 text-[11px] font-semibold text-text-1">
                        {paso.orden}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-text-0">
                        {paso.nombre}
                        {!paso.es_obligatorio && (
                          <span className="ml-1.5 text-[11px] font-normal text-text-3">(opcional)</span>
                        )}
                      </p>
                      {/* Show evidence count + readings count as subtle badges */}
                      <div className="mt-0.5 flex gap-2">
                        {paso.evidencia_requerida.length > 0 && (
                          <span className="text-[11px] text-text-3">
                            {paso.evidencia_requerida.length} evidencia{paso.evidencia_requerida.length !== 1 ? "s" : ""}
                          </span>
                        )}
                        {paso.lecturas_requeridas.length > 0 && (
                          <span className="text-[11px] text-text-3">
                            {paso.lecturas_requeridas.length} lectura{paso.lecturas_requeridas.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="hidden w-[260px] sm:block">
                      <p className="line-clamp-2 text-[13px] text-text-2">
                        {paso.procedimiento}
                      </p>
                    </div>
                    <div className="flex w-[120px] items-center justify-end gap-3">
                      <Link
                        href={`/admin/mantenimientos-preventivos/${paso.id}/editar`}
                        className="text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
                      >
                        Editar
                      </Link>
                      <DeleteButton
                        id={paso.id}
                        action={deletePlantillaPaso}
                        confirmMessage="¿Eliminar este paso preventivo?"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
