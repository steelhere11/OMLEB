import Link from "next/link";
import { getStockDashboard } from "@/app/actions/stock";

export default async function InventarioDashboardPage() {
  const stockData = await getStockDashboard();

  const totalBodega = stockData.reduce((sum, s) => sum + s.stock_bodega, 0);
  const totalAsignado = stockData.reduce((sum, s) => sum + s.stock_asignado, 0);
  const totalUsado = stockData.reduce((sum, s) => sum + s.total_usado, 0);
  const gastoTotal = stockData.reduce((sum, s) => sum + s.gasto_total, 0);
  const alertCount = stockData.filter((s) => s.bajo_minimo).length;

  const subNav = [
    { label: "Dashboard", href: "/admin/inventario", active: true },
    { label: "Catalogo", href: "/admin/inventario/catalogo" },
    { label: "Entradas", href: "/admin/inventario/entradas" },
    { label: "Movimientos", href: "/admin/inventario/movimientos" },
    { label: "Pendientes", href: "/admin/inventario/pendientes" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-[22px] font-bold tracking-[-0.025em] text-text-0">
          Inventario
        </h1>
      </div>

      {/* Sub-nav */}
      <div className="mb-6 flex gap-1 rounded-[8px] border border-admin-border bg-admin-surface p-1">
        {subNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-[6px] px-3 py-1.5 text-[13px] font-medium transition-colors ${
              item.active
                ? "bg-admin-surface-elevated text-text-0"
                : "text-text-2 hover:text-text-1 hover:bg-admin-surface-hover"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-[10px] border border-admin-border bg-admin-surface p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
            En Bodega
          </p>
          <p className="mt-1 text-[20px] font-bold text-text-0">{totalBodega}</p>
        </div>
        <div className="rounded-[10px] border border-admin-border bg-admin-surface p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
            Asignado
          </p>
          <p className="mt-1 text-[20px] font-bold text-text-0">{totalAsignado}</p>
        </div>
        <div className="rounded-[10px] border border-admin-border bg-admin-surface p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
            Total Usado
          </p>
          <p className="mt-1 text-[20px] font-bold text-text-0">{totalUsado}</p>
        </div>
        <div className="rounded-[10px] border border-admin-border bg-admin-surface p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
            Gasto Total
          </p>
          <p className="mt-1 text-[20px] font-bold text-text-0">
            ${gastoTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Low stock alerts */}
      {alertCount > 0 && (
        <div className="mb-6 rounded-[10px] border border-status-warning/30 bg-status-warning/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-status-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-[13px] font-semibold text-status-warning">
              {alertCount} material{alertCount !== 1 ? "es" : ""} bajo stock minimo
            </span>
          </div>
          <div className="space-y-1">
            {stockData
              .filter((s) => s.bajo_minimo)
              .map((s) => (
                <p key={s.catalogo_id} className="text-[13px] text-text-1">
                  {s.nombre}: {s.stock_total} {s.unidad_default} (min: {s.stock_minimo})
                </p>
              ))}
          </div>
        </div>
      )}

      {/* Stock table */}
      {stockData.length === 0 ? (
        <div className="rounded-[10px] border border-admin-border bg-admin-surface py-28 text-center">
          <p className="text-[13px] text-text-3">No hay materiales en el catalogo</p>
          <Link
            href="/admin/inventario/catalogo"
            className="mt-3 inline-block text-[13px] font-medium text-accent transition-colors hover:text-text-0"
          >
            Ir al catalogo →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-admin-border bg-admin-surface">
          {/* Header row */}
          <div className="flex items-center border-b border-admin-border-subtle px-[14px] py-[10px] text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
            <div className="flex-1">Material</div>
            <div className="w-[80px] text-right">Bodega</div>
            <div className="w-[80px] text-right">Asignado</div>
            <div className="w-[80px] text-right">Total</div>
            <div className="w-[80px] text-right">Usado</div>
            <div className="w-[60px] text-right">Unidad</div>
          </div>

          {/* Data rows */}
          {stockData.map((s, i) => (
            <div
              key={s.catalogo_id}
              className={`flex items-center px-[14px] py-[9px] transition-colors hover:bg-admin-surface-hover${i > 0 ? " row-inset-divider" : ""}${s.bajo_minimo ? " bg-status-warning/5" : ""}`}
            >
              <div className="flex-1">
                <span className="text-[13px] font-medium text-text-0">
                  {s.nombre}
                </span>
                <span className="ml-1.5 text-[12px] text-text-2">
                  {s.categoria === "consumible" ? "C" : "P"}
                </span>
                {s.bajo_minimo && (
                  <span className="ml-1.5 inline-flex items-center rounded-full bg-status-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-status-warning">
                    Bajo
                  </span>
                )}
              </div>
              <div className="w-[80px] text-right text-[13px] text-text-1">
                {s.stock_bodega}
              </div>
              <div className="w-[80px] text-right text-[13px] text-text-1">
                {s.stock_asignado}
              </div>
              <div className="w-[80px] text-right text-[13px] font-medium text-text-0">
                {s.stock_total}
              </div>
              <div className="w-[80px] text-right text-[13px] text-text-2">
                {s.total_usado}
              </div>
              <div className="w-[60px] text-right text-[12px] text-text-2">
                {s.unidad_default}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
