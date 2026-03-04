import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { updatePlantillaPaso } from "@/app/actions/mantenimientos-preventivos";
import { PlantillaForm } from "../../plantilla-form";
import type { PlantillaPaso, TipoEquipo } from "@/types";

export default async function EditarMantenimientoPreventivoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: plantilla }, { data: tipos }] = await Promise.all([
    supabase.from("plantillas_pasos").select("*").eq("id", id).single(),
    supabase.from("tipos_equipo").select("*").order("nombre", { ascending: true }),
  ]);

  if (!plantilla) notFound();

  const updateWithId = updatePlantillaPaso.bind(null, id);

  return (
    <PlantillaForm
      action={updateWithId}
      tipos={(tipos as TipoEquipo[] | null) ?? []}
      plantilla={plantilla as PlantillaPaso}
      submitLabel="Guardar Cambios"
    />
  );
}
