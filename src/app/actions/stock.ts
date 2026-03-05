"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/actions";
import type { StockResumen, CuadrillaStock, StockFuente } from "@/types/inventory";

// ── Register Stock Entry (entrada) ──────────────────────────────────────

export async function registrarEntrada(data: {
  catalogo_id: string;
  cantidad: number;
  fuente: StockFuente;
  contratista_nombre?: string;
  costo_unitario?: number;
  costo_total?: number;
  numero_factura?: string;
  notas?: string;
}): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  if (!data.catalogo_id) return { error: "Material requerido" };
  if (!data.cantidad || data.cantidad <= 0) return { error: "La cantidad debe ser mayor a 0" };

  const { error } = await supabase.from("stock_movimientos").insert({
    catalogo_id: data.catalogo_id,
    tipo: "entrada",
    cantidad: data.cantidad,
    fuente: data.fuente,
    contratista_nombre: data.fuente === "contratista" ? data.contratista_nombre?.trim() || null : null,
    costo_unitario: data.fuente === "empresa" ? data.costo_unitario ?? null : null,
    costo_total: data.fuente === "empresa" ? data.costo_total ?? null : null,
    numero_factura: data.numero_factura?.trim() || null,
    notas: data.notas?.trim() || null,
    registrado_por: user.id,
  });

  if (error) {
    return { error: "Error al registrar entrada: " + error.message };
  }

  revalidatePath("/admin/inventario");
  return { success: true, message: "Entrada registrada" };
}

// ── Assign to Cuadrilla (asignacion) ────────────────────────────────────

export async function asignarACuadrilla(data: {
  catalogo_id: string;
  cuadrilla_id: string;
  cantidad: number;
  notas?: string;
}): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  if (!data.catalogo_id) return { error: "Material requerido" };
  if (!data.cuadrilla_id) return { error: "Cuadrilla requerida" };
  if (!data.cantidad || data.cantidad <= 0) return { error: "La cantidad debe ser mayor a 0" };

  const { error } = await supabase.from("stock_movimientos").insert({
    catalogo_id: data.catalogo_id,
    tipo: "asignacion",
    cantidad: data.cantidad,
    cuadrilla_id: data.cuadrilla_id,
    notas: data.notas?.trim() || null,
    registrado_por: user.id,
  });

  if (error) {
    return { error: "Error al asignar material: " + error.message };
  }

  revalidatePath("/admin/inventario");
  return { success: true, message: "Material asignado a cuadrilla" };
}

// ── Register Return (devolucion) ────────────────────────────────────────

export async function registrarDevolucion(data: {
  catalogo_id: string;
  cuadrilla_id: string;
  cantidad: number;
  notas?: string;
}): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  if (!data.catalogo_id) return { error: "Material requerido" };
  if (!data.cuadrilla_id) return { error: "Cuadrilla requerida" };
  if (!data.cantidad || data.cantidad <= 0) return { error: "La cantidad debe ser mayor a 0" };

  const { error } = await supabase.from("stock_movimientos").insert({
    catalogo_id: data.catalogo_id,
    tipo: "devolucion",
    cantidad: data.cantidad,
    cuadrilla_id: data.cuadrilla_id,
    notas: data.notas?.trim() || null,
    registrado_por: user.id,
  });

  if (error) {
    return { error: "Error al registrar devolucion: " + error.message };
  }

  revalidatePath("/admin/inventario");
  return { success: true, message: "Devolucion registrada" };
}

// ── Register Adjustment (ajuste) ────────────────────────────────────────

export async function registrarAjuste(data: {
  catalogo_id: string;
  cuadrilla_id?: string;
  cantidad: number; // can be negative for ajuste
  notas?: string;
}): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") {
    return { error: "No autorizado" };
  }

  if (!data.catalogo_id) return { error: "Material requerido" };
  if (data.cantidad === 0) return { error: "La cantidad no puede ser 0" };

  const { error } = await supabase.from("stock_movimientos").insert({
    catalogo_id: data.catalogo_id,
    tipo: "ajuste",
    cantidad: data.cantidad,
    cuadrilla_id: data.cuadrilla_id || null,
    notas: data.notas?.trim() || null,
    registrado_por: user.id,
  });

  if (error) {
    return { error: "Error al registrar ajuste: " + error.message };
  }

  revalidatePath("/admin/inventario");
  return { success: true, message: "Ajuste registrado" };
}

// ── Get Stock Dashboard (summary per material) ──────────────────────────

export async function getStockDashboard(): Promise<StockResumen[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") return [];

  // Get all catalog items
  const { data: catalogo } = await supabase
    .from("materiales_catalogo")
    .select("*")
    .order("categoria")
    .order("nombre");

  if (!catalogo || catalogo.length === 0) return [];

  // Get all movements
  const { data: movimientos } = await supabase
    .from("stock_movimientos")
    .select("catalogo_id, tipo, cantidad, fuente, costo_total, cuadrilla_id");

  if (!movimientos) {
    return catalogo.map((c) => ({
      catalogo_id: c.id,
      nombre: c.nombre,
      categoria: c.categoria,
      unidad_default: c.unidad_default,
      stock_minimo: c.stock_minimo,
      stock_bodega: 0,
      stock_asignado: 0,
      stock_total: 0,
      total_usado: 0,
      total_comprado: 0,
      gasto_total: 0,
      bajo_minimo: false,
    }));
  }

  // Calculate stock per material
  return catalogo.map((c) => {
    const matMovs = movimientos.filter((m) => m.catalogo_id === c.id);

    let entradas = 0;
    let asignaciones = 0;
    let devoluciones = 0;
    let usos = 0;
    let ajustesBodega = 0;
    let ajustesCuadrilla = 0;
    let totalComprado = 0;
    let gastoTotal = 0;

    for (const m of matMovs) {
      switch (m.tipo) {
        case "entrada":
          entradas += Number(m.cantidad);
          totalComprado += Number(m.cantidad);
          if (m.fuente === "empresa" && m.costo_total) {
            gastoTotal += Number(m.costo_total);
          }
          break;
        case "asignacion":
          asignaciones += Number(m.cantidad);
          break;
        case "devolucion":
          devoluciones += Number(m.cantidad);
          break;
        case "uso":
          usos += Number(m.cantidad);
          break;
        case "ajuste":
          if (m.cuadrilla_id) {
            ajustesCuadrilla += Number(m.cantidad);
          } else {
            ajustesBodega += Number(m.cantidad);
          }
          break;
      }
    }

    const stockBodega = entradas - asignaciones + devoluciones + ajustesBodega;
    const stockAsignado = asignaciones - usos - devoluciones + ajustesCuadrilla;
    const stockTotal = stockBodega + stockAsignado;

    return {
      catalogo_id: c.id,
      nombre: c.nombre,
      categoria: c.categoria,
      unidad_default: c.unidad_default,
      stock_minimo: c.stock_minimo,
      stock_bodega: stockBodega,
      stock_asignado: stockAsignado,
      stock_total: stockTotal,
      total_usado: usos,
      total_comprado: totalComprado,
      gasto_total: gastoTotal,
      bajo_minimo: stockTotal < c.stock_minimo && c.stock_minimo > 0,
    };
  });
}

// ── Get Stock per Cuadrilla ─────────────────────────────────────────────

export async function getStockCuadrilla(cuadrillaId?: string): Promise<CuadrillaStock[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") return [];

  let query = supabase
    .from("stock_movimientos")
    .select("catalogo_id, tipo, cantidad, cuadrilla_id, cuadrillas(nombre)")
    .not("cuadrilla_id", "is", null);

  if (cuadrillaId) {
    query = query.eq("cuadrilla_id", cuadrillaId);
  }

  const { data: movimientos } = await query;
  if (!movimientos) return [];

  // Aggregate by cuadrilla + material
  const map = new Map<string, CuadrillaStock>();

  for (const m of movimientos) {
    const key = `${m.cuadrilla_id}_${m.catalogo_id}`;
    if (!map.has(key)) {
      const cuadrilla = m.cuadrillas as unknown as { nombre: string } | null;
      map.set(key, {
        cuadrilla_id: m.cuadrilla_id!,
        cuadrilla_nombre: cuadrilla?.nombre ?? "",
        catalogo_id: m.catalogo_id,
        cantidad: 0,
      });
    }

    const entry = map.get(key)!;
    const qty = Number(m.cantidad);

    switch (m.tipo) {
      case "asignacion":
        entry.cantidad += qty;
        break;
      case "uso":
        entry.cantidad -= qty;
        break;
      case "devolucion":
        entry.cantidad -= qty;
        break;
      case "ajuste":
        entry.cantidad += qty;
        break;
    }
  }

  return Array.from(map.values()).filter((s) => s.cantidad !== 0);
}

// ── Get Movement History ────────────────────────────────────────────────

export async function getMovimientos(filters?: {
  catalogo_id?: string;
  tipo?: string;
  cuadrilla_id?: string;
  limit?: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.rol !== "admin") return [];

  let query = supabase
    .from("stock_movimientos")
    .select(
      "*, materiales_catalogo(nombre, unidad_default), cuadrillas(nombre)"
    )
    .order("created_at", { ascending: false });

  if (filters?.catalogo_id) {
    query = query.eq("catalogo_id", filters.catalogo_id);
  }
  if (filters?.tipo) {
    query = query.eq("tipo", filters.tipo);
  }
  if (filters?.cuadrilla_id) {
    query = query.eq("cuadrilla_id", filters.cuadrilla_id);
  }

  query = query.limit(filters?.limit ?? 100);

  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}
