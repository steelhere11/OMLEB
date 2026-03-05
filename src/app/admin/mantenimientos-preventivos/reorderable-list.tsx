"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import Link from "next/link";
import { DeleteButton } from "@/components/admin/delete-button";
import {
  deletePlantillaPaso,
  reorderPlantillaPasos,
} from "@/app/actions/mantenimientos-preventivos";
import type { PlantillaPaso } from "@/types";

const SCROLL_KEY = "scroll_preventivos";
const EXPANDED_KEY = "expanded_preventivos";

interface ReorderableListProps {
  grouped: Record<string, PlantillaPaso[]>;
  slugOrder: string[];
  tiposMap: Record<string, string>;
}

export function ReorderableList({
  grouped: initialGrouped,
  slugOrder,
  tiposMap,
}: ReorderableListProps) {
  const [grouped, setGrouped] = useState(initialGrouped);
  const [isPending, startTransition] = useTransition();
  const [expandedSlugs, setExpandedSlugs] = useState<Set<string>>(() => {
    // Will be overridden by useEffect if sessionStorage has saved state
    return new Set<string>();
  });
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
      // Delay to allow DOM to render expanded sections
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

  const handleMove = useCallback(
    (slug: string, index: number, direction: "up" | "down") => {
      const steps = [...grouped[slug]];
      const swapIdx = direction === "up" ? index - 1 : index + 1;
      if (swapIdx < 0 || swapIdx >= steps.length) return;

      [steps[index], steps[swapIdx]] = [steps[swapIdx], steps[index]];

      const updates = steps.map((step, i) => ({ id: step.id, orden: i + 1 }));
      const reordered = steps.map((step, i) => ({ ...step, orden: i + 1 }));

      setGrouped((prev) => ({ ...prev, [slug]: reordered }));

      startTransition(async () => {
        await reorderPlantillaPasos(updates);
      });
    },
    [grouped]
  );

  return (
    <div className="space-y-6">
      {isPending && (
        <div className="fixed right-4 top-4 z-50 rounded-[6px] border border-admin-border bg-admin-surface px-3 py-1.5 text-[12px] text-text-2 shadow-sm">
          Guardando...
        </div>
      )}

      {/* Expand / Collapse all */}
      {mounted && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={toggleAll}
            className="text-[12px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
          >
            {allExpanded ? "Colapsar todo" : "Expandir todo"}
          </button>
        </div>
      )}

      {slugOrder.map((slug) => {
        const isExpanded = expandedSlugs.has(slug);
        const count = grouped[slug].length;

        return (
          <div key={slug}>
            {/* Clickable group header */}
            <button
              type="button"
              onClick={() => toggleSlug(slug)}
              className="mb-2 flex w-full items-center gap-2 text-left group"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-3.5 w-3.5 text-text-3 transition-transform duration-150 ${isExpanded ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-text-2 group-hover:text-text-0 transition-colors duration-[80ms]">
                {tiposMap[slug] ?? slug}
              </h2>
              <span className="rounded-full bg-admin-surface-elevated px-2 py-0.5 text-[11px] font-medium text-text-3">
                {count} paso{count !== 1 ? "s" : ""}
              </span>
            </button>

            {isExpanded && (
              <div className="overflow-hidden rounded-[10px] border border-admin-border bg-admin-surface">
                {/* Header row */}
                <div className="flex items-center border-b border-admin-border-subtle px-[14px] py-[10px] text-[11px] font-medium uppercase tracking-[0.04em] text-text-2">
                  <div className="w-[50px]">Orden</div>
                  <div className="flex-1">Nombre</div>
                  <div className="hidden w-[260px] sm:block">Procedimiento</div>
                  <div className="w-[160px] text-right">Acciones</div>
                </div>

                {/* Data rows */}
                {grouped[slug].map((paso, i) => {
                  const isFirst = i === 0;
                  const isLast = i === grouped[slug].length - 1;

                  return (
                    <div
                      key={paso.id}
                      className={`flex items-center px-[14px] py-[9px] transition-colors duration-[80ms] hover:bg-admin-surface-hover${i > 0 ? " row-inset-divider" : ""}`}
                    >
                      <div className="w-[50px]">
                        <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-[4px] bg-admin-surface-elevated px-1.5 text-[11px] font-semibold text-text-1">
                          {paso.orden}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-text-0">
                          {paso.nombre}
                          {!paso.es_obligatorio && (
                            <span className="ml-1.5 text-[11px] font-normal text-text-3">
                              (opcional)
                            </span>
                          )}
                        </p>
                        <div className="mt-0.5 flex gap-2">
                          {paso.evidencia_requerida.length > 0 && (
                            <span className="text-[11px] text-text-3">
                              {paso.evidencia_requerida.length} evidencia
                              {paso.evidencia_requerida.length !== 1 ? "s" : ""}
                            </span>
                          )}
                          {paso.lecturas_requeridas.length > 0 && (
                            <span className="text-[11px] text-text-3">
                              {paso.lecturas_requeridas.length} lectura
                              {paso.lecturas_requeridas.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="hidden w-[260px] sm:block">
                        <p className="line-clamp-2 text-[13px] text-text-2">
                          {paso.procedimiento}
                        </p>
                      </div>
                      <div className="flex w-[160px] items-center justify-end gap-1.5">
                        {/* Reorder arrows */}
                        <div className="flex items-center gap-0.5 mr-2">
                          <button
                            type="button"
                            disabled={isFirst || isPending}
                            onClick={() => handleMove(slug, i, "up")}
                            className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[4px] text-text-2 transition-colors duration-[80ms] hover:bg-admin-surface-elevated hover:text-text-0 disabled:opacity-30 disabled:pointer-events-none"
                            title="Mover arriba"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 15l7-7 7 7"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            disabled={isLast || isPending}
                            onClick={() => handleMove(slug, i, "down")}
                            className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[4px] text-text-2 transition-colors duration-[80ms] hover:bg-admin-surface-elevated hover:text-text-0 disabled:opacity-30 disabled:pointer-events-none"
                            title="Mover abajo"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                        </div>

                        <Link
                          href={`/admin/mantenimientos-preventivos/${paso.id}/editar`}
                          onClick={saveStateBeforeNav}
                          className="text-[13px] font-medium text-accent transition-colors duration-[80ms] hover:text-text-0"
                        >
                          Editar
                        </Link>
                        <DeleteButton
                          id={paso.id}
                          action={deletePlantillaPaso}
                          confirmMessage="¿Eliminar este paso preventivo?"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
