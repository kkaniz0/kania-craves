"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDemoStore } from "@/hooks/use-demo-store";
import { useUserLocation } from "@/hooks/use-user-location";
import {
  createCollection,
  toggleCollectionRestaurant,
  updateUserRestaurant,
} from "@/lib/demo/store";
import { formatDistance, haversineMeters, priceLabel } from "@/lib/utils";
import type { Priority, RestaurantStatus } from "@/lib/types";

type Tab = "wishlist" | "visited" | "favorites" | "collections";

export default function SavedPage() {
  const store = useDemoStore();
  const { location } = useUserLocation();
  const [tab, setTab] = useState<Tab>("wishlist");
  const [newCol, setNewCol] = useState("");

  const restMap = useMemo(
    () => new Map(store.restaurants.map((r) => [r.id, r])),
    [store.restaurants],
  );

  const rows = useMemo(() => {
    return store.userRestaurants
      .map((ur) => {
        const restaurant = restMap.get(ur.restaurantId);
        if (!restaurant) return null;
        const distance =
          location &&
          restaurant.latitude != null &&
          restaurant.longitude != null
            ? haversineMeters(
                { lat: location.lat, lng: location.lng },
                { lat: restaurant.latitude, lng: restaurant.longitude },
              )
            : null;
        return { ur, restaurant, distance };
      })
      .filter(Boolean) as Array<{
      ur: (typeof store.userRestaurants)[0];
      restaurant: (typeof store.restaurants)[0];
      distance: number | null;
    }>;
  }, [store, restMap, location]);

  const wishlist = rows
    .filter((r) => r.ur.status === "wishlist")
    .sort((a, b) => priorityRank(a.ur.priority) - priorityRank(b.ur.priority));
  const visited = rows.filter(
    (r) =>
      r.ur.status === "visited" ||
      r.ur.status === "want_to_try_again" ||
      r.ur.lastVisited,
  );
  const favorites = rows.filter(
    (r) => r.ur.favorite || r.ur.status === "favorite",
  );

  function onCreateCollection(e: FormEvent) {
    e.preventDefault();
    if (!newCol.trim()) return;
    createCollection(newCol.trim());
    setNewCol("");
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Saved
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Wishlist, visits, favorites, and collections.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {(
          [
            ["wishlist", "Wishlist"],
            ["visited", "Visited"],
            ["favorites", "Favorites"],
            ["collections", "Collections"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
              tab === id
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-card)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "wishlist" && (
        <Table
          empty="Belum ada wishlist. Tambahkan restoran yang ingin dicoba."
          rows={wishlist}
          showPriority
          onPriority={(id, priority) =>
            updateUserRestaurant(id, { priority })
          }
        />
      )}
      {tab === "visited" && (
        <Table empty="Belum ada restoran yang dikunjungi." rows={visited} />
      )}
      {tab === "favorites" && (
        <Table empty="Belum ada favorite." rows={favorites} />
      )}

      {tab === "collections" && (
        <div className="space-y-4">
          <form onSubmit={onCreateCollection} className="flex gap-2">
            <Input
              value={newCol}
              onChange={(e) => setNewCol(e.target.value)}
              placeholder="New collection name"
            />
            <Button type="submit">Create</Button>
          </form>
          {store.collections.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No collections yet.</p>
          ) : (
            <div className="space-y-3">
              {store.collections.map((col) => (
                <div
                  key={col.id}
                  className="rounded-2xl bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]"
                >
                  <h3 className="font-[family-name:var(--font-display)] text-xl">
                    {col.name}
                  </h3>
                  {col.description && (
                    <p className="text-sm text-[var(--muted)]">
                      {col.description}
                    </p>
                  )}
                  <ul className="mt-3 space-y-2">
                    {col.restaurantIds.map((rid) => {
                      const r = restMap.get(rid);
                      if (!r) return null;
                      return (
                        <li
                          key={rid}
                          className="flex items-center justify-between text-sm"
                        >
                          <Link
                            href={`/restaurant/${rid}`}
                            className="font-medium hover:text-[var(--accent)]"
                          >
                            {r.name}
                          </Link>
                          <button
                            type="button"
                            className="text-xs text-[var(--muted)]"
                            onClick={() =>
                              toggleCollectionRestaurant(col.id, rid)
                            }
                          >
                            Remove
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function priorityRank(p: Priority) {
  return p === "high" ? 0 : p === "medium" ? 1 : 2;
}

function Table({
  rows,
  empty,
  showPriority,
  onPriority,
}: {
  rows: Array<{
    ur: {
      restaurantId: string;
      status: RestaurantStatus;
      priority: Priority;
    };
    restaurant: {
      id: string;
      name: string;
      area: string;
      cuisine: string;
      priceLevel: number;
    };
    distance: number | null;
  }>;
  empty: string;
  showPriority?: boolean;
  onPriority?: (restaurantId: string, priority: Priority) => void;
}) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted)]">
        {empty}{" "}
        <Link href="/add" className="text-[var(--accent)]">
          Add one
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-card)]">
      <div className="hidden grid-cols-12 gap-2 border-b border-[var(--border)] px-4 py-2 text-xs uppercase tracking-wide text-[var(--muted)] sm:grid">
        <span className="col-span-4">Restaurant</span>
        <span className="col-span-2">Area</span>
        <span className="col-span-2">Cuisine</span>
        {showPriority && <span className="col-span-2">Priority</span>}
        <span className="col-span-2">Distance</span>
      </div>
      <ul className="divide-y divide-[var(--border)]">
        {rows.map(({ ur, restaurant, distance }) => (
          <li key={restaurant.id} className="px-4 py-3">
            <Link
              href={`/restaurant/${restaurant.id}`}
              className="grid grid-cols-1 gap-1 sm:grid-cols-12 sm:items-center sm:gap-2"
            >
              <div className="col-span-4 flex items-center gap-2">
                <span className="font-medium">{restaurant.name}</span>
                <StatusBadge status={ur.status} />
              </div>
              <span className="col-span-2 text-sm text-[var(--muted)]">
                {restaurant.area}
              </span>
              <span className="col-span-2 text-sm">
                {restaurant.cuisine} · {priceLabel(restaurant.priceLevel)}
              </span>
              {showPriority && (
                <span className="col-span-2">
                  <select
                    className="h-8 rounded-lg border border-[var(--border)] px-2 text-xs"
                    value={ur.priority}
                    onClick={(e) => e.preventDefault()}
                    onChange={(e) =>
                      onPriority?.(
                        restaurant.id,
                        e.target.value as Priority,
                      )
                    }
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </span>
              )}
              <span className="col-span-2 text-sm font-medium text-[var(--accent)]">
                {formatDistance(distance)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
