"use client";

import type { OnlineStatus } from "@/lib/use-online-status";

interface OfflineBannerProps {
  status: OnlineStatus;
}

export function OfflineBanner({ status }: OfflineBannerProps) {
  const { isOnline, pendingCount, isDraining, drainQueue } = status;

  // Nothing to show if online and no pending uploads
  if (isOnline && pendingCount === 0) return null;

  // Offline banner
  if (!isOnline) {
    return (
      <div className="flex items-center justify-between gap-2 bg-gray-800 px-4 py-2 text-sm text-white">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 flex-shrink-0 text-yellow-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.536 8.464a5 5 0 010 7.072M8.464 15.536a5 5 0 010-7.072"
            />
            {/* X through the signal */}
            <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth={2} />
          </svg>
          <span>
            Sin conexion
            {pendingCount > 0 && (
              <span className="ml-1 text-yellow-300">
                · {pendingCount} {pendingCount === 1 ? "pendiente" : "pendientes"}
              </span>
            )}
          </span>
        </div>
      </div>
    );
  }

  // Online but has pending uploads (draining or waiting)
  if (pendingCount > 0) {
    return (
      <div className="flex items-center justify-between gap-2 bg-brand-600 px-4 py-2 text-sm text-white">
        <div className="flex items-center gap-2">
          {isDraining ? (
            <svg
              className="h-4 w-4 flex-shrink-0 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          )}
          <span>
            {isDraining ? "Subiendo" : "Pendientes"}:{" "}
            {pendingCount} {pendingCount === 1 ? "archivo" : "archivos"}
          </span>
        </div>
        {!isDraining && (
          <button
            type="button"
            onClick={drainQueue}
            className="rounded bg-white/20 px-2.5 py-1 text-xs font-medium hover:bg-white/30 active:bg-white/40"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }

  return null;
}
