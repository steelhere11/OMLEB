"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getPendingUploads,
  getPendingCount,
  removeUpload,
  markAttempt,
  type PendingUpload,
} from "./offline-queue";
import { createClient } from "./supabase/client";

export interface OnlineStatus {
  isOnline: boolean;
  pendingCount: number;
  isDraining: boolean;
  /** Trigger a manual drain of the queue */
  drainQueue: () => void;
  /** Refresh the pending count */
  refreshCount: () => void;
}

export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isDraining, setIsDraining] = useState(false);
  const drainingRef = useRef(false);

  // Initialize online state
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const refreshCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch {
      // IndexedDB may not be available
    }
  }, []);

  // Check pending count on mount and when online changes
  useEffect(() => {
    refreshCount();
  }, [isOnline, refreshCount]);

  // Process a single upload
  const processUpload = useCallback(async (item: PendingUpload): Promise<boolean> => {
    if (!item.id) return false;

    try {
      const supabase = createClient();
      const blob = new Blob([item.blobData], { type: item.mimeType });
      const folder = item.equipoId || "general";
      const filePath = `${item.reporteId}/${folder}/${item.fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("reportes")
        .upload(filePath, blob, {
          contentType: item.mimeType,
          upsert: true,
        });

      if (uploadError) {
        await markAttempt(item.id, uploadError.message);
        return false;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("reportes")
        .getPublicUrl(filePath);

      // Insert DB row
      const { error: dbError } = await supabase.from("reporte_fotos").insert({
        reporte_id: item.reporteId,
        equipo_id: item.equipoId,
        reporte_paso_id: item.reportePasoId,
        url: urlData.publicUrl,
        etiqueta: item.etiqueta,
        tipo_media: item.type === "video" ? "video" : "foto",
        metadata_gps: item.metadataGps,
        metadata_fecha: item.metadataFecha,
      });

      if (dbError) {
        // Cleanup uploaded file
        await supabase.storage.from("reportes").remove([filePath]);
        await markAttempt(item.id, dbError.message);
        return false;
      }

      // Success — remove from queue
      await removeUpload(item.id);
      return true;
    } catch (err) {
      if (item.id) {
        await markAttempt(item.id, err instanceof Error ? err.message : "Unknown error");
      }
      return false;
    }
  }, []);

  // Drain the queue
  const drainQueue = useCallback(async () => {
    if (drainingRef.current || !navigator.onLine) return;
    drainingRef.current = true;
    setIsDraining(true);

    try {
      const pending = await getPendingUploads();
      const MAX_ATTEMPTS = 5;

      for (const item of pending) {
        if (!navigator.onLine) break; // Stop if we go offline mid-drain
        if (item.attempts >= MAX_ATTEMPTS) continue; // Skip permanently failed

        await processUpload(item);
        // Refresh count after each item
        const count = await getPendingCount();
        setPendingCount(count);
      }
    } catch {
      // Queue processing error
    } finally {
      drainingRef.current = false;
      setIsDraining(false);
      refreshCount();
    }
  }, [processUpload, refreshCount]);

  // Auto-drain when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      // Small delay to let connection stabilize
      const timer = setTimeout(drainQueue, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingCount, drainQueue]);

  return { isOnline, pendingCount, isDraining, drainQueue, refreshCount };
}
