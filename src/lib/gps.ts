// GPS utility with last-known fallback
// Never throws -- always returns gracefully

export interface GpsPosition {
  lat: number;
  lng: number;
  approximate: boolean;
}

export type GpsErrorReason = "denied" | "unavailable" | "timeout" | "unsupported";

export interface GpsResult {
  position: GpsPosition | null;
  error?: GpsErrorReason;
}

// Module-level cache for last known position
let lastKnownPosition: GpsPosition | null = null;

export interface GpsOptions {
  timeout?: number;
}

/**
 * Get current GPS position with a configurable timeout (default 10s).
 * Returns position (or last-known approximate) and an error reason if it failed.
 * Never throws.
 */
export async function getGpsPosition(options?: GpsOptions): Promise<GpsResult> {
  // Check if geolocation is available
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return {
      position: lastKnownPosition
        ? { ...lastKnownPosition, approximate: true }
        : null,
      error: "unsupported",
    };
  }

  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: options?.timeout ?? 10000,
        maximumAge: 60000,
      });
    });

    lastKnownPosition = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      approximate: false,
    };

    return { position: lastKnownPosition };
  } catch (err) {
    // Map GeolocationPositionError codes to reason strings
    let error: GpsErrorReason = "unavailable";
    if (err instanceof GeolocationPositionError) {
      if (err.code === err.PERMISSION_DENIED) error = "denied";
      else if (err.code === err.POSITION_UNAVAILABLE) error = "unavailable";
      else if (err.code === err.TIMEOUT) error = "timeout";
    }

    return {
      position: lastKnownPosition
        ? { ...lastKnownPosition, approximate: true }
        : null,
      error,
    };
  }
}
