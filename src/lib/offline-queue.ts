/**
 * Offline Upload Queue — IndexedDB-backed queue for photos/operations
 * that failed or were attempted while offline.
 *
 * Stores pending photo uploads with their blob data and metadata.
 * Auto-drains when connection restores.
 */

const DB_NAME = "omleb-offline-queue";
const DB_VERSION = 1;
const STORE_NAME = "pending-uploads";

export interface PendingUpload {
  id?: number; // IDB auto-increment key
  createdAt: string;
  type: "photo" | "video";
  // Photo metadata
  reporteId: string;
  equipoId: string | null;
  etiqueta: string;
  reportePasoId: string | null;
  metadataGps: string | null;
  metadataFecha: string | null;
  fileName: string;
  // Blob stored as ArrayBuffer for IDB compatibility
  blobData: ArrayBuffer;
  mimeType: string;
  // Retry tracking
  attempts: number;
  lastAttempt: string | null;
  error: string | null;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Add a photo upload to the offline queue */
export async function enqueueUpload(
  upload: Omit<PendingUpload, "id" | "attempts" | "lastAttempt" | "error" | "createdAt">
): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const entry: Omit<PendingUpload, "id"> = {
      ...upload,
      createdAt: new Date().toISOString(),
      attempts: 0,
      lastAttempt: null,
      error: null,
    };

    const request = store.add(entry);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

/** Get all pending uploads */
export async function getPendingUploads(): Promise<PendingUpload[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as PendingUpload[]);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

/** Get count of pending uploads */
export async function getPendingCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

/** Remove a successfully uploaded item */
export async function removeUpload(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

/** Update retry info on a failed upload */
export async function markAttempt(id: number, error: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const entry = getReq.result as PendingUpload;
      if (!entry) {
        resolve();
        return;
      }
      entry.attempts += 1;
      entry.lastAttempt = new Date().toISOString();
      entry.error = error;
      store.put(entry);
    };

    getReq.onerror = () => reject(getReq.error);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
  });
}

/** Clear all pending uploads (e.g., user-initiated) */
export async function clearQueue(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}
