import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateTodayReport } from "@/app/actions/reportes";

export default async function FolioDetailPage({
  params,
}: {
  params: Promise<{ folioId: string }>;
}) {
  const { folioId } = await params;
  const supabase = await createClient();

  // Fetch folio details
  const { data: folio } = await supabase
    .from("folios")
    .select("*, sucursales(nombre, numero, direccion), clientes(nombre)")
    .eq("id", folioId)
    .single();

  if (!folio) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-base font-medium text-gray-600">
          Folio no encontrado
        </p>
      </div>
    );
  }

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

  // Get or create today's report and redirect
  const result = await getOrCreateTodayReport(folioId);

  if ("error" in result) {
    const sucursal = folio.sucursales as {
      nombre: string;
      numero: string;
      direccion: string;
    } | null;
    const cliente = folio.clientes as { nombre: string } | null;

    return (
      <div className="space-y-4">
        {/* Folio header */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h1 className="text-lg font-bold text-gray-900">
            {folio.numero_folio}
          </h1>
          {sucursal && (
            <p className="text-sm text-gray-600">
              {sucursal.nombre} ({sucursal.numero})
            </p>
          )}
          {cliente && (
            <p className="text-sm text-gray-500">{cliente.nombre}</p>
          )}
          {teamMembers.length > 0 && (
            <p className="mt-2 text-sm text-gray-500">
              Equipo: {teamMembers.map((m) => m.nombre).join(", ")}
            </p>
          )}
        </div>

        {/* Error message */}
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{result.error}</p>
        </div>
      </div>
    );
  }

  redirect(`/tecnico/reporte/${result.reporteId}`);
}
