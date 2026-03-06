import type { TipoEquipo } from "@/types";

// Form factors for physical configuration of indoor units
export const FORMA_FACTORES = [
  { value: "highwall", label: "High Wall" },
  { value: "cassette", label: "Cassette" },
  { value: "piso_techo", label: "Piso / Techo" },
  { value: "ducto", label: "Ducto" },
  { value: "consola", label: "Consola" },
  { value: "gabinete", label: "Gabinete" },
] as const;

// Display ordering for categories
export const CATEGORIA_ORDER = [
  "DX — Interior",
  "DX — Exterior",
  "Agua Helada — Interior",
  "Agua Helada — Generacion",
  "Autonomo",
  "Especializado",
] as const;

// Resolve forma_factor slug to display label (returns null if not set)
const FF_MAP = new Map<string, string>(FORMA_FACTORES.map((f) => [f.value, f.label]));
export function formaFactorLabel(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return FF_MAP.get(slug) ?? slug;
}

// Slugs where forma_factor is relevant (indoor DX units + fan coil)
export const SLUGS_WITH_FORMA_FACTOR = new Set([
  "mini_split_interior",
  "multi_split_interior",
  "vrf_interior",
  "fan_coil",
]);

// Groups TipoEquipo[] into ordered categories for <optgroup> rendering
export function groupTiposByCategoria(
  tipos: TipoEquipo[]
): { categoria: string; tipos: TipoEquipo[] }[] {
  const grouped = new Map<string, TipoEquipo[]>();

  // Initialize ordered categories
  for (const cat of CATEGORIA_ORDER) {
    grouped.set(cat, []);
  }

  const uncategorized: TipoEquipo[] = [];

  for (const tipo of tipos) {
    if (tipo.categoria && grouped.has(tipo.categoria)) {
      grouped.get(tipo.categoria)!.push(tipo);
    } else if (tipo.categoria) {
      // Unknown category — add to map
      if (!grouped.has(tipo.categoria)) {
        grouped.set(tipo.categoria, []);
      }
      grouped.get(tipo.categoria)!.push(tipo);
    } else {
      uncategorized.push(tipo);
    }
  }

  const result: { categoria: string; tipos: TipoEquipo[] }[] = [];

  for (const [cat, items] of grouped) {
    if (items.length > 0) {
      result.push({ categoria: cat, tipos: items });
    }
  }

  // Add uncategorized at the end (e.g., "Otro")
  if (uncategorized.length > 0) {
    result.push({ categoria: "", tipos: uncategorized });
  }

  return result;
}
