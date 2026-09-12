"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useDemoStore } from "@/hooks/use-demo-store";
import { computeTasteProfile, formatIdr } from "@/lib/analytics/taste";
import { resetDemoStore, updatePreferences } from "@/lib/demo/store";
import { useMemo } from "react";

export default function ProfilePage() {
  const store = useDemoStore();
  const profile = useMemo(() => computeTasteProfile(store), [store]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        <p className="text-sm text-[var(--muted)]">Signed in as</p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          {store.profile.displayName}
        </h1>
        <p className="text-sm text-[var(--muted)]">{store.profile.email}</p>
        <p className="mt-2 inline-flex rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-medium">
          Demo mode · Explorer Level {profile.explorerLevel}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/auth">Account / Auth</Link>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              if (confirm("Reset all demo data to the Jakarta seed?")) {
                resetDemoStore();
              }
            }}
          >
            Reset demo data
          </Button>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          2026 Food Journey
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Visited" value={String(profile.restaurantsVisited)} />
          <Stat label="New this year" value={String(profile.newThisYear)} />
          <Stat label="Total visits" value={String(profile.totalVisits)} />
          <Stat label="Wishlist left" value={String(profile.wishlistRemaining)} />
          <Stat label="Favorites" value={String(profile.favoriteCount)} />
          <Stat label="Saved" value={String(profile.restaurantsSaved)} />
          <Stat
            label="Avg rating"
            value={profile.averageRating?.toFixed(1) ?? "—"}
          />
          <Stat
            label="Avg spend"
            value={formatIdr(profile.averageSpending)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat
            label="Favorite area"
            value={profile.mostVisitedArea ?? "—"}
          />
          <Stat
            label="Most visited"
            value={
              profile.mostVisitedRestaurant
                ? `${profile.mostVisitedRestaurant.name} (${profile.mostVisitedRestaurant.count}x)`
                : "—"
            }
          />
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Your Food DNA
        </h2>
        <div className="space-y-3">
          {profile.favoriteCuisine.map((c) => (
            <div key={c.name}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{c.name}</span>
                <span className="text-[var(--muted)]">{c.pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${c.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="pt-2 text-sm text-[var(--muted)]">
          New vs repeat visits: {profile.newVsRepeat.neu} new ·{" "}
          {profile.newVsRepeat.repeat} repeat
        </p>
      </section>

      <section className="space-y-3 rounded-2xl bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Achievements
        </h2>
        {profile.achievements.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Keep exploring — achievements unlock as you log visits.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {profile.achievements.map((a) => (
              <li
                key={a}
                className="rounded-full bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium"
              >
                {a}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-2xl bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">
          Privacy
        </h2>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>
            Save Location History
            <span className="mt-0.5 block text-xs text-[var(--muted)]">
              Off by default. Exact coordinates are never stored unless enabled.
            </span>
          </span>
          <input
            type="checkbox"
            checked={store.preferences.saveLocationHistory}
            onChange={(e) =>
              updatePreferences({ saveLocationHistory: e.target.checked })
            }
          />
        </label>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-xl">
        {value}
      </p>
    </div>
  );
}
