"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import type { LecturaRequerida } from "@/types";

interface ReadingInputProps {
  lectura: LecturaRequerida;
  value: string | number;
  onChange: (value: string | number) => void;
  disabled?: boolean;
}

export function ReadingInput({
  lectura,
  value,
  onChange,
  disabled,
}: ReadingInputProps) {
  const [touched, setTouched] = useState(false);

  // Determine if value is out of range (only for numeric inputs with ranges)
  const isNumeric =
    lectura.unidad !== "texto" && lectura.unidad !== "Sí/No";
  const numericValue =
    isNumeric && value !== "" ? Number(value) : null;
  const hasRange =
    lectura.rango_min !== null || lectura.rango_max !== null;
  const isOutOfRange =
    touched &&
    isNumeric &&
    hasRange &&
    numericValue !== null &&
    !isNaN(numericValue) &&
    ((lectura.rango_min !== null && numericValue < lectura.rango_min) ||
      (lectura.rango_max !== null && numericValue > lectura.rango_max));

  const rangeText =
    lectura.rango_min !== null && lectura.rango_max !== null
      ? `${lectura.rango_min}-${lectura.rango_max} ${lectura.unidad}`
      : lectura.rango_min !== null
        ? `>= ${lectura.rango_min} ${lectura.unidad}`
        : `<= ${lectura.rango_max} ${lectura.unidad}`;

  // Sí/No toggle
  if (lectura.unidad === "Sí/No") {
    return (
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-gray-700">{lectura.nombre}</p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange("Sí")}
            className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
              value === "Sí"
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-gray-200 bg-white text-gray-600 active:bg-gray-50"
            } disabled:opacity-50`}
          >
            Sí
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange("No")}
            className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
              value === "No"
                ? "border-red-500 bg-red-50 text-red-700"
                : "border-gray-200 bg-white text-gray-600 active:bg-gray-50"
            } disabled:opacity-50`}
          >
            No
          </button>
        </div>
      </div>
    );
  }

  // Text input
  if (lectura.unidad === "texto") {
    return (
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-gray-700">{lectura.nombre}</p>
        <Input
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={lectura.nombre}
          className="h-12"
        />
      </div>
    );
  }

  // Numeric input with range validation
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-gray-700">{lectura.nombre}</p>
      <div className="relative">
        <Input
          type="text"
          inputMode="decimal"
          value={String(value)}
          onChange={(e) => {
            setTouched(true);
            const raw = e.target.value;
            // Allow empty, numbers, and decimals
            if (raw === "" || /^-?\d*\.?\d*$/.test(raw)) {
              onChange(raw === "" ? "" : raw);
            }
          }}
          onBlur={() => setTouched(true)}
          disabled={disabled}
          placeholder="0"
          className={`h-12 pr-14 ${isOutOfRange ? "border-yellow-400" : ""}`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
          {lectura.unidad}
        </span>
      </div>
      {isOutOfRange && (
        <p className="text-xs text-yellow-600">
          Fuera de rango normal ({rangeText})
        </p>
      )}
    </div>
  );
}
