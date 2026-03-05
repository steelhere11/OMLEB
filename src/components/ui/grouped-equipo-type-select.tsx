"use client";

import type { TipoEquipo } from "@/types";
import { groupTiposByCategoria } from "@/lib/constants/equipment-taxonomy";

interface GroupedEquipoTypeSelectProps {
  tiposEquipo: TipoEquipo[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  id?: string;
}

export function GroupedEquipoTypeSelect({
  tiposEquipo,
  value,
  onChange,
  className = "",
  id,
}: GroupedEquipoTypeSelectProps) {
  const groups = groupTiposByCategoria(tiposEquipo);

  return (
    <select id={id} value={value} onChange={onChange} className={className}>
      <option value="">Seleccionar tipo...</option>
      {groups.map(({ categoria, tipos }) =>
        categoria ? (
          <optgroup key={categoria} label={categoria}>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </optgroup>
        ) : (
          tipos.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.nombre}
            </option>
          ))
        )
      )}
    </select>
  );
}

// Renders grouped options for use inside a wrapping <Select> or <select> element
export function GroupedEquipoTypeOptions({ tiposEquipo }: { tiposEquipo: TipoEquipo[] }) {
  const groups = groupTiposByCategoria(tiposEquipo);

  return (
    <>
      <option value="">Tipo de equipo...</option>
      {groups.map(({ categoria, tipos }) =>
        categoria ? (
          <optgroup key={categoria} label={categoria}>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </optgroup>
        ) : (
          tipos.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.nombre}
            </option>
          ))
        )
      )}
    </>
  );
}
