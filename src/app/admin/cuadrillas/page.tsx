import { createClient } from "@/lib/supabase/server";
import { CuadrillasManager } from "./cuadrillas-manager";

export default async function CuadrillasPage() {
  const supabase = await createClient();

  // Fetch cuadrillas with member count
  const { data: cuadrillas } = await supabase
    .from("cuadrillas")
    .select("*, cuadrilla_miembros(id, usuario_id)")
    .order("nombre");

  // Fetch all tech/helper users for the member picker
  const { data: users } = await supabase
    .from("users")
    .select("id, nombre, email, rol")
    .in("rol", ["tecnico", "ayudante"])
    .order("nombre");

  return (
    <div className="mx-auto max-w-4xl">
      <CuadrillasManager
        initialCuadrillas={cuadrillas ?? []}
        availableUsers={users ?? []}
      />
    </div>
  );
}
