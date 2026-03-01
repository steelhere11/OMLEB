import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Folio, Sucursal, Cliente, User, Equipo, TipoEquipo } from "@/types";
import { EditFolioForm } from "./edit-form";

type FolioWithAssignments = Folio & {
  folio_asignados: { usuario_id: string }[];
  folio_equipos: { equipo_id: string }[];
};

export default async function EditarFolioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch folio with its current assignments and equipment
  const { data: folio } = await supabase
    .from("folios")
    .select("*, folio_asignados(usuario_id), folio_equipos(equipo_id)")
    .eq("id", id)
    .single();

  if (!folio) notFound();

  const typedFolio = folio as FolioWithAssignments;

  // Fetch branches, clients, users, branch equipment, and tipos in parallel
  const [branchesRes, clientesRes, usersRes, equipmentRes, tiposRes] =
    await Promise.all([
      supabase.from("sucursales").select("*").order("nombre"),
      supabase.from("clientes").select("*").order("nombre"),
      supabase
        .from("users")
        .select("*")
        .in("rol", ["tecnico", "ayudante"])
        .order("nombre"),
      supabase
        .from("equipos")
        .select("*")
        .eq("sucursal_id", typedFolio.sucursal_id)
        .order("numero_etiqueta"),
      supabase
        .from("tipos_equipo")
        .select("*")
        .order("is_system", { ascending: false })
        .order("nombre", { ascending: true }),
    ]);

  const branches = (branchesRes.data as Sucursal[] | null) ?? [];
  const clientes = (clientesRes.data as Cliente[] | null) ?? [];
  const users = (usersRes.data as User[] | null) ?? [];
  const branchEquipment = (equipmentRes.data as Equipo[] | null) ?? [];
  const tiposEquipo = (tiposRes.data as TipoEquipo[] | null) ?? [];
  const currentAssignmentIds = typedFolio.folio_asignados.map(
    (a) => a.usuario_id
  );
  const currentEquipoIds = typedFolio.folio_equipos.map(
    (e) => e.equipo_id
  );

  return (
    <EditFolioForm
      folio={typedFolio}
      branches={branches}
      clientes={clientes}
      users={users}
      currentAssignmentIds={currentAssignmentIds}
      branchEquipment={branchEquipment}
      currentEquipoIds={currentEquipoIds}
      tiposEquipo={tiposEquipo}
    />
  );
}
