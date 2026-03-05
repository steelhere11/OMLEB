"use client";

import { useState, useEffect } from "react";

interface PhaseGateProps {
  isLocked: boolean;
  lockMessage: string;
  title: string;
  phaseNumber: number;
  isComplete: boolean;
  children: React.ReactNode;
  /** Optional soft reminder shown inside the phase (content is still accessible) */
  softWarning?: string;
  /** Controls whether the phase starts expanded */
  defaultOpen?: boolean;
}

export function PhaseGate({
  isLocked,
  lockMessage,
  title,
  phaseNumber,
  isComplete,
  children,
  softWarning,
  defaultOpen,
}: PhaseGateProps) {
  const [isOpen, setIsOpen] = useState(() => {
    if (isLocked) return false;
    if (defaultOpen !== undefined) return defaultOpen;
    return !isComplete;
  });

  // Auto-expand when defaultOpen transitions to true (phase becomes current)
  useEffect(() => {
    if (defaultOpen) setIsOpen(true);
  }, [defaultOpen]);

  return (
    <div className="rounded-card border border-tech-border bg-tech-surface overflow-hidden">
      {/* Header bar — clickable toggle */}
      <button
        type="button"
        onClick={() => !isLocked && setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 px-4 py-3 border-b border-tech-border-subtle text-left"
      >
        {/* Phase number badge */}
        <div
          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            isComplete
              ? "bg-green-500 text-white"
              : isLocked
                ? "bg-gray-200 text-gray-400"
                : "bg-blue-500 text-white"
          }`}
        >
          {isComplete ? (
            <svg
              className="h-4 w-4"
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
          ) : (
            phaseNumber
          )}
        </div>

        {/* Title */}
        <h3
          className={`flex-1 text-body font-semibold ${
            isComplete
              ? "text-green-700"
              : isLocked
                ? "text-gray-400"
                : "text-tech-text-primary"
          }`}
        >
          {title}
        </h3>

        {/* Status indicator */}
        {isComplete ? (
          <span className="flex items-center gap-1 text-label font-medium text-green-600">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Completado
          </span>
        ) : isLocked ? (
          <svg
            className="h-4 w-4 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        ) : (
          <span className="h-2 w-2 rounded-full bg-blue-500" />
        )}

        {/* Chevron */}
        {!isLocked && (
          <svg
            className={`h-5 w-5 flex-shrink-0 text-tech-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Body */}
      {isLocked ? (
        <div className="bg-gray-50 text-gray-400 p-6 text-center">
          <svg
            className="mx-auto mb-2 h-8 w-8 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <p className="text-body">{lockMessage}</p>
        </div>
      ) : (
        <div className="phase-collapsible" data-open={isOpen}>
          <div className="phase-collapsible-inner">
            <div className="p-4">
              {softWarning && !isComplete && (
                <div className="mb-3 flex items-center gap-2 rounded-input border border-amber-200 bg-amber-50 px-3 py-2">
                  <svg
                    className="h-4 w-4 flex-shrink-0 text-amber-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                    />
                  </svg>
                  <p className="text-label text-amber-700">{softWarning}</p>
                </div>
              )}
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
