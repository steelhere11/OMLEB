import { getAllPendientes } from "@/app/actions/materiales-requeridos";
import { PendientesView } from "./pendientes-view";

export default async function PendientesPage() {
  const pendientes = await getAllPendientes();

  return (
    <div className="mx-auto max-w-4xl">
      <PendientesView initialPendientes={pendientes} />
    </div>
  );
}
