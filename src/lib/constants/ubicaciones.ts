export const UBICACIONES_BBVA = [
  { value: "ATM", label: "ATM" },
  { value: "PATIO", label: "Patio" },
  { value: "BOVEDA", label: "Boveda" },
  { value: "TREN_DE_CAJA", label: "Tren de Caja" },
  { value: "OTRO", label: "Otro" },
] as const;

export type UbicacionValue = typeof UBICACIONES_BBVA[number]["value"];
