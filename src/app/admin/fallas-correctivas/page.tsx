import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteFallaCorrectiva } from "@/app/actions/fallas-correctivas";
import type { FallaCorrectiva, TipoEquipo } from "@/types";

export default async function FallasCorrectivasPage() {
  const supabase = await createClient();

  const [{ data: fallas }, { data: tipos }] = await Promise.all([
    supabase
      .from("fallas_correctivas")
      .select("*")
      .order("tipo_equipo_slug", { ascending: true })
      .order("nombre", { ascending: true }),
    supabase
      .from("tipos_equipo")
      .select("*")
      .order("nombre", { ascending: true }),
  ]);

  const list = (fallas as FallaCorrectiva[] | null) ?? [];
  const tiposList = (tipos as TipoEquipo[] | null) ?? [];
  const tiposMap = Object.fromEntries(tiposList.map((t) => [t.slug, t.nombre]));

  // Group by tipo_equipo_slug
  const grouped: Record<string, FallaCorrectiva[]> = {};
  for (const falla of list) {
    const key = falla.tipo_equipo_slug;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(falla);
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
            Fallas Correctivas
          </h1>
          <p className="mt-1 text-[13px] text-text-2">
            Pasos predefinidos para mantenimiento correctivo
          </p>
        </div>
        <Link
          href="/admin/fallas-correctivas/nuevo"
          className="inline-flex items-center gap-1.5 rounded-[6px] border border-admin-border px-3 py-1.5 text-[13px] font-medium text-text-1 transition-colors duration-[80ms] hover:bg-admin-surface-hover"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Agregar Falla
        </Link>
      </div>

      {/* Content */}
      {list.length === 0 ? (
        <div className="rounded-[10px] border border-admin-border bg-admin-surface py-28 text-center">
          <p className="text-[13px] text-text-3">No hay fallas correctivas registradas</p>
          <Link
            href="/admin/fallas-correctivas/nuevo"
            className="mt-3 inline-block text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
          >
            Crear primera falla →
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
                  <div className="flex-1">Nombre</div>
                  <div className="hidden w-[260px] sm:block">Diagnostico</div>
                  <div className="w-[120px] text-right">Acciones</div>
                </div>

                {/* Data rows */}
                {grouped[slug].map((falla, i) => (
                  <div
                    key={falla.id}
                    className={`flex items-center px-[14px] py-[9px] transition-colors duration-[80ms] hover:bg-admin-surface-hover${i > 0 ? " row-inset-divider" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-text-0">
                        {falla.nombre}
                      </p>
                      {/* Show evidence count + materials count as subtle badges */}
                      <div className="mt-0.5 flex gap-2">
                        {falla.evidencia_requerida.length > 0 && (
                          <span className="text-[11px] text-text-3">
                            {falla.evidencia_requerida.length} evidencia{falla.evidencia_requerida.length !== 1 ? "s" : ""}
                          </span>
                        )}
                        {falla.materiales_tipicos.length > 0 && (
                          <span className="text-[11px] text-text-3">
                            {falla.materiales_tipicos.length} material{falla.materiales_tipicos.length !== 1 ? "es" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="hidden w-[260px] sm:block">
                      <p className="line-clamp-2 text-[13px] text-text-2">
                        {falla.diagnostico}
                      </p>
                    </div>
                    <div className="flex w-[120px] items-center justify-end gap-3">
                      <Link
                        href={`/admin/fallas-correctivas/${falla.id}/editar`}
                        className="text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
                      >
                        Editar
                      </Link>
                      <DeleteButton
                        id={falla.id}
                        action={deleteFallaCorrectiva}
                        confirmMessage="¿Eliminar esta falla correctiva?"
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
