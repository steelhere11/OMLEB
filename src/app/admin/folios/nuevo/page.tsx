import { createClient } from "@/lib/supabase/server";
import type { Sucursal, Cliente, User } from "@/types";
import { CreateFolioForm } from "./create-form";

export default async function NuevoFolioPage() {
  const supabase = await createClient();

  // Fetch branches, clients, and users (tecnico + ayudante only) in parallel
  const [branchesRes, clientesRes, usersRes] = await Promise.all([
    supabase.from("sucursales").select("*").order("nombre"),
    supabase.from("clientes").select("*").order("nombre"),
    supabase
      .from("users")
      .select("*")
      .in("rol", ["tecnico", "ayudante"])
      .order("nombre"),
  ]);

  const branches = (branchesRes.data as Sucursal[] | null) ?? [];
  const clientes = (clientesRes.data as Cliente[] | null) ?? [];
  const users = (usersRes.data as User[] | null) ?? [];

  return (
    <CreateFolioForm
      branches={branches}
      clientes={clientes}
      users={users}
    />
  );
}
