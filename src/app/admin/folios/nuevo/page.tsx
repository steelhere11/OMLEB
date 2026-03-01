import { createClient } from "@/lib/supabase/server";
import type { Sucursal, Cliente, User, TipoEquipo } from "@/types";
import { CreateFolioForm } from "./create-form";

export default async function NuevoFolioPage() {
  const supabase = await createClient();

  // Fetch branches, clients, users, and equipment types in parallel
  const [branchesRes, clientesRes, usersRes, tiposRes] = await Promise.all([
    supabase.from("sucursales").select("*").order("nombre"),
    supabase.from("clientes").select("*").order("nombre"),
    supabase
      .from("users")
      .select("*")
      .in("rol", ["tecnico", "ayudante"])
      .order("nombre"),
    supabase
      .from("tipos_equipo")
      .select("*")
      .order("is_system", { ascending: false })
      .order("nombre", { ascending: true }),
  ]);

  const branches = (branchesRes.data as Sucursal[] | null) ?? [];
  const clientes = (clientesRes.data as Cliente[] | null) ?? [];
  const users = (usersRes.data as User[] | null) ?? [];
  const tiposEquipo = (tiposRes.data as TipoEquipo[] | null) ?? [];

  return (
    <CreateFolioForm
      branches={branches}
      clientes={clientes}
      users={users}
      tiposEquipo={tiposEquipo}
    />
  );
}
