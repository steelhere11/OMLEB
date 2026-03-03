import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateTodayReport } from "@/app/actions/reportes";

export default async function OrdenDetailPage({
  params,
}: {
  params: Promise<{ ordenId: string }>;
}) {
  const { ordenId } = await params;
  const supabase = await createClient();

  // Fetch orden details
  const { data: orden } = await supabase
    .from("ordenes_servicio")
    .select("*, sucursales(nombre, numero, direccion), clientes(nombre)")
    .eq("id", ordenId)
    .single();

  if (!orden) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-base font-medium text-gray-600">
          Orden de servicio no encontrada
        </p>
      </div>
    );
  }

  // Fetch team members
  const { data: asignados } = await supabase
    .from("orden_asignados")
    .select("usuario_id, users(nombre, rol)")
    .eq("orden_servicio_id", ordenId);

  const teamMembers = (asignados ?? []).map((a) => {
    const user = a.users as unknown as { nombre: string; rol: string } | null;
    return {
      nombre: user?.nombre ?? "Sin nombre",
      rol: user?.rol ?? "tecnico",
    };
  });

  // Get or create today's report and redirect
  const result = await getOrCreateTodayReport(ordenId);

  if ("error" in result) {
    const sucursal = orden.sucursales as {
      nombre: string;
      numero: string;
      direccion: string;
    } | null;
    const cliente = orden.clientes as { nombre: string } | null;

    return (
      <div className="space-y-4">
        {/* Orden header */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h1 className="text-lg font-bold text-gray-900">
            {orden.numero_orden}
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
