import { createClient } from "@/lib/supabase/server";
import type { Cliente } from "@/types";
import { CreateSucursalForm } from "./create-form";

export default async function NuevaSucursalPage() {
  const supabase = await createClient();

  const { data: clientes } = await supabase
    .from("clientes")
    .select("*")
    .order("nombre");

  return (
    <CreateSucursalForm clientes={(clientes as Cliente[] | null) ?? []} />
  );
}
