"use client";

interface WorkTypeToggleProps {
  name: string;
  value: "preventivo" | "correctivo";
  onChange: (value: "preventivo" | "correctivo") => void;
  disabled?: boolean;
}

export function WorkTypeToggle({
  name,
  value,
  onChange,
  disabled = false,
}: WorkTypeToggleProps) {
  return (
    <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("preventivo")}
        className={`flex-1 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
          value === "preventivo"
            ? "bg-white text-brand-700 shadow-sm"
            : "text-gray-500"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        Preventivo
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("correctivo")}
        className={`flex-1 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
          value === "correctivo"
            ? "bg-white text-brand-700 shadow-sm"
            : "text-gray-500"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        Correctivo
      </button>
    </div>
  );
}
