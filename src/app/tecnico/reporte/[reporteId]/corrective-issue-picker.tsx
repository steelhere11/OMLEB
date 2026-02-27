"use client";

import type { FallaCorrectiva } from "@/types";

interface CorrectiveIssuePickerProps {
  issues: FallaCorrectiva[];
  selectedIds: Set<string>;
  onToggle: (issueId: string) => void;
  disabled?: boolean;
}

export function CorrectiveIssuePicker({
  issues,
  selectedIds,
  onToggle,
  disabled,
}: CorrectiveIssuePickerProps) {
  if (issues.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-500">
          No hay fallas registradas para este tipo de equipo
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {issues.map((issue) => {
        const isSelected = selectedIds.has(issue.id);
        return (
          <button
            key={issue.id}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(issue.id)}
            className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
              isSelected
                ? "border-amber-400 bg-amber-50"
                : "border-gray-200 bg-white active:bg-gray-50"
            } disabled:opacity-50`}
          >
            {/* Checkbox */}
            <div
              className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border ${
                isSelected
                  ? "border-amber-500 bg-amber-500"
                  : "border-gray-300 bg-white"
              }`}
            >
              {isSelected && (
                <svg
                  className="h-3.5 w-3.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>

            {/* Issue info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {issue.nombre}
              </p>
              <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                {issue.diagnostico.length > 120
                  ? issue.diagnostico.slice(0, 120) + "..."
                  : issue.diagnostico}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
