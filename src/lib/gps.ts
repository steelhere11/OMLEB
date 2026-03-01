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

function classifyError(err: unknown): GpsErrorReason {
  // Use numeric codes directly (1=denied, 2=unavailable, 3=timeout)
  // because `instanceof GeolocationPositionError` is unreliable on iOS Safari.
  const code = (err as { code?: number })?.code;
  if (code === 1) return "denied";
  if (code === 2) return "unavailable";
  if (code === 3) return "timeout";
  return "unavailable";
}

/**
 * Try getCurrentPosition first, then fall back to watchPosition.
 * watchPosition is more reliable on iOS Safari in some permission states.
 */
function tryGeolocation(timeoutMs: number): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    let settled = false;

    // Attempt 1: getCurrentPosition
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!settled) { settled = true; resolve(pos); }
      },
      (err) => {
        if (settled) return;
        // If denied (code 1), don't bother with watchPosition — it'll also be denied
        if (err.code === 1) { settled = true; reject(err); return; }

        // Attempt 2: watchPosition as fallback (more reliable on some iOS versions)
        const watchId = navigator.geolocation.watchPosition(
          (pos) => {
            if (!settled) { settled = true; navigator.geolocation.clearWatch(watchId); resolve(pos); }
          },
          (watchErr) => {
            if (!settled) { settled = true; navigator.geolocation.clearWatch(watchId); reject(watchErr); }
          },
          { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 }
    );

    // Hard safety timeout
    setTimeout(() => {
      if (!settled) { settled = true; reject({ code: 3 }); }
    }, timeoutMs + 2000);
  });
}

/**
 * Get current GPS position with a configurable timeout (default 10s).
 * Uses getCurrentPosition with watchPosition fallback for iOS Safari.
 * Returns position (or last-known approximate) and an error reason if it failed.
 * Never throws.
 */
export async function getGpsPosition(options?: GpsOptions): Promise<GpsResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return {
      position: lastKnownPosition
        ? { ...lastKnownPosition, approximate: true }
        : null,
      error: "unsupported",
    };
  }

  try {
    const pos = await tryGeolocation(options?.timeout ?? 10000);

    lastKnownPosition = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      approximate: false,
    };

    return { position: lastKnownPosition };
  } catch (err: unknown) {
    return {
      position: lastKnownPosition
        ? { ...lastKnownPosition, approximate: true }
        : null,
      error: classifyError(err),
    };
  }
}
