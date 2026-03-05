"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteFallaCorrectiva } from "@/app/actions/fallas-correctivas";
import type { FallaCorrectiva } from "@/types";

const SCROLL_KEY = "scroll_correctivas";
const EXPANDED_KEY = "expanded_correctivas";

interface CollapsibleListProps {
  grouped: Record<string, FallaCorrectiva[]>;
  slugOrder: string[];
  tiposMap: Record<string, string>;
}

export function CollapsibleList({
  grouped,
  slugOrder,
  tiposMap,
}: CollapsibleListProps) {
  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(
    () => new Set<string>()
  );
  const [mounted, setMounted] = useState(false);

  // Restore expanded state + scroll position from sessionStorage on mount
  useEffect(() => {
    const savedExpanded = sessionStorage.getItem(EXPANDED_KEY);
    if (savedExpanded) {
      try {
        const parsed = JSON.parse(savedExpanded) as string[];
        setExpandedSlugs(new Set(parsed));
      } catch {
        // ignore
      }
      sessionStorage.removeItem(EXPANDED_KEY);
    }

    setMounted(true);

    const savedScroll = sessionStorage.getItem(SCROLL_KEY);
    if (savedScroll) {
      requestAnimationFrame(() => {
        window.scrollTo(0, parseInt(savedScroll, 10));
      });
      sessionStorage.removeItem(SCROLL_KEY);
    }
  }, []);

  const toggleSlug = (slug: string) => {
    setExpandedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const allExpanded = slugOrder.every((s) => expandedSlugs.has(s));

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedSlugs(new Set());
    } else {
      setExpandedSlugs(new Set(slugOrder));
    }
  };

  const saveStateBeforeNav = () => {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    sessionStorage.setItem(
      EXPANDED_KEY,
      JSON.stringify([...expandedSlugs])
    );
  };

  return (
    <div>
      {/* Expand / Collapse all */}
      {mounted && (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={toggleAll}
            className="text-[12px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
          >
            {allExpanded ? "Colapsar todo" : "Expandir todo"}
          </button>
        </div>
      )}

      {/* Single card container for all sections */}
      <div className="overflow-hidden rounded-[10px] border border-admin-border bg-admin-surface">
        {slugOrder.map((slug, slugIdx) => {
          const isExpanded = expandedSlugs.has(slug);
          const count = grouped[slug].length;

          return (
            <div key={slug}>
              {/* Row-style header */}
              <button
                type="button"
                onClick={() => toggleSlug(slug)}
                className={`flex w-full items-center gap-2 px-[14px] py-[10px] text-left group transition-colors duration-[80ms] hover:bg-admin-surface-hover${slugIdx > 0 ? " row-inset-divider" : ""}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-3.5 w-3.5 flex-shrink-0 text-text-3 transition-transform duration-150 ${isExpanded ? "rotate-90" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-text-2 group-hover:text-text-0 transition-colors duration-[80ms]">
                  {tiposMap[slug] ?? slug}
                </span>
                <span className="rounded-full bg-admin-surface-elevated px-2 py-0.5 text-[11px] font-medium text-text-3">
                  {count} falla{count !== 1 ? "s" : ""}
                </span>
              </button>

              {/* Expanded table — inline inside the card */}
              {isExpanded && (
                <div className="border-t border-admin-border-subtle bg-admin-bg">
                  {/* Column header */}
                  <div className="flex items-center border-b border-admin-border-subtle px-[14px] py-[10px] text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
                    <div className="flex-1">Nombre</div>
                    <div className="hidden w-[260px] sm:block">Diagnostico</div>
                    <div className="w-[120px] text-right">Acciones</div>
                  </div>

                  {/* Data rows */}
                  {grouped[slug].map((falla, i) => (
                    <div
                      key={falla.id}
                      className={`flex items-center px-[14px] py-[9px] transition-colors duration-[80ms] hover:bg-admin-surface-hover${i > 0 ? " row-inset-divider" : ""}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-text-0">
                          {falla.nombre}
                        </p>
                        <div className="mt-0.5 flex gap-2">
                          {falla.evidencia_requerida.length > 0 && (
                            <span className="text-[11px] text-text-3">
                              {falla.evidencia_requerida.length} evidencia{falla.evidencia_requerida.length !== 1 ? "s" : ""}
                            </span>
                          )}
                          {falla.materiales_tipicos.length > 0 && (
                            <span className="text-[11px] text-text-3">
                              {falla.materiales_tipicos.length} material{falla.materiales_tipicos.length !== 1 ? "es" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="hidden w-[260px] sm:block">
                        <p className="line-clamp-2 text-[13px] text-text-2">
                          {falla.diagnostico}
                        </p>
                      </div>
                      <div className="flex w-[120px] items-center justify-end gap-3">
                        <Link
                          href={`/admin/fallas-correctivas/${falla.id}/editar`}
                          onClick={saveStateBeforeNav}
                          className="text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
                        >
                          Editar
                        </Link>
                        <DeleteButton
                          id={falla.id}
                          action={deleteFallaCorrectiva}
                          confirmMessage="¿Eliminar esta falla correctiva?"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
