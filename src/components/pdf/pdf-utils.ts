/**
 * Utility functions for PDF generation.
 * Pre-fetches images as base64 data URLs to embed in the PDF,
 * avoiding CORS issues with external image URLs.
 */

/**
 * Fetch a single image URL and return it as a base64 data URL.
 * Returns null on any failure (network error, CORS, invalid response).
 */
export async function fetchImageAsBase64(
  url: string
): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const blob = await response.blob();

    return new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

interface PhotoInput {
  url: string;
  etiqueta: string | null;
  metadata_gps: string | null;
  metadata_fecha: string | null;
  reporte_paso_id?: string | null;
  tipo_media?: string;
}

export interface PhotoBase64 {
  data: string;
  etiqueta: string;
  gps: string | null;
  fecha: string | null;
  reportePasoId: string | null;
  isVideo: boolean;
}

/**
 * Fetch all photos in parallel, returning only successfully fetched ones.
 * Uses Promise.allSettled to prevent a single failure from blocking the rest.
 */
export async function fetchAllPhotosAsBase64(
  photos: PhotoInput[]
): Promise<PhotoBase64[]> {
  const results = await Promise.allSettled(
    photos.map(async (photo) => {
      // Videos can't be embedded in PDF — return placeholder entry, skip download
      if (photo.tipo_media === "video") {
        return {
          data: "",
          etiqueta: photo.etiqueta ?? "",
          gps: photo.metadata_gps,
          fecha: photo.metadata_fecha,
          reportePasoId: photo.reporte_paso_id ?? null,
          isVideo: true,
        };
      }
      const data = await fetchImageAsBase64(photo.url);
      if (!data) return null;
      return {
        data,
        etiqueta: photo.etiqueta ?? "",
        gps: photo.metadata_gps,
        fecha: photo.metadata_fecha,
        reportePasoId: photo.reporte_paso_id ?? null,
        isVideo: false,
      };
    })
  );

  const fetched: PhotoBase64[] = [];
  for (const result of results) {
    if (result.status === "fulfilled" && result.value !== null) {
      fetched.push(result.value);
    }
  }

  return fetched;
}

/**
 * Fetch a single image URL and return it as a raw Blob (for ZIP packaging).
 * Returns null on any failure.
 */
export async function fetchImageAsBlob(
  url: string
): Promise<Blob | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.blob();
  } catch {
    return null;
  }
}

/**
 * Trigger a browser download of a Blob with a given filename.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
