import { getCatalogo } from "@/app/actions/catalogo";
import { getMovimientos } from "@/app/actions/stock";
import { EntradasManager } from "./entradas-manager";

export default async function EntradasPage() {
  const catalogo = await getCatalogo();
  const entradas = await getMovimientos({ tipo: "entrada", limit: 50 });

  return (
    <div className="mx-auto max-w-4xl">
      <EntradasManager initialEntradas={entradas} catalogo={catalogo} />
    </div>
  );
}
