// Photo/video compression and upload pipeline
// Compress (images only) -> Upload to Supabase Storage -> Insert reporte_fotos row
// Uses browser Supabase client (NOT admin/service role)
// Falls back to IndexedDB queue when offline

import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { enqueueUpload } from "@/lib/offline-queue";
import type { TipoMedia } from "@/types";

export type UploadResult =
  | { success: true; url: string; fotoId: string }
  | { success: true; queued: true; url: ""; fotoId: "" }
  | { success: false; error: string };

export interface PhotoMetadata {
  reporteId: string;
  equipoId: string | null;
  reportePasoId: string | null;
  etiqueta: string;
  gps: string | null;
  fecha: Date;
  tipoMedia?: TipoMedia;
}

/** Map video MIME type to file extension */
function videoExtension(mimeType: string): string {
  if (mimeType === "video/mp4") return ".mp4";
  if (mimeType === "video/quicktime") return ".mov";
  if (mimeType === "video/webm") return ".webm";
  return ".mp4"; // fallback
}

/** Queue a photo/video for upload when back online */
async function queueForLater(
  uploadBlob: Blob,
  contentType: string,
  fileName: string,
  metadata: PhotoMetadata,
  tipoMedia: TipoMedia,
  onProgress?: (pct: number) => void
): Promise<UploadResult> {
  try {
    const arrayBuffer = await uploadBlob.arrayBuffer();
    await enqueueUpload({
      type: tipoMedia === "video" ? "video" : "photo",
      reporteId: metadata.reporteId,
      equipoId: metadata.equipoId,
      etiqueta: metadata.etiqueta,
      reportePasoId: metadata.reportePasoId,
      metadataGps: metadata.gps,
      metadataFecha: metadata.fecha.toISOString(),
      fileName,
      blobData: arrayBuffer,
      mimeType: contentType,
    });
    onProgress?.(100);
    return { success: true, queued: true, url: "", fotoId: "" };
  } catch {
    return { success: false, error: "No se pudo guardar en cola local" };
  }
}

/**
 * Compress an image blob (or upload a video blob directly) to Supabase Storage,
 * then insert a reporte_fotos row. If the DB insert fails, the uploaded file
 * is cleaned up.
 *
 * @param blob - Raw blob (from canvas.toBlob, file input, or MediaRecorder)
 * @param metadata - Report/equipment/step context for the media
 * @param onProgress - Optional progress callback (0-100)
 * @returns UploadResult with url and fotoId on success
 */
export async function compressAndUpload(
  blob: Blob,
  metadata: PhotoMetadata,
  onProgress?: (pct: number) => void
): Promise<UploadResult> {
  const supabase = createClient();
  const isVideo = blob.type.startsWith("video/");
  const tipoMedia: TipoMedia = isVideo ? "video" : "foto";

  try {
    onProgress?.(10);

    let uploadBlob: Blob;
    let contentType: string;
    let fileName: string;

    if (isVideo) {
      // Video: skip compression, upload raw blob directly
      uploadBlob = blob;
      contentType = blob.type || "video/mp4";
      fileName = `${crypto.randomUUID()}${videoExtension(contentType)}`;
      onProgress?.(30);
    } else {
      // Image: compress with Web Worker
      const file = new File([blob], "photo.jpg", { type: blob.type || "image/jpeg" });

      const compressed = await imageCompression(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        onProgress: (pct: number) => onProgress?.(10 + pct * 0.4), // 10-50%
      });

      uploadBlob = compressed;
      contentType = "image/jpeg";
      fileName = `${crypto.randomUUID()}.jpg`;
    }

    // If offline, queue for later upload
    if (!navigator.onLine) {
      return queueForLater(uploadBlob, contentType, fileName, metadata, tipoMedia, onProgress);
    }

    // Upload to Supabase Storage
    onProgress?.(50);
    const folder = metadata.equipoId ?? "general";
    const filePath = `${metadata.reporteId}/${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("reportes")
      .upload(filePath, uploadBlob, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      const msg = uploadError.message.toLowerCase();
      if (msg.includes("bucket") && msg.includes("not found")) {
        return {
          success: false,
          error:
            "Bucket de fotos no encontrado. Ejecute migration-04-photos.sql en Supabase.",
        };
      }
      // Network error while uploading — queue for later
      if (!navigator.onLine || msg.includes("fetch") || msg.includes("network")) {
        return queueForLater(uploadBlob, contentType, fileName, metadata, tipoMedia, onProgress);
      }
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("reportes")
      .getPublicUrl(filePath);

    onProgress?.(80);

    // Insert DB record
    const { data: fotoRow, error: dbError } = await supabase
      .from("reporte_fotos")
      .insert({
        reporte_id: metadata.reporteId,
        equipo_id: metadata.equipoId,
        reporte_paso_id: metadata.reportePasoId,
        url: urlData.publicUrl,
        etiqueta: metadata.etiqueta,
        tipo_media: tipoMedia,
        metadata_gps: metadata.gps,
        metadata_fecha: metadata.fecha.toISOString(),
      })
      .select("id")
      .single();

    if (dbError) {
      // Clean up uploaded file if DB insert fails
      await supabase.storage.from("reportes").remove([filePath]);
      return { success: false, error: dbError.message };
    }

    onProgress?.(100);
    return { success: true, url: urlData.publicUrl, fotoId: fotoRow.id };
  } catch (err) {
    // Network errors → try to queue
    if (!navigator.onLine) {
      try {
        const isVid = blob.type.startsWith("video/");
        const ct = isVid ? (blob.type || "video/mp4") : "image/jpeg";
        const fn = `${crypto.randomUUID()}${isVid ? videoExtension(ct) : ".jpg"}`;
        return queueForLater(blob, ct, fn, metadata, tipoMedia, onProgress);
      } catch {
        // Fall through to generic error
      }
    }
    const message =
      err instanceof Error ? err.message : "Error desconocido al subir archivo";
    return { success: false, error: message };
  }
}

/**
 * Delete a photo/video from Storage and its reporte_fotos row.
 *
 * @param fotoId - The reporte_fotos row ID
 * @param filePath - The Storage file path (extracted from URL)
 */
export async function deletePhoto(
  fotoId: string,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("reportes")
      .remove([filePath]);

    if (storageError) {
      return { success: false, error: storageError.message };
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from("reporte_fotos")
      .delete()
      .eq("id", fotoId);

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Error desconocido al eliminar archivo";
    return { success: false, error: message };
  }
}
