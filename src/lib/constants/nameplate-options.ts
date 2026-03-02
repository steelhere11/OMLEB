// Common refrigerant types for commercial HVAC in Mexico
export const REFRIGERANTES = [
  { value: "R-410A", label: "R-410A" },
  { value: "R-22", label: "R-22" },
  { value: "R-32", label: "R-32" },
  { value: "R-454B", label: "R-454B" },
  { value: "R-407C", label: "R-407C" },
  { value: "Otro", label: "Otro" },
] as const;

// Common voltage ratings per AHRI 110 standard
export const VOLTAJES = [
  { value: "127V", label: "127V" },
  { value: "220V", label: "220V" },
  { value: "208V", label: "208V" },
  { value: "208/230V", label: "208/230V" },
  { value: "460V", label: "460V" },
  { value: "Otro", label: "Otro" },
] as const;

// Phase options
export const FASES = [
  { value: "monofasico", label: "Monofasico" },
  { value: "trifasico", label: "Trifasico" },
] as const;

export type RefrigeranteValue = typeof REFRIGERANTES[number]["value"];
export type VoltajeValue = typeof VOLTAJES[number]["value"];
export type FaseValue = typeof FASES[number]["value"];
