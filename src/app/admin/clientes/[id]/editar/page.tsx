import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Cliente } from "@/types";
import { EditClienteForm } from "./edit-form";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single();

  if (!cliente) notFound();

  return <EditClienteForm cliente={cliente as Cliente} />;
}
