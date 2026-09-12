"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { LocationPrompt } from "@/components/location-prompt";
import { Label } from "@/components/ui/label";
import { useUserLocation } from "@/hooks/use-user-location";
import { useNearbyRecommendations } from "@/hooks/use-nearby";
import type { RestaurantStatus } from "@/lib/types";

const FoodMap = dynamic(() => import("@/components/food-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] items-center justify-center rounded-2xl bg-[var(--surface)] text-sm text-[var(--muted)]">
      Loading map…
    </div>
  ),
});

export default function MapPage() {
  const { location } = useUserLocation();
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [cuisine, setCuisine] = useState("All");
  const [radius, setRadius] = useState(10000);
  const nearby = useNearbyRecommendations(
    location ? { lat: location.lat, lng: location.lng } : null,
    radius,
    "nearest",
  );

  const cuisines = useMemo(() => {
    const set = new Set(nearby.all.map((r) => r.restaurant.cuisine));
    return ["All", ...Array.from(set).sort()];
  }, [nearby.all]);

  const pins = nearby.all.filter((item) => {
    if (item.restaurant.latitude == null || item.restaurant.longitude == null) {
      return false;
    }
    if (statusFilter !== "All" && item.status !== statusFilter) return false;
    if (cuisine !== "All" && item.restaurant.cuisine !== cuisine) return false;
    return true;
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Personal Food Map
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Dulu gue pernah save restoran apa aja di sekitar sini?
        </p>
      </div>

      <LocationPrompt autoRequest={false} />

      <div className="grid gap-3 rounded-2xl bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <select
            className="h-11 w-full rounded-xl border border-[var(--border)] px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {["All", "wishlist", "visited", "favorite", "not_recommended"].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ),
            )}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Cuisine</Label>
          <select
            className="h-11 w-full rounded-xl border border-[var(--border)] px-3 text-sm"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
          >
            {cuisines.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Distance</Label>
          <select
            className="h-11 w-full rounded-xl border border-[var(--border)] px-3 text-sm"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
          >
            {[3000, 5000, 10000, 25000].map((m) => (
              <option key={m} value={m}>
                {(m / 1000).toFixed(0)} km
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {(
          [
            ["wishlist", "#f59e0b"],
            ["favorite", "#e11d48"],
            ["visited", "#059669"],
            ["discover", "#6366f1"],
            ["not_recommended", "#78716c"],
          ] as [RestaurantStatus, string][]
        ).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: color }}
            />
            {status}
          </span>
        ))}
      </div>

      {mounted && (
        <FoodMap
          center={
            location
              ? { lat: location.lat, lng: location.lng }
              : { lat: -6.2297, lng: 106.8101 }
          }
          userLocation={location}
          pins={pins}
        />
      )}

      <p className="text-sm text-[var(--muted)]">{pins.length} pins shown</p>
    </div>
  );
}
