"use client";

import { useState } from "react";
import type { RevisionWithAuthor } from "@/app/actions/admin-revisions";

interface RevisionHistoryPanelProps {
  revisions: RevisionWithAuthor[];
}

export function RevisionHistoryPanel({ revisions }: RevisionHistoryPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (revisions.length === 0) return null;

  return (
    <div className="rounded-[10px] border border-admin-border bg-admin-surface">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-text-2">
          Historial de Revisiones ({revisions.length})
        </h2>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 text-text-3 transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-admin-border px-4 pb-4">
          <div className="relative mt-3 ml-3 border-l-2 border-admin-border pl-4">
            {revisions.map((rev) => {
              const date = new Date(rev.created_at);
              const formattedDate = date.toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              const formattedTime = date.toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div key={rev.id} className="relative mb-4 last:mb-0">
                  {/* Timeline dot */}
                  <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-accent bg-admin-surface" />

                  <div className="flex items-baseline gap-2">
                    <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
                      Rev. {rev.numero}
                    </span>
                    <span className="text-[11px] text-text-3">
                      {formattedDate} {formattedTime}
                    </span>
                  </div>

                  <p className="mt-1 text-[13px] text-text-1">
                    {rev.resumen}
                  </p>

                  <p className="mt-0.5 text-[11px] text-text-3">
                    por {rev.autor_nombre}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
