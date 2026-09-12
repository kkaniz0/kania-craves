import type { Coordinates } from "../types";
import { haversineMeters } from "../utils";

export interface AreaPreset {
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  aliases: string[];
}

export const AREA_PRESETS: AreaPreset[] = [
  {
    name: "Senopati",
    city: "Jakarta",
    country: "Indonesia",
    lat: -6.2297,
    lng: 106.8101,
    aliases: ["senopati", "kebayoran baru"],
  },
  {
    name: "SCBD",
    city: "Jakarta",
    country: "Indonesia",
    lat: -6.227,
    lng: 106.8087,
    aliases: ["scbd", "sudirman", "lot 10"],
  },
  {
    name: "Blok M",
    city: "Jakarta",
    country: "Indonesia",
    lat: -6.2443,
    lng: 106.7995,
    aliases: ["blok m", "blokm"],
  },
  {
    name: "Menteng",
    city: "Jakarta",
    country: "Indonesia",
    lat: -6.1944,
    lng: 106.8294,
    aliases: ["menteng"],
  },
  {
    name: "Kemang",
    city: "Jakarta",
    country: "Indonesia",
    lat: -6.2607,
    lng: 106.8133,
    aliases: ["kemang"],
  },
  {
    name: "PIK",
    city: "Jakarta",
    country: "Indonesia",
    lat: -6.1089,
    lng: 106.7403,
    aliases: ["pik", "pantai induh kapuk", "pantai indah kapuk"],
  },
  {
    name: "Thamrin",
    city: "Jakarta",
    country: "Indonesia",
    lat: -6.194,
    lng: 106.8229,
    aliases: ["thamrin", "bundaran hi"],
  },
  {
    name: "Canggu",
    city: "Bali",
    country: "Indonesia",
    lat: -8.6478,
    lng: 115.1385,
    aliases: ["canggu", "bali"],
  },
  {
    name: "Bandung",
    city: "Bandung",
    country: "Indonesia",
    lat: -6.9175,
    lng: 107.6191,
    aliases: ["bandung"],
  },
  {
    name: "Orchard",
    city: "Singapore",
    country: "Singapore",
    lat: 1.3048,
    lng: 103.8318,
    aliases: ["orchard", "singapore"],
  },
];

export function findNearestArea(coords: Coordinates): AreaPreset {
  let best = AREA_PRESETS[0]!;
  let bestDist = Infinity;
  for (const area of AREA_PRESETS) {
    const d = haversineMeters(coords, { lat: area.lat, lng: area.lng });
    if (d < bestDist) {
      bestDist = d;
      best = area;
    }
  }
  return best;
}

export function searchAreas(query: string): AreaPreset[] {
  const q = query.trim().toLowerCase();
  if (!q) return AREA_PRESETS.slice(0, 8);
  return AREA_PRESETS.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.aliases.some((alias) => alias.includes(q)),
  );
}

export function resolveManualLocation(query: string): AreaPreset | null {
  const matches = searchAreas(query);
  if (!matches.length) return null;
  const exact = matches.find(
    (m) =>
      m.name.toLowerCase() === query.trim().toLowerCase() ||
      m.aliases.includes(query.trim().toLowerCase()),
  );
  return exact ?? matches[0] ?? null;
}
