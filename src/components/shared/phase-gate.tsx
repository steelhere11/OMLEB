"use client";

interface PhaseGateProps {
  isLocked: boolean;
  lockMessage: string;
  title: string;
  phaseNumber: number;
  isComplete: boolean;
  children: React.ReactNode;
  /** Optional soft reminder shown inside the phase (content is still accessible) */
  softWarning?: string;
}

export function PhaseGate({
  isLocked,
  lockMessage,
  title,
  phaseNumber,
  isComplete,
  children,
  softWarning,
}: PhaseGateProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
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
          className={`flex-1 text-sm font-semibold ${
            isComplete
              ? "text-green-700"
              : isLocked
                ? "text-gray-400"
                : "text-gray-900"
          }`}
        >
          {title}
        </h3>

        {/* Status indicator */}
        {isComplete ? (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600">
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
      </div>

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
          <p className="text-sm">{lockMessage}</p>
        </div>
      ) : (
        <div className="p-4">
          {softWarning && !isComplete && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
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
              <p className="text-xs text-amber-700">{softWarning}</p>
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
