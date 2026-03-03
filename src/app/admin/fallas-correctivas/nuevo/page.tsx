import { createClient } from "@/lib/supabase/server";
import { createFallaCorrectiva } from "@/app/actions/fallas-correctivas";
import { FallaForm } from "../falla-form";
import type { TipoEquipo } from "@/types";

export default async function NuevaFallaCorrectivaPage() {
  const supabase = await createClient();
  const { data: tipos } = await supabase
    .from("tipos_equipo")
    .select("*")
    .order("nombre", { ascending: true });

  return (
    <FallaForm
      action={createFallaCorrectiva}
      tipos={(tipos as TipoEquipo[] | null) ?? []}
      submitLabel="Crear Falla Correctiva"
    />
  );
}
