"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDemoStore } from "@/hooks/use-demo-store";
import { createCollection, toggleCollectionRestaurant } from "@/lib/demo/store";

const DESTINATIONS = [
  "Jakarta",
  "Bali",
  "Bandung",
  "Singapore",
  "Yogyakarta",
];

export default function TripPage() {
  const store = useDemoStore();
  const [destination, setDestination] = useState("Bali");
  const [tripName, setTripName] = useState("");
  const [dayPlan, setDayPlan] = useState<Record<string, string[]>>({
    "Day 1": [],
  });

  const restMap = useMemo(
    () => new Map(store.restaurants.map((r) => [r.id, r])),
    [store.restaurants],
  );

  const inDestination = useMemo(() => {
    const q = destination.toLowerCase();
    return store.userRestaurants
      .map((ur) => {
        const r = restMap.get(ur.restaurantId);
        if (!r) return null;
        const match =
          r.city.toLowerCase().includes(q) ||
          r.area.toLowerCase().includes(q) ||
          (q === "bali" && r.city.toLowerCase() === "bali");
        if (!match) return null;
        return { ur, restaurant: r };
      })
      .filter(Boolean) as Array<{
      ur: (typeof store.userRestaurants)[0];
      restaurant: (typeof store.restaurants)[0];
    }>;
  }, [store, restMap, destination]);

  const wishlist = inDestination.filter((x) => x.ur.status === "wishlist");
  const grouped = useMemo(() => {
    const map = new Map<string, typeof inDestination>();
    for (const item of inDestination) {
      const key = item.restaurant.area;
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [inDestination]);

  function addToDay(day: string, restaurantId: string) {
    setDayPlan((prev) => {
      const list = prev[day] ?? [];
      if (list.includes(restaurantId)) return prev;
      return { ...prev, [day]: [...list, restaurantId] };
    });
  }

  function saveTripList() {
    const name = tripName.trim() || `${destination} Food Trip`;
    const col = createCollection(name, `Trip mode list for ${destination}`);
    const ids = Object.values(dayPlan).flat();
    for (const id of ids) {
      toggleCollectionRestaurant(col.id, id);
    }
    alert(`Saved “${name}” to Collections`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Trip Mode
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Saved restaurants for your destination, grouped geographically.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {DESTINATIONS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDestination(d)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              destination === d
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--surface)] shadow-[var(--shadow-card)]"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <section className="space-y-2">
        <h2 className="font-[family-name:var(--font-display)] text-xl">
          Wishlist in {destination}
        </h2>
        {wishlist.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No wishlist items for this destination yet.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)] rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-card)]">
            {wishlist.map(({ restaurant, ur }) => (
              <li
                key={restaurant.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <Link href={`/restaurant/${restaurant.id}`}>
                  <p className="font-medium">{restaurant.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {restaurant.area} · {restaurant.cuisine}
                  </p>
                </Link>
                <div className="flex items-center gap-2">
                  <StatusBadge status={ur.status} />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addToDay("Day 1", restaurant.id)}
                  >
                    + Day 1
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl">
          By area
        </h2>
        {grouped.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No saved restaurants match {destination}.
          </p>
        ) : (
          grouped.map(([area, items]) => (
            <div
              key={area}
              className="rounded-2xl bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]"
            >
              <h3 className="font-medium">{area}</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {items.map(({ restaurant, ur }) => (
                  <li key={restaurant.id} className="flex justify-between">
                    <Link href={`/restaurant/${restaurant.id}`}>
                      {restaurant.name}
                    </Link>
                    <StatusBadge status={ur.status} />
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <section className="space-y-3 rounded-2xl bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-[family-name:var(--font-display)] text-xl">
          Food Trip List
        </h2>
        <Input
          placeholder={`${destination} Food Trip`}
          value={tripName}
          onChange={(e) => setTripName(e.target.value)}
        />
        {Object.entries(dayPlan).map(([day, ids]) => (
          <div key={day}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium">{day}</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setDayPlan((p) => ({
                    ...p,
                    [`Day ${Object.keys(p).length + 1}`]: [],
                  }))
                }
              >
                Add day
              </Button>
            </div>
            {ids.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Add restaurants from wishlist above.
              </p>
            ) : (
              <ol className="list-decimal space-y-1 pl-5 text-sm">
                {ids.map((id) => (
                  <li key={id}>{restMap.get(id)?.name ?? id}</li>
                ))}
              </ol>
            )}
          </div>
        ))}
        <Button onClick={saveTripList}>Save to Collections</Button>
      </section>
    </div>
  );
}
