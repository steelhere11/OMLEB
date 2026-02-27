import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Sucursal } from "@/types";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteSucursal } from "@/app/actions/sucursales";

export default async function SucursalesPage() {
  const supabase = await createClient();

  const { data: sucursales } = await supabase
    .from("sucursales")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (sucursales as Sucursal[] | null) ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-[-0.025em] text-text-0">
          Sucursales
        </h1>
        <Link
          href="/admin/sucursales/nuevo"
          className="inline-flex items-center gap-1.5 rounded-[6px] border border-admin-border px-3 py-1.5 text-[13px] font-medium text-text-1 transition-colors duration-[80ms] hover:bg-admin-surface-hover"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Crear Sucursal
        </Link>
      </div>

      {/* Branch List */}
      {list.length === 0 ? (
        <div className="rounded-[10px] border border-admin-border bg-admin-surface py-28 text-center">
          <p className="text-[13px] text-text-3">No hay sucursales registradas</p>
          <Link
            href="/admin/sucursales/nuevo"
            className="mt-3 inline-block text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
          >
            Crear primera sucursal →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-admin-border bg-admin-surface">
          {/* Header row */}
          <div className="flex items-center border-b border-admin-border-subtle px-[14px] py-[10px] text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
            <div className="w-[200px]">Nombre</div>
            <div className="w-[100px]">Numero</div>
            <div className="flex-1">Direccion</div>
            <div className="w-[200px] text-right">Acciones</div>
          </div>

          {/* Data rows */}
          {list.map((sucursal, i) => (
            <div
              key={sucursal.id}
              className={`flex items-center px-[14px] py-[9px] transition-colors duration-[80ms] hover:bg-admin-surface-hover${i > 0 ? " row-inset-divider" : ""}`}
            >
              <div className="w-[200px] text-[13px] font-medium text-text-0">
                {sucursal.nombre}
              </div>
              <div className="w-[100px] font-mono text-[13px] text-text-1">
                {sucursal.numero}
              </div>
              <div className="flex-1 text-[13px] text-text-1">
                {sucursal.direccion}
              </div>
              <div className="flex w-[200px] items-center justify-end gap-3">
                <Link
                  href={`/admin/sucursales/${sucursal.id}/editar`}
                  className="text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
                >
                  Editar →
                </Link>
                <Link
                  href={`/admin/equipos/${sucursal.id}`}
                  className="text-[13px] font-medium text-text-2 transition-colors duration-[80ms] hover:text-text-0"
                >
                  Equipos
                </Link>
                <DeleteButton
                  id={sucursal.id}
                  action={deleteSucursal}
                  confirmMessage="Esta seguro de eliminar esta sucursal?"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
