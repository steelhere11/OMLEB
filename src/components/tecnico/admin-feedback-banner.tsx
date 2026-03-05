"use client";

interface RetakePhoto {
  fotoId: string;
  etiqueta: string;
  equipoLabel: string;
  stepName?: string;
  nota: string | null;
}

interface RejectedPhoto {
  fotoId: string;
  etiqueta: string;
  equipoLabel: string;
  nota: string | null;
}

interface AdminFeedbackBannerProps {
  retakePhotos: RetakePhoto[];
  rejectedPhotos: RejectedPhoto[];
  commentCount: number;
}

export function AdminFeedbackBanner({
  retakePhotos,
  rejectedPhotos,
  commentCount,
}: AdminFeedbackBannerProps) {
  const hasRetake = retakePhotos.length > 0;
  const hasRejected = rejectedPhotos.length > 0;
  const hasComments = commentCount > 0;

  if (!hasRetake && !hasRejected && !hasComments) return null;

  return (
    <div className="rounded-card border border-amber-300 bg-amber-50 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-amber-600 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p className="text-sm font-bold text-amber-800">
          Comentarios del administrador
        </p>
      </div>

      {/* Retake photos section */}
      {hasRetake && (
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-amber-700">
            {retakePhotos.length} foto{retakePhotos.length !== 1 ? "s" : ""}{" "}
            necesitan ser retomada{retakePhotos.length !== 1 ? "s" : ""}
          </p>
          <ul className="space-y-1 pl-1">
            {retakePhotos.map((photo) => (
              <li
                key={photo.fotoId}
                className="flex items-start gap-2 text-xs text-amber-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-amber-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>
                  <strong>{photo.equipoLabel}</strong>
                  {" - "}
                  {photo.etiqueta.toUpperCase()}
                  {photo.stepName && ` (${photo.stepName})`}
                  {photo.nota && (
                    <span className="block text-amber-600 mt-0.5 italic">
                      &quot;{photo.nota}&quot;
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rejected photos section */}
      {hasRejected && (
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-red-700">
            {rejectedPhotos.length} foto{rejectedPhotos.length !== 1 ? "s" : ""}{" "}
            rechazada{rejectedPhotos.length !== 1 ? "s" : ""}
          </p>
          <ul className="space-y-1 pl-1">
            {rejectedPhotos.map((photo) => (
              <li
                key={photo.fotoId}
                className="flex items-start gap-2 text-xs text-red-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span>
                  <strong>{photo.equipoLabel}</strong>
                  {" - "}
                  {photo.etiqueta.toUpperCase()}
                  {photo.nota && (
                    <span className="block text-red-500 mt-0.5 italic">
                      &quot;{photo.nota}&quot;
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Comments count */}
      {hasComments && (
        <div className="flex items-center gap-2 text-sm text-amber-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          <span>
            {commentCount} comentario{commentCount !== 1 ? "s" : ""} del
            administrador
          </span>
        </div>
      )}
    </div>
  );
}
