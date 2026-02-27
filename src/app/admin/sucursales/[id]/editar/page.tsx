import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Sucursal } from "@/types";
import { EditSucursalForm } from "./edit-form";

export default async function EditarSucursalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: sucursal } = await supabase
    .from("sucursales")
    .select("*")
    .eq("id", id)
    .single();

  if (!sucursal) notFound();

  return <EditSucursalForm sucursal={sucursal as Sucursal} />;
}
