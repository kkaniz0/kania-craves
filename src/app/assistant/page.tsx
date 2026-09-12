"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Navigation, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDemoStore } from "@/hooks/use-demo-store";
import { useUserLocation } from "@/hooks/use-user-location";
import { searchAll } from "@/lib/demo/store";
import { rankRestaurants } from "@/lib/recommendation/engine";
import { formatDistance } from "@/lib/utils";
import type { AssistantResponse } from "@/lib/assistant/schema";
import { googleMapsPlaceUrl } from "@/lib/maps/google";

function parseIntent(query: string) {
  const q = query.toLowerCase();
  const filters = {
    cuisine: null as string | null,
    maxKm: null as number | null,
    wishlistOnly: /wishlist/.test(q),
    unvisited: /belum|never|haven't|unvisited/.test(q),
    highRated: /4\.5|rating/.test(q),
    budgetMax: null as number | null,
    area: null as string | null,
  };
  const cuisines = [
    "japanese",
    "indonesian",
    "italian",
    "korean",
    "chinese",
    "western",
    "coffee",
  ];
  for (const c of cuisines) {
    if (
      q.includes(c) ||
      (c === "japanese" && (q.includes("jepang") || q.includes("ramen")))
    ) {
      filters.cuisine = c[0]!.toUpperCase() + c.slice(1);
      break;
    }
  }
  const km = q.match(/(\d+(?:\.\d+)?)\s*km/);
  if (km) filters.maxKm = Number(km[1]);
  if (/scbd/.test(q)) filters.area = "SCBD";
  if (/senopati/.test(q)) filters.area = "Senopati";
  if (/blok\s*m/.test(q)) filters.area = "Blok M";
  if (/bali/.test(q)) filters.area = "Bali";
  if (/200\s*ribu|200k|dibawah 200/.test(q)) filters.budgetMax = 2;
  return filters;
}

export default function AssistantPage() {
  const store = useDemoStore();
  const { location } = useUserLocation();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssistantResponse | null>(null);

  const ranked = useMemo(
    () =>
      rankRestaurants(
        store.restaurants,
        store.userRestaurants,
        store.visits,
        store.preferences,
        location ? { lat: location.lat, lng: location.lng } : null,
        10000,
      ),
    [store, location],
  );

  const restById = useMemo(
    () => new Map(store.restaurants.map((r) => [r.id, r])),
    [store.restaurants],
  );

  async function onAsk(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);

    const intent = parseIntent(input);
    let pool = ranked;

    if (intent.wishlistOnly) {
      pool = pool.filter((r) => r.status === "wishlist");
    }
    if (intent.unvisited) {
      pool = pool.filter(
        (r) => r.status === "wishlist" || r.status === "discover",
      );
    }
    if (intent.cuisine) {
      pool = pool.filter(
        (r) =>
          r.restaurant.cuisine.toLowerCase() === intent.cuisine!.toLowerCase(),
      );
    }
    if (intent.maxKm != null) {
      pool = pool.filter(
        (r) =>
          r.distanceMeters != null &&
          r.distanceMeters <= intent.maxKm! * 1000,
      );
    }
    if (intent.budgetMax != null) {
      pool = pool.filter((r) => r.restaurant.priceLevel <= intent.budgetMax!);
    }
    if (intent.area) {
      pool = pool.filter(
        (r) =>
          r.restaurant.area
            .toLowerCase()
            .includes(intent.area!.toLowerCase()) ||
          r.restaurant.city
            .toLowerCase()
            .includes(intent.area!.toLowerCase()),
      );
    }
    if (intent.highRated) {
      pool = pool.filter((r) => {
        const rating =
          r.userRestaurant?.personalRating ?? r.restaurant.externalRating ?? 0;
        return rating >= 4.5;
      });
    }

    if (!pool.length) {
      const textHits = searchAll(input);
      pool = ranked.filter((r) =>
        textHits.some((t) => t.id === r.restaurant.id),
      );
    }

    // If still empty, send nearby personal restaurants as context anyway
    const contextPool = (pool.length ? pool : ranked).slice(0, 8);

    const personalMatches = contextPool.map((r) => ({
      id: r.restaurant.id,
      name: r.restaurant.name,
      cuisine: r.restaurant.cuisine,
      area: r.restaurant.area,
      city: r.restaurant.city,
      address: r.restaurant.address,
      status: r.status,
      distanceLabel: formatDistance(r.distanceMeters),
      score: r.score,
      priceLevel: r.restaurant.priceLevel,
      notes: r.userRestaurant?.notes ?? "",
      recommendedMenu: r.userRestaurant?.recommendedMenu ?? "",
    }));

    const favoriteCuisines = Object.entries(store.preferences.cuisineWeights)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name]) => name);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: input.trim(),
          location: location
            ? {
                area: location.area,
                city: location.city,
                lat: location.lat,
                lng: location.lng,
              }
            : null,
          personalMatches,
          tasteSummary: {
            favoriteCuisines,
            favoriteAreas: store.preferences.favoriteAreas,
            budgetPreference: store.preferences.budgetPreference,
          },
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error || "Assistant request failed");
      }

      const data = (await res.json()) as AssistantResponse;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <p className="label-caps">AI + your list</p>
        <h1 className="heading-soft text-3xl">Food Assistant</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Tanya dalam bahasa natural. List kamu jadi sumber utama — insight
          eksternal dari AI buat konteks area & discover tips.
        </p>
      </div>

      <form onSubmit={onAsk} className="space-y-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Gue lagi di SCBD, makan apa? / Cari Jepang di bawah 200rb max 2km yang belum pernah gue datengin."
          rows={4}
        />
        <Button type="submit" className="w-full" disabled={loading || !input.trim()}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Ask
            </>
          )}
        </Button>
      </form>

      {error && (
        <p className="rounded-2xl bg-[var(--vanilla)] px-4 py-3 text-sm text-[var(--cocoa)]">
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-4">
          <div className="rhode-card space-y-2 p-4">
            <p className="label-caps">Answer</p>
            <p className="text-sm leading-relaxed text-[var(--cocoa)]">
              {result.reply}
            </p>
          </div>

          {result.personalPicks.length > 0 && (
            <section className="space-y-2">
              <h2 className="label-caps">From your list</h2>
              <ul className="space-y-2">
                {result.personalPicks.map((pick) => {
                  const rest = restById.get(pick.id);
                  const mapsUrl =
                    pick.mapsUrl ||
                    (rest
                      ? googleMapsPlaceUrl(rest)
                      : "#");
                  return (
                    <li
                      key={pick.id}
                      className="rounded-[1.25rem] bg-white px-4 py-3 shadow-[var(--shadow-card)]"
                    >
                      <Link href={`/restaurant/${pick.id}`} className="block">
                        <p className="text-sm font-semibold uppercase tracking-[0.06em]">
                          {rest?.name ?? pick.id}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--muted)]">
                          {pick.why}
                        </p>
                      </Link>
                      <div className="mt-3 flex gap-2">
                        <Button asChild size="sm" className="flex-1">
                          <a href={mapsUrl} target="_blank" rel="noreferrer">
                            <Navigation className="h-3.5 w-3.5" />
                            Google Maps
                          </a>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="flex-1">
                          <Link href={`/restaurant/${pick.id}`}>Open</Link>
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {result.externalInsights.length > 0 && (
            <section className="space-y-2">
              <h2 className="label-caps">External insights</h2>
              <ul className="space-y-2">
                {result.externalInsights.map((insight) => (
                  <li
                    key={`${insight.title}-${insight.type}`}
                    className="rounded-[1.25rem] bg-[var(--lilac)]/40 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-[var(--cocoa)]">
                      {insight.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                      {insight.detail}
                    </p>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--berry)]">
                      {insight.type}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.discoverIdeas.length > 0 && (
            <section className="space-y-2">
              <h2 className="label-caps">Discover ideas (not in your list)</h2>
              <ul className="space-y-2">
                {result.discoverIdeas.map((idea) => {
                  const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(idea.mapsQuery || `${idea.name}, ${idea.area}, ${idea.city}`)}`;
                  return (
                    <li
                      key={`${idea.name}-${idea.area}`}
                      className="rounded-[1.25rem] bg-[var(--matcha)]/50 px-4 py-3"
                    >
                      <p className="text-sm font-semibold">{idea.name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {[idea.area, idea.city].filter(Boolean).join(" · ")}
                      </p>
                      {idea.address && (
                        <p className="text-[11px] text-[var(--muted)]">
                          {idea.address}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-[var(--cocoa)]">{idea.why}</p>
                      <div className="mt-3 flex gap-2">
                        <Button asChild size="sm" className="flex-1">
                          <a
                            href={idea.mapsUrl || searchUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Navigation className="h-3.5 w-3.5" />
                            Directions
                          </a>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="flex-1">
                          <a href={searchUrl} target="_blank" rel="noreferrer">
                            Open in Maps
                          </a>
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
