import { createClient } from "@/lib/supabase/server";
import type { TipoEquipo } from "@/types";
import { CreateEquipoForm } from "./create-form";

export default async function NuevoEquipoPage({
  params,
}: {
  params: Promise<{ sucursalId: string }>;
}) {
  const { sucursalId } = await params;
  const supabase = await createClient();

  const { data: tiposEquipo } = await supabase
    .from("tipos_equipo")
    .select("*")
    .order("is_system", { ascending: false })
    .order("nombre", { ascending: true });

  return (
    <CreateEquipoForm
      sucursalId={sucursalId}
      tiposEquipo={(tiposEquipo as TipoEquipo[] | null) ?? []}
    />
  );
}
