// GPS utility with last-known fallback and reverse geocoding
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

// Reverse geocoding cache (avoids re-fetching for same location)
let cachedGeocode: { lat: number; lng: number; lines: string[] } | null = null;

/**
 * Reverse-geocode lat/lng into address lines using OpenStreetMap Nominatim.
 * Returns lines like: ["257 Avenida 4a. Avenida", "Rey Neza", "Ciudad Nezahualcóyotl", "Estado de México"]
 * Falls back to raw coordinates on error.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string[]> {
  // Return cached if within ~100m of previous lookup
  if (
    cachedGeocode &&
    Math.abs(cachedGeocode.lat - lat) < 0.001 &&
    Math.abs(cachedGeocode.lng - lng) < 0.001
  ) {
    return cachedGeocode.lines;
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "es",
          "User-Agent": "OMLEB-HVAC-App/1.0",
        },
      }
    );
    const data = await res.json();
    const addr = data.address || {};

    const lines: string[] = [];

    // Street line: house_number + road
    const street = [addr.house_number, addr.road].filter(Boolean).join(" ");
    if (street) lines.push(street);

    // Neighbourhood / suburb
    if (addr.suburb || addr.neighbourhood) {
      lines.push(addr.suburb || addr.neighbourhood);
    }

    // City / town / municipality
    const city = addr.city || addr.town || addr.municipality;
    if (city) lines.push(city);

    // State
    if (addr.state) lines.push(addr.state);

    // Fallback to coordinates if Nominatim returned nothing useful
    if (lines.length === 0) {
      lines.push(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }

    cachedGeocode = { lat, lng, lines };
    return lines;
  } catch {
    return [`${lat.toFixed(6)}, ${lng.toFixed(6)}`];
  }
}

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
