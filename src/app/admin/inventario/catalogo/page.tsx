import { getCatalogo } from "@/app/actions/catalogo";
import { CatalogoManager } from "./catalogo-manager";

export default async function CatalogoPage() {
  const catalogo = await getCatalogo(undefined, true);

  return (
    <div className="mx-auto max-w-4xl">
      <CatalogoManager initialCatalogo={catalogo} />
    </div>
  );
}
