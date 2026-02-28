// GPS utility with last-known fallback
// Never throws -- always returns gracefully

export interface GpsPosition {
  lat: number;
  lng: number;
  approximate: boolean;
}

// Module-level cache for last known position
let lastKnownPosition: GpsPosition | null = null;

/**
 * Get current GPS position with a 5-second timeout.
 * Returns last-known position (marked approximate) on error.
 * Returns null if no position has ever been obtained.
 * Never throws.
 */
export async function getGpsPosition(): Promise<GpsPosition | null> {
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
        timeout: 5000,
        maximumAge: 30000,
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
