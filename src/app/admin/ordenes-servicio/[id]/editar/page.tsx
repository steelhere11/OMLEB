import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OrdenServicio, Sucursal, Cliente, User, Equipo, TipoEquipo } from "@/types";
import { EditOrdenForm } from "./edit-form";

type OrdenWithAssignments = OrdenServicio & {
  orden_asignados: { usuario_id: string }[];
  orden_equipos: { equipo_id: string }[];
};

export default async function EditarOrdenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch orden with its current assignments and equipment
  const { data: orden } = await supabase
    .from("ordenes_servicio")
    .select("*, orden_asignados(usuario_id), orden_equipos(equipo_id)")
    .eq("id", id)
    .single();

  if (!orden) notFound();

  const typedOrden = orden as OrdenWithAssignments;

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
        .eq("sucursal_id", typedOrden.sucursal_id)
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
  const currentAssignmentIds = typedOrden.orden_asignados.map(
    (a) => a.usuario_id
  );
  const currentEquipoIds = typedOrden.orden_equipos.map(
    (e) => e.equipo_id
  );

  return (
    <EditOrdenForm
      orden={typedOrden}
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
