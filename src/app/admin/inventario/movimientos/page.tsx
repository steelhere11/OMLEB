import { getCatalogo } from "@/app/actions/catalogo";
import { getMovimientos } from "@/app/actions/stock";
import { getCuadrillas } from "@/app/actions/cuadrillas";
import { MovimientosManager } from "./movimientos-manager";

export default async function MovimientosPage() {
  const catalogo = await getCatalogo();
  const cuadrillas = await getCuadrillas();
  const movimientos = await getMovimientos({ limit: 100 });

  return (
    <div className="mx-auto max-w-5xl">
      <MovimientosManager
        initialMovimientos={movimientos}
        catalogo={catalogo}
        cuadrillas={cuadrillas}
      />
    </div>
  );
}
