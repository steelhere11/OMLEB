"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ReporteComentario } from "@/types";
import { addAdminComment, deleteAdminComment } from "@/app/actions/admin-comments";

// ---------- Types ----------

interface CommentWithAuthor extends ReporteComentario {
  autor_nombre?: string;
}

interface CommentSectionProps {
  comments: CommentWithAuthor[];
  reporteId: string;
  equipoId?: string;
  equipos?: Array<{ id: string; etiqueta: string }>;
  readOnly?: boolean;
}

// ---------- Helpers ----------

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "justo ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours !== 1 ? "s" : ""}`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `hace ${diffDays} dia${diffDays !== 1 ? "s" : ""}`;

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ---------- Component ----------

export function CommentSection({
  comments,
  reporteId,
  equipoId,
  equipos,
  readOnly = false,
}: CommentSectionProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [selectedEquipoId, setSelectedEquipoId] = useState<string>("");
  const [isAdding, startAddTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    if (!content.trim()) return;
    setError(null);

    // Determine the scope: pre-set equipoId, selected from dropdown, or general (null)
    const targetEquipoId = equipoId ?? (selectedEquipoId || undefined);

    startAddTransition(async () => {
      const result = await addAdminComment(reporteId, content, targetEquipoId);
      if (result.error) {
        setError(result.error);
      } else {
        setContent("");
        setSelectedEquipoId("");
        router.refresh();
      }
    });
  }

  async function handleDelete(comentarioId: string) {
    setError(null);
    setDeletingId(comentarioId);
    const result = await deleteAdminComment(comentarioId);
    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
    setDeletingId(null);
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-[15px] font-semibold text-text-0">
          Comentarios
        </h2>
        {comments.length > 0 && (
          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent/10 px-1.5 text-[11px] font-semibold text-accent">
            {comments.length}
          </span>
        )}
      </div>

      <div className="rounded-[10px] border border-admin-border bg-admin-surface p-4">
        {/* Comment list */}
        {comments.length === 0 ? (
          <p className="text-center text-[13px] text-text-3">Sin comentarios</p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-[8px] border border-admin-border-subtle bg-admin-surface-elevated px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[12px] font-semibold text-text-0">
                      {comment.autor_nombre ?? "Admin"}
                    </span>
                    <span className="text-[11px] text-text-3">
                      {formatRelativeTime(comment.created_at)}
                    </span>
                    {/* Show equipment tag for per-equipment comments in the general section */}
                    {comment.equipo_id && !equipoId && equipos && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                        {equipos.find((e) => e.id === comment.equipo_id)?.etiqueta ?? "Equipo"}
                      </span>
                    )}
                  </div>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deletingId === comment.id}
                      className="shrink-0 text-[13px] text-text-3 transition-colors duration-[80ms] hover:text-red-500 disabled:opacity-50"
                      title="Eliminar comentario"
                    >
                      {deletingId === comment.id ? (
                        <span className="text-[11px]">...</span>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-text-1 whitespace-pre-wrap">
                  {comment.contenido}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Add comment form */}
        {!readOnly && (
          <div className={comments.length > 0 ? "mt-4 border-t border-admin-border-subtle pt-4" : "mt-3"}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe un comentario..."
              rows={2}
              className="w-full rounded-[6px] border border-admin-border bg-admin-surface px-3 py-2 text-[13px] text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
            />

            <div className="mt-2 flex items-center gap-2">
              {/* Scope selector: only show if we're in "general" context and have equipment list */}
              {!equipoId && equipos && equipos.length > 0 && (
                <select
                  value={selectedEquipoId}
                  onChange={(e) => setSelectedEquipoId(e.target.value)}
                  className="rounded-[6px] border border-admin-border bg-admin-surface px-2 py-1.5 text-[12px] text-text-1"
                >
                  <option value="">General</option>
                  {equipos.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.etiqueta}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex-1" />

              {error && (
                <span className="text-[12px] text-red-600">{error}</span>
              )}

              <button
                type="button"
                onClick={handleAdd}
                disabled={isAdding || !content.trim()}
                className="rounded-[6px] bg-accent px-3 py-1.5 text-[12px] font-medium text-white transition-colors duration-[80ms] hover:bg-accent/90 disabled:opacity-50"
              >
                {isAdding ? "Agregando..." : "Agregar comentario"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
