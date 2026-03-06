/**
 * Download a blob to the user's device via <a download>.
 * On Android this lands in Downloads (indexed by Gallery).
 * On iOS standalone PWA this silently fails — no harm.
 */
export async function saveToDevice(blob: Blob, filename: string): Promise<void> {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 200);
  } catch {
    // Best-effort — silently fail
  }
}

/**
 * Fetch a remote URL as a blob, then trigger download.
 * Needed for Supabase URLs since cross-origin <a download> is ignored by browsers.
 */
export async function downloadFromUrl(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("fetch failed");
    const blob = await res.blob();
    await saveToDevice(blob, filename);
  } catch {
    // Fallback: open in new tab (user can long-press to save on iOS)
    window.open(url, "_blank");
  }
}

/**
 * Generate a descriptive filename for captured media.
 */
export function generateMediaFilename(
  type: "foto" | "video",
  label: string,
  ext: string
): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 8).replace(/:/g, "-");
  return `OMLEB_${type}_${label}_${date}_${time}.${ext}`;
}
