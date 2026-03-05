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
      <div className="rounded-input border border-tech-border bg-gray-50 p-4 text-center">
        <p className="text-body text-tech-text-muted">
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
            className={`flex w-full items-start gap-3 rounded-card border p-4 text-left transition-colors ${
              isSelected
                ? "border-amber-400 bg-amber-50"
                : "border-tech-border bg-tech-surface active:bg-gray-50"
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
              <p className="text-body font-medium text-tech-text-primary">
                {issue.nombre}
              </p>
              <p className="mt-0.5 text-label text-tech-text-muted line-clamp-2">
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
