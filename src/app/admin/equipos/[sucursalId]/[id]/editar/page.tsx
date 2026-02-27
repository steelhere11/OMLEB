import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Equipo } from "@/types";
import { EditEquipoForm } from "./edit-form";

export default async function EditarEquipoPage({
  params,
}: {
  params: Promise<{ sucursalId: string; id: string }>;
}) {
  const { sucursalId, id } = await params;
  const supabase = await createClient();

  const { data: equipo } = await supabase
    .from("equipos")
    .select("*")
    .eq("id", id)
    .single();

  if (!equipo) notFound();

  return (
    <EditEquipoForm equipo={equipo as Equipo} sucursalId={sucursalId} />
  );
}
