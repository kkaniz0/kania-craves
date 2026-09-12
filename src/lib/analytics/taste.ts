import type {
  DemoStore,
  Restaurant,
  RestaurantVisit,
  UserRestaurant,
} from "../types";

export interface TasteProfile {
  favoriteCuisine: { name: string; pct: number }[];
  favoriteNeighborhoods: { name: string; count: number }[];
  averageSpending: number | null;
  averageRating: number | null;
  favoriteCategory: string | null;
  newVsRepeat: { neu: number; repeat: number };
  restaurantsSaved: number;
  restaurantsVisited: number;
  wishlistRemaining: number;
  favoriteCount: number;
  totalVisits: number;
  newThisYear: number;
  mostVisitedRestaurant: { name: string; count: number } | null;
  mostVisitedArea: string | null;
  visitedThisMonth: number;
  visitedThisYear: number;
  explorerLevel: number;
  achievements: string[];
}

function yearOf(date: string): number {
  return new Date(date).getFullYear();
}

function monthKey(date: string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

export function computeTasteProfile(store: DemoStore): TasteProfile {
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = `${thisYear}-${now.getMonth()}`;

  const restMap = new Map(store.restaurants.map((r) => [r.id, r]));

  const visitedUrs = store.userRestaurants.filter(
    (u) =>
      u.status === "visited" ||
      u.status === "favorite" ||
      u.status === "want_to_try_again" ||
      u.lastVisited,
  );

  const cuisineCounts: Record<string, number> = {};
  for (const ur of store.userRestaurants) {
    const r = restMap.get(ur.restaurantId);
    if (!r) continue;
    const w =
      ur.status === "favorite" ? 3 : ur.status === "visited" ? 2 : 1;
    cuisineCounts[r.cuisine] = (cuisineCounts[r.cuisine] ?? 0) + w;
  }
  const cuisineTotal = Object.values(cuisineCounts).reduce((a, b) => a + b, 0) || 1;
  const favoriteCuisine = Object.entries(cuisineCounts)
    .map(([name, count]) => ({
      name,
      pct: Math.round((count / cuisineTotal) * 100),
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  const areaCounts: Record<string, number> = {};
  for (const ur of visitedUrs) {
    const r = restMap.get(ur.restaurantId);
    if (!r) continue;
    areaCounts[r.area] = (areaCounts[r.area] ?? 0) + 1;
  }
  const favoriteNeighborhoods = Object.entries(areaCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const spendings = store.visits
    .map((v) => v.spending)
    .filter((s): s is number => s != null);
  const averageSpending = spendings.length
    ? Math.round(spendings.reduce((a, b) => a + b, 0) / spendings.length)
    : null;

  const ratings = [
    ...store.userRestaurants
      .map((u) => u.personalRating)
      .filter((r): r is number => r != null),
    ...store.visits
      .map((v) => v.rating)
      .filter((r): r is number => r != null),
  ];
  const averageRating = ratings.length
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    : null;

  const catCounts: Record<string, number> = {};
  for (const ur of visitedUrs) {
    const r = restMap.get(ur.restaurantId);
    if (!r) continue;
    catCounts[r.category] = (catCounts[r.category] ?? 0) + 1;
  }
  const favoriteCategory =
    Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const visitCountByRest = new Map<string, number>();
  for (const v of store.visits) {
    visitCountByRest.set(
      v.restaurantId,
      (visitCountByRest.get(v.restaurantId) ?? 0) + 1,
    );
  }
  let neu = 0;
  let repeat = 0;
  for (const [, count] of visitCountByRest) {
    if (count === 1) neu++;
    else {
      neu++;
      repeat += count - 1;
    }
  }

  const mostVisitedEntry = [...visitCountByRest.entries()].sort(
    (a, b) => b[1] - a[1],
  )[0];
  const mostVisitedRestaurant = mostVisitedEntry
    ? {
        name: restMap.get(mostVisitedEntry[0])?.name ?? "Unknown",
        count: mostVisitedEntry[1],
      }
    : null;

  const visitedThisMonth = store.visits.filter(
    (v) => monthKey(v.visitDate) === thisMonth,
  ).length;
  const visitedThisYear = store.visits.filter(
    (v) => yearOf(v.visitDate) === thisYear,
  ).length;

  const newThisYear = visitedUrs.filter((u) => {
    const first = store.visits
      .filter((v) => v.restaurantId === u.restaurantId)
      .sort((a, b) => a.visitDate.localeCompare(b.visitDate))[0];
    return first && yearOf(first.visitDate) === thisYear;
  }).length;

  const restaurantsVisited = visitedUrs.length;
  const uniqueCuisines = new Set(
    visitedUrs
      .map((u) => restMap.get(u.restaurantId)?.cuisine)
      .filter(Boolean),
  ).size;
  const uniqueAreas = favoriteNeighborhoods.length;

  const achievements: string[] = [];
  if (restaurantsVisited >= 10) achievements.push("10 Restaurants Tried");
  if (restaurantsVisited >= 50) achievements.push("50 Restaurants Tried");
  if (uniqueCuisines >= 5) achievements.push("5 Different Cuisines");
  if (uniqueAreas >= 3 && favoriteNeighborhoods.some((a) => a.name === "Senopati" || a.name === "SCBD" || a.name === "Blok M")) {
    achievements.push("Jakarta Explorer");
  }
  if (
    store.userRestaurants.some((u) => {
      const r = restMap.get(u.restaurantId);
      return r?.city === "Bali";
    })
  ) {
    achievements.push("Bali Food Explorer");
  }

  const explorerLevel = Math.min(
    10,
    1 + Math.floor(restaurantsVisited / 5) + Math.floor(uniqueCuisines / 2),
  );

  return {
    favoriteCuisine,
    favoriteNeighborhoods,
    averageSpending,
    averageRating,
    favoriteCategory,
    newVsRepeat: { neu, repeat },
    restaurantsSaved: store.userRestaurants.length,
    restaurantsVisited,
    wishlistRemaining: store.userRestaurants.filter((u) => u.status === "wishlist")
      .length,
    favoriteCount: store.userRestaurants.filter(
      (u) => u.favorite || u.status === "favorite",
    ).length,
    totalVisits: store.visits.length,
    newThisYear,
    mostVisitedRestaurant,
    mostVisitedArea: favoriteNeighborhoods[0]?.name ?? null,
    visitedThisMonth,
    visitedThisYear,
    explorerLevel,
    achievements,
  };
}

export function formatIdr(amount: number | null): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getRestaurantWithUser(
  store: DemoStore,
  id: string,
): { restaurant: Restaurant; userRestaurant: UserRestaurant | null; visits: RestaurantVisit[] } | null {
  const restaurant = store.restaurants.find((r) => r.id === id);
  if (!restaurant) return null;
  const userRestaurant =
    store.userRestaurants.find((u) => u.restaurantId === id) ?? null;
  const visits = store.visits
    .filter((v) => v.restaurantId === id)
    .sort((a, b) => b.visitDate.localeCompare(a.visitDate));
  return { restaurant, userRestaurant, visits };
}
