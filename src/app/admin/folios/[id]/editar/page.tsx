import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Folio, Sucursal, Cliente, User } from "@/types";
import { EditFolioForm } from "./edit-form";

type FolioWithAssignments = Folio & {
  folio_asignados: { usuario_id: string }[];
};

export default async function EditarFolioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch folio with its current assignments
  const { data: folio } = await supabase
    .from("folios")
    .select("*, folio_asignados(usuario_id)")
    .eq("id", id)
    .single();

  if (!folio) notFound();

  const typedFolio = folio as FolioWithAssignments;

  // Fetch branches, clients, and users in parallel
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
  const currentAssignmentIds = typedFolio.folio_asignados.map(
    (a) => a.usuario_id
  );

  return (
    <EditFolioForm
      folio={typedFolio}
      branches={branches}
      clientes={clientes}
      users={users}
      currentAssignmentIds={currentAssignmentIds}
    />
  );
}
