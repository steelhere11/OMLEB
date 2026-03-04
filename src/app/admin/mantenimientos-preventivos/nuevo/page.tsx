import { createClient } from "@/lib/supabase/server";
import { createPlantillaPaso } from "@/app/actions/mantenimientos-preventivos";
import { PlantillaForm } from "../plantilla-form";
import type { TipoEquipo } from "@/types";

export default async function NuevoMantenimientoPreventivoPage() {
  const supabase = await createClient();
  const { data: tipos } = await supabase
    .from("tipos_equipo")
    .select("*")
    .order("nombre", { ascending: true });

  return (
    <PlantillaForm
      action={createPlantillaPaso}
      tipos={(tipos as TipoEquipo[] | null) ?? []}
      submitLabel="Crear Paso Preventivo"
    />
  );
}
