"use client";

import { useOnlineStatus } from "@/lib/use-online-status";
import { OfflineBanner } from "./offline-banner";

/**
 * Self-contained offline banner controller.
 * Manages its own online/offline state and queue drain logic.
 */
export function OfflineBannerController() {
  const status = useOnlineStatus();
  return <OfflineBanner status={status} />;
}
