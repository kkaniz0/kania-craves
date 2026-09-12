import type { Coordinates } from "@/lib/types";

export type NavPlace = {
  name: string;
  address?: string | null;
  area?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

/** Human-readable place query Google Maps resolves more accurately than rough demo coords. */
export function placeQuery(place: NavPlace): string {
  const parts = [place.name, place.address, place.area, place.city].filter(
    (p): p is string => !!p && p.trim().length > 0,
  );
  // Prefer name + address; fall back to name + area + city
  if (place.address?.trim()) {
    return [place.name, place.address, place.city].filter(Boolean).join(", ");
  }
  return parts.join(", ");
}

/**
 * Open Google Maps directions.
 * Uses place name/address as destination (more accurate than approximate lat/lng).
 * Falls back to coordinates only if no name is available.
 */
export function googleMapsDirectionsUrl(
  place: NavPlace,
  origin?: Coordinates | null,
): string {
  const params = new URLSearchParams({ api: "1" });

  if (origin) {
    params.set("origin", `${origin.lat},${origin.lng}`);
  }

  const query = placeQuery(place);
  if (query) {
    params.set("destination", query);
  } else if (place.latitude != null && place.longitude != null) {
    params.set("destination", `${place.latitude},${place.longitude}`);
  } else {
    params.set("destination", place.name || "restaurant");
  }

  // Travel mode: walking is common for nearby food; user can switch in Maps
  params.set("travelmode", "walking");

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Open a place in Google Maps (view, not directions). */
export function googleMapsPlaceUrl(place: NavPlace): string {
  const query = placeQuery(place);
  if (query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }
  if (place.latitude != null && place.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;
}
