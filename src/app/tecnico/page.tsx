import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Folio, FolioEstatus, ReporteEstatus } from "@/types";

type FolioWithDetails = Folio & {
  sucursales: { nombre: string; numero: string; direccion: string } | null;
  clientes: { nombre: string } | null;
};

const folioStatusConfig: Record<
  FolioEstatus,
  { label: string; className: string }
> = {
  abierto: {
    label: "Abierto",
    className: "bg-blue-100 text-blue-700",
  },
  en_progreso: {
    label: "En Progreso",
    className: "bg-yellow-100 text-yellow-700",
  },
  en_espera: {
    label: "En Espera",
    className: "bg-orange-100 text-orange-700",
  },
  completado: {
    label: "Completado",
    className: "bg-green-100 text-green-700",
  },
};

const reportStatusConfig: Record<
  ReporteEstatus,
  { label: string; className: string }
> = {
  en_progreso: {
    label: "En Progreso",
    className: "bg-yellow-50 text-yellow-600",
  },
  en_espera: {
    label: "En Espera",
    className: "bg-orange-50 text-orange-600",
  },
  completado: {
    label: "Completado",
    className: "bg-green-50 text-green-600",
  },
};

export default async function TecnicoFoliosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // RLS ensures only assigned folios are returned
  const { data: folios } = await supabase
    .from("folios")
    .select("*, sucursales(nombre, numero, direccion), clientes(nombre)")
    .in("estatus", ["abierto", "en_progreso", "en_espera"])
    .order("created_at", { ascending: false });

  const list = (folios as FolioWithDetails[] | null) ?? [];

  // Check today's reports for each folio
  const today = new Date().toISOString().split("T")[0];
  const folioIds = list.map((f) => f.id);

  let reportByFolio = new Map<
    string,
    { id: string; folio_id: string; estatus: ReporteEstatus }
  >();

  if (folioIds.length > 0) {
    const { data: todayReports } = await supabase
      .from("reportes")
      .select("id, folio_id, estatus")
      .in("folio_id", folioIds)
      .eq("fecha", today);

    reportByFolio = new Map(
      (
        (todayReports as {
          id: string;
          folio_id: string;
          estatus: ReporteEstatus;
        }[]) ?? []
      ).map((r) => [r.folio_id, r])
    );
  }

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        {/* Empty state icon */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 11v.01M12 15v.01"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-xl font-bold text-gray-900">Mis Folios</h1>

        <p className="mb-2 text-base font-medium text-gray-600">
          No tienes folios asignados
        </p>

        <p className="max-w-xs text-sm text-gray-400">
          Los folios apareceran aqui cuando un administrador te asigne trabajo
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-gray-900">Mis Folios</h1>

      <div className="space-y-3">
        {list.map((folio) => {
          const todayReport = reportByFolio.get(folio.id);
          const folioStatus =
            folioStatusConfig[folio.estatus] ?? folioStatusConfig.abierto;

          return (
            <Link
              key={folio.id}
              href={`/tecnico/folios/${folio.id}`}
              className="block min-h-[72px] rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors active:bg-gray-50"
            >
              {/* Top row: folio number + status */}
              <div className="mb-2 flex items-center justify-between">
                <span className="text-base font-bold text-gray-900">
                  {folio.numero_folio}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${folioStatus.className}`}
                >
                  {folioStatus.label}
                </span>
              </div>

              {/* Branch info */}
              <p className="text-sm text-gray-600">
                {folio.sucursales
                  ? `${folio.sucursales.nombre} (${folio.sucursales.numero})`
                  : "Sin sucursal"}
              </p>

              {/* Client */}
              <p className="text-sm text-gray-500">
                {folio.clientes?.nombre ?? "Sin cliente"}
              </p>

              {/* Today's report indicator */}
              <div className="mt-2">
                {todayReport ? (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${reportStatusConfig[todayReport.estatus]?.className ?? ""}`}
                  >
                    Reporte de hoy: {reportStatusConfig[todayReport.estatus]?.label ?? todayReport.estatus}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                    Sin reporte hoy
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
