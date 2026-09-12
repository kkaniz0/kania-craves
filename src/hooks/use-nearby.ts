"use client";

import { useMemo } from "react";
import type { Coordinates, RecommendationResult } from "@/lib/types";
import { useDemoStore } from "@/hooks/use-demo-store";
import {
  rankRestaurants,
  sortRecommendations,
} from "@/lib/recommendation/engine";

export function useNearbyRecommendations(
  location: Coordinates | null,
  radiusMeters = 3000,
  sortId = "best_match",
) {
  const store = useDemoStore();

  return useMemo(() => {
    const ranked = rankRestaurants(
      store.restaurants,
      store.userRestaurants,
      store.visits,
      store.preferences,
      location,
      radiusMeters,
    );
    const visitCounts = new Map<string, number>();
    for (const v of store.visits) {
      visitCounts.set(v.restaurantId, (visitCounts.get(v.restaurantId) ?? 0) + 1);
    }
    const sorted = sortRecommendations(ranked, sortId, visitCounts);
    return {
      all: sorted,
      topPick: sorted[0] ?? null,
      wishlist: sorted.filter((r) => r.status === "wishlist").slice(0, 8),
      favorites: sorted
        .filter((r) => r.status === "favorite" || r.userRestaurant?.favorite)
        .slice(0, 8),
      visited: sorted.filter((r) => r.status === "visited").slice(0, 8),
      personalNearby: sorted.filter((r) => r.userRestaurant).slice(0, 12),
      recent: [...store.visits]
        .sort((a, b) => b.visitDate.localeCompare(a.visitDate))
        .slice(0, 5)
        .map((v) => {
          const restaurant = store.restaurants.find(
            (r) => r.id === v.restaurantId,
          );
          if (!restaurant) return null;
          const ur =
            store.userRestaurants.find((u) => u.restaurantId === v.restaurantId) ??
            null;
          const match = sorted.find((s) => s.restaurant.id === v.restaurantId);
          if (match) return match;
          const fallback: RecommendationResult = {
            restaurant,
            userRestaurant: ur,
            score: 0,
            distanceMeters: null,
            reasons: [],
            status: ur?.status ?? "visited",
          };
          return fallback;
        })
        .filter(Boolean) as RecommendationResult[],
    };
  }, [store, location, radiusMeters, sortId]);
}
