import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { Cliente } from "@/types";

export default async function ClientesPage() {
  const supabase = await createClient();

  const { data: clientes } = await supabase
    .from("clientes")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (clientes as Cliente[] | null) ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-[-0.025em] text-text-0">
          Clientes
        </h1>
        <Link
          href="/admin/clientes/nuevo"
          className="inline-flex items-center gap-1.5 rounded-[6px] border border-admin-border px-3 py-1.5 text-[13px] font-medium text-text-1 transition-colors duration-[80ms] hover:bg-admin-surface-hover"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Crear Cliente
        </Link>
      </div>

      {/* Client List */}
      {list.length === 0 ? (
        <div className="rounded-[10px] border border-admin-border bg-admin-surface py-28 text-center">
          <p className="text-[13px] text-text-3">No hay clientes registrados</p>
          <Link
            href="/admin/clientes/nuevo"
            className="mt-3 inline-block text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
          >
            Crear primer cliente →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-admin-border bg-admin-surface">
          {/* Header row */}
          <div className="flex items-center border-b border-admin-border-subtle px-[14px] py-[10px] text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
            <div className="w-[56px]">Logo</div>
            <div className="flex-1">Nombre</div>
            <div className="w-[140px]">Fecha</div>
            <div className="w-[100px] text-right">Acciones</div>
          </div>

          {/* Data rows */}
          {list.map((cliente, i) => (
            <div
              key={cliente.id}
              className={`flex items-center px-[14px] py-[9px] transition-colors duration-[80ms] hover:bg-admin-surface-hover${i > 0 ? " row-inset-divider" : ""}`}
            >
              <div className="w-[56px]">
                {cliente.logo_url ? (
                  <Image
                    src={cliente.logo_url}
                    alt={`Logo de ${cliente.nombre}`}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-[6px] object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-admin-surface-elevated text-[10px] text-text-3">
                    —
                  </div>
                )}
              </div>
              <div className="flex-1 text-[13px] font-medium text-text-0">
                {cliente.nombre}
              </div>
              <div className="w-[140px] font-mono text-[13px] text-text-2">
                {new Date(cliente.created_at).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
              <div className="w-[100px] text-right">
                <Link
                  href={`/admin/clientes/${cliente.id}/editar`}
                  className="text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
                >
                  Editar →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
