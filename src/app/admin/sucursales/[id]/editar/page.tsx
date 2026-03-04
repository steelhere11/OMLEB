import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Sucursal, Cliente } from "@/types";
import { EditSucursalForm } from "./edit-form";

export default async function EditarSucursalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [sucursalRes, clientesRes] = await Promise.all([
    supabase.from("sucursales").select("*").eq("id", id).single(),
    supabase.from("clientes").select("*").order("nombre"),
  ]);

  if (!sucursalRes.data) notFound();

  return (
    <EditSucursalForm
      sucursal={sucursalRes.data as Sucursal}
      clientes={(clientesRes.data as Cliente[] | null) ?? []}
    />
  );
}
