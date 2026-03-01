import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Equipo, TipoEquipo } from "@/types";
import { EditEquipoForm } from "./edit-form";

export default async function EditarEquipoPage({
  params,
}: {
  params: Promise<{ sucursalId: string; id: string }>;
}) {
  const { sucursalId, id } = await params;
  const supabase = await createClient();

  const [equipoRes, tiposRes] = await Promise.all([
    supabase.from("equipos").select("*").eq("id", id).single(),
    supabase
      .from("tipos_equipo")
      .select("*")
      .order("is_system", { ascending: false })
      .order("nombre", { ascending: true }),
  ]);

  if (!equipoRes.data) notFound();

  return (
    <EditEquipoForm
      equipo={equipoRes.data as Equipo}
      sucursalId={sucursalId}
      tiposEquipo={(tiposRes.data as TipoEquipo[] | null) ?? []}
    />
  );
}
