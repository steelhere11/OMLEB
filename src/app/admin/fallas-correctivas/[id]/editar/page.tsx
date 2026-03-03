import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { updateFallaCorrectiva } from "@/app/actions/fallas-correctivas";
import { FallaForm } from "../../falla-form";
import type { FallaCorrectiva, TipoEquipo } from "@/types";

export default async function EditarFallaCorrectivaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: falla }, { data: tipos }] = await Promise.all([
    supabase.from("fallas_correctivas").select("*").eq("id", id).single(),
    supabase.from("tipos_equipo").select("*").order("nombre", { ascending: true }),
  ]);

  if (!falla) notFound();

  const updateWithId = updateFallaCorrectiva.bind(null, id);

  return (
    <FallaForm
      action={updateWithId}
      tipos={(tipos as TipoEquipo[] | null) ?? []}
      falla={falla as FallaCorrectiva}
      submitLabel="Guardar Cambios"
    />
  );
}
