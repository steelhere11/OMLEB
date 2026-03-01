// GPS utility with last-known fallback
// Never throws -- always returns gracefully

export interface GpsPosition {
  lat: number;
  lng: number;
  approximate: boolean;
}

// Module-level cache for last known position
let lastKnownPosition: GpsPosition | null = null;

export interface GpsOptions {
  timeout?: number;
}

/**
 * Get current GPS position with a configurable timeout (default 10s).
 * Returns last-known position (marked approximate) on error.
 * Returns null if no position has ever been obtained.
 * Never throws.
 */
export async function getGpsPosition(options?: GpsOptions): Promise<GpsPosition | null> {
  // Check if geolocation is available
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    if (lastKnownPosition) {
      return { ...lastKnownPosition, approximate: true };
    }
    return null;
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

    return lastKnownPosition;
  } catch {
    // PermissionDeniedError, TimeoutError, PositionUnavailableError
    // Return last known if available, marked as approximate
    if (lastKnownPosition) {
      return { ...lastKnownPosition, approximate: true };
    }
    return null;
  }
}
