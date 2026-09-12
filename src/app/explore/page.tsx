"use client";

import { useMemo, useState } from "react";
import { RestaurantCard } from "@/components/restaurant-card";
import { LocationPrompt } from "@/components/location-prompt";
import { Label } from "@/components/ui/label";
import { useUserLocation } from "@/hooks/use-user-location";
import { useNearbyRecommendations } from "@/hooks/use-nearby";
import { RADIUS_OPTIONS, SORT_OPTIONS } from "@/lib/types";

export default function ExplorePage() {
  const { location } = useUserLocation();
  const [radius, setRadius] = useState(3000);
  const [sortId, setSortId] = useState("best_match");
  const [cuisine, setCuisine] = useState("All");
  const [status, setStatus] = useState("All");
  const [minRating, setMinRating] = useState(0);

  const nearby = useNearbyRecommendations(
    location ? { lat: location.lat, lng: location.lng } : null,
    radius,
    sortId,
  );

  const cuisines = useMemo(() => {
    const set = new Set(nearby.all.map((r) => r.restaurant.cuisine));
    return ["All", ...Array.from(set).sort()];
  }, [nearby.all]);

  const filtered = nearby.all.filter((item) => {
    if (cuisine !== "All" && item.restaurant.cuisine !== cuisine) return false;
    if (status !== "All" && item.status !== status) return false;
    const rating =
      item.userRestaurant?.personalRating ?? item.restaurant.externalRating ?? 0;
    if (rating < minRating) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Explore nearby
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Personal restaurants within your radius — sorted your way.
        </p>
      </div>

      <LocationPrompt autoRequest={false} />

      <div className="grid gap-3 rounded-2xl bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Radius</Label>
          <select
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
          >
            {RADIUS_OPTIONS.map((o) => (
              <option key={o.meters} value={o.meters}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Sort</Label>
          <select
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
            value={sortId}
            onChange={(e) => setSortId(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Cuisine</Label>
          <select
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
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
          <Label>Status</Label>
          <select
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {["All", "wishlist", "favorite", "visited", "discover"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Min rating: {minRating || "Any"}</Label>
          <input
            type="range"
            min={0}
            max={5}
            step={0.5}
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <p className="text-sm text-[var(--muted)]">
        Showing {filtered.slice(0, 10).length} of {filtered.length} (capped at 10
        to avoid decision fatigue)
      </p>

      {!location ? (
        <p className="text-sm text-[var(--muted)]">
          Set a location to explore nearby places.
        </p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted)]">
          Belum ada restoran di radius ini. Coba perbesar radius atau tambah
          restoran.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.slice(0, 10).map((item) => (
            <RestaurantCard key={item.restaurant.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
