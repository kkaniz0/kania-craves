"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Dice5, Sparkles } from "lucide-react";
import { RestaurantCard } from "@/components/restaurant-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useUserLocation } from "@/hooks/use-user-location";
import { useNearbyRecommendations } from "@/hooks/use-nearby";
import {
  filterForMakanApa,
  surprisePick,
} from "@/lib/recommendation/engine";
import {
  BUDGET_OPTIONS,
  MOOD_OPTIONS,
  type MakanApaFilters,
  type RecommendationResult,
} from "@/lib/types";
import { LocationPrompt } from "@/components/location-prompt";
import { Suspense } from "react";

const selectClass =
  "h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm";

export default function MakanApaPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--muted)]">Loading…</p>}>
      <MakanApaInner />
    </Suspense>
  );
}

function MakanApaInner() {
  const params = useSearchParams();
  const surpriseMode = params.get("mode") === "surprise";
  const { location } = useUserLocation();
  const nearby = useNearbyRecommendations(
    location ? { lat: location.lat, lng: location.lng } : null,
    5000,
    "best_match",
  );

  const [filters, setFilters] = useState<MakanApaFilters>({
    budget: "100–250k",
    maxDistanceKm: 3,
    cuisine: "Any",
    mood: "Comfort Food",
    mealType: "Lunch",
    withWho: "Solo",
    timeAvailable: "45 min",
  });
  const [results, setResults] = useState<RecommendationResult[] | null>(null);
  const [surprise, setSurprise] = useState<RecommendationResult | null>(null);

  const cuisines = useMemo(() => {
    const set = new Set(nearby.all.map((r) => r.restaurant.cuisine));
    return ["Any", ...Array.from(set).sort()];
  }, [nearby.all]);

  function runAssistant(e?: FormEvent) {
    e?.preventDefault();
    const top = filterForMakanApa(nearby.all, filters);
    setResults(top);
    setSurprise(null);
  }

  function runSurprise() {
    const pool = filterForMakanApa(nearby.all, {
      ...filters,
      cuisine: filters.cuisine,
    });
    const pick =
      surprisePick(pool.length ? pool : nearby.all.slice(0, 12)) ?? null;
    setSurprise(pick);
    setResults(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[var(--muted)]">Decision assistant</p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          {surpriseMode ? "Surprise Me" : "Makan Apa?"}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Tell us your constraints — we return explainable picks from your own
          list.
        </p>
      </div>

      <LocationPrompt autoRequest={false} />

      <form
        onSubmit={runAssistant}
        className="grid gap-3 rounded-2xl bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:grid-cols-2"
      >
        <Field label="Budget">
          <select
            className={selectClass}
            value={filters.budget}
            onChange={(e) =>
              setFilters((f) => ({ ...f, budget: e.target.value }))
            }
          >
            {BUDGET_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Max distance (km)">
          <select
            className={selectClass}
            value={filters.maxDistanceKm}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                maxDistanceKm: Number(e.target.value),
              }))
            }
          >
            {[0.5, 1, 2, 3, 5, 10].map((km) => (
              <option key={km} value={km}>
                {km} km
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cuisine">
          <select
            className={selectClass}
            value={filters.cuisine}
            onChange={(e) =>
              setFilters((f) => ({ ...f, cuisine: e.target.value }))
            }
          >
            {cuisines.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Mood">
          <select
            className={selectClass}
            value={filters.mood}
            onChange={(e) =>
              setFilters((f) => ({ ...f, mood: e.target.value }))
            }
          >
            {MOOD_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Meal type">
          <select
            className={selectClass}
            value={filters.mealType}
            onChange={(e) =>
              setFilters((f) => ({ ...f, mealType: e.target.value }))
            }
          >
            {["Breakfast", "Brunch", "Lunch", "Dinner", "Late Night", "Coffee"].map(
              (m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ),
            )}
          </select>
        </Field>
        <Field label="With who">
          <select
            className={selectClass}
            value={filters.withWho}
            onChange={(e) =>
              setFilters((f) => ({ ...f, withWho: e.target.value }))
            }
          >
            {["Solo", "Partner", "Friends", "Family", "Work"].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row">
          <Button type="submit" className="flex-1" size="lg">
            <Sparkles className="h-4 w-4" />
            Get top 3
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            size="lg"
            onClick={runSurprise}
          >
            <Dice5 className="h-4 w-4" />
            Surprise Me
          </Button>
        </div>
      </form>

      {results && (
        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">
            Top 3 Recommendations
          </h2>
          {results.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No matches. Loosen filters or{" "}
              <Link href="/add" className="text-[var(--accent)]">
                add restaurants
              </Link>
              .
            </p>
          ) : (
            <div className="grid gap-4">
              {results.map((item, idx) => (
                <div key={item.restaurant.id} className="space-y-2">
                  <p className="text-sm font-medium text-[var(--accent)]">
                    #{idx + 1} · {item.score}% Match
                  </p>
                  <RestaurantCard item={item} />
                  <ul className="rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm">
                    {item.reasons.map((r) => (
                      <li key={r}>✓ {r}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {surprise && (
        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">
            Your surprise pick
          </h2>
          <RestaurantCard item={surprise} />
          <ul className="rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm">
            {surprise.reasons.map((r) => (
              <li key={r}>✓ {r}</li>
            ))}
          </ul>
          <Button onClick={runSurprise} variant="outline">
            <Dice5 className="h-4 w-4" /> Roll again
          </Button>
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
