import type {
  Coordinates,
  MakanApaFilters,
  RecommendationResult,
  RecommendationWeights,
  Restaurant,
  RestaurantStatus,
  RestaurantVisit,
  UserPreferences,
  UserRestaurant,
} from "../types";
import { DEFAULT_WEIGHTS } from "../types";
import { haversineMeters } from "../utils";

export interface ScoreInput {
  restaurant: Restaurant;
  userRestaurant: UserRestaurant | null;
  userLocation: Coordinates | null;
  preferences: UserPreferences;
  visits: RestaurantVisit[];
  radiusMeters?: number;
  openNow?: boolean;
}

function resolveStatus(ur: UserRestaurant | null): RestaurantStatus {
  if (!ur) return "discover";
  if (ur.favorite || ur.status === "favorite") return "favorite";
  return ur.status;
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const ms = Date.now() - new Date(dateStr).getTime();
  return ms / (1000 * 60 * 60 * 24);
}

export function scoreRestaurant(input: ScoreInput): RecommendationResult {
  const {
    restaurant,
    userRestaurant,
    userLocation,
    preferences,
    visits,
    openNow = true,
  } = input;
  const weights: RecommendationWeights =
    preferences.recommendationWeights ?? DEFAULT_WEIGHTS;

  let score = 0;
  const reasons: string[] = [];
  const status = resolveStatus(userRestaurant);

  let distanceMeters: number | null = null;
  if (
    userLocation &&
    restaurant.latitude != null &&
    restaurant.longitude != null
  ) {
    distanceMeters = haversineMeters(userLocation, {
      lat: restaurant.latitude,
      lng: restaurant.longitude,
    });
  }

  if (status === "wishlist") {
    score += weights.wishlist;
    reasons.push("On your Wishlist");
  }

  if (status === "favorite" || userRestaurant?.favorite) {
    score += weights.favorite;
    reasons.push("One of your Favorites");
  }

  const cuisinePref = preferences.cuisineWeights[restaurant.cuisine] ?? 0;
  if (cuisinePref >= 15) {
    score += weights.cuisine;
    reasons.push(`${restaurant.cuisine} is one of your favorite cuisines`);
  } else if (cuisinePref >= 8) {
    score += Math.round(weights.cuisine * 0.5);
    reasons.push(`You often enjoy ${restaurant.cuisine}`);
  }

  if (distanceMeters != null) {
    if (distanceMeters <= 500) {
      score += weights.distance;
      reasons.push(`Only ${Math.round(distanceMeters)}m away`);
    } else if (distanceMeters <= 1500) {
      score += Math.round(weights.distance * 0.75);
      reasons.push(`Nearby — ${(distanceMeters / 1000).toFixed(1)} km`);
    } else if (distanceMeters <= 3000) {
      score += Math.round(weights.distance * 0.4);
      reasons.push(`${(distanceMeters / 1000).toFixed(1)} km away`);
    } else if (distanceMeters <= 5000) {
      score += Math.round(weights.distance * 0.15);
    }
  }

  const rating =
    userRestaurant?.personalRating ?? restaurant.externalRating ?? null;
  if (rating != null && rating >= 4.5) {
    score += weights.rating;
    reasons.push("Highly rated");
  } else if (rating != null && rating >= 4.0) {
    score += Math.round(weights.rating * 0.6);
    reasons.push("Well rated");
  }

  if (openNow) {
    score += weights.openNow;
    reasons.push("Open now");
  }

  if (
    preferences.pricePreference &&
    restaurant.priceLevel <= preferences.pricePreference
  ) {
    score += weights.price;
    reasons.push("Fits your typical budget");
  }

  if (status === "not_recommended") {
    score += weights.disliked;
    reasons.push("Previously marked not recommended");
  }

  const lastVisit =
    userRestaurant?.lastVisited ??
    visits
      .filter((v) => v.restaurantId === restaurant.id)
      .sort((a, b) => b.visitDate.localeCompare(a.visitDate))[0]?.visitDate ??
    null;
  const days = daysSince(lastVisit);
  if (days != null && days < 14) {
    score += weights.recentVisit;
    reasons.push("Visited very recently");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    restaurant,
    userRestaurant,
    score,
    distanceMeters,
    reasons: reasons.slice(0, 5),
    status,
  };
}

export function rankRestaurants(
  restaurants: Restaurant[],
  userRestaurants: UserRestaurant[],
  visits: RestaurantVisit[],
  preferences: UserPreferences,
  userLocation: Coordinates | null,
  radiusMeters = 3000,
): RecommendationResult[] {
  const urMap = new Map(userRestaurants.map((ur) => [ur.restaurantId, ur]));

  return restaurants
    .map((restaurant) =>
      scoreRestaurant({
        restaurant,
        userRestaurant: urMap.get(restaurant.id) ?? null,
        userLocation,
        preferences,
        visits,
        radiusMeters,
      }),
    )
    .filter((r) => {
      if (userLocation == null) return true;
      if (r.distanceMeters == null) return false;
      return r.distanceMeters <= radiusMeters;
    })
    .sort((a, b) => b.score - a.score || (a.distanceMeters ?? 9e9) - (b.distanceMeters ?? 9e9));
}

function budgetToMaxPrice(budget: string): number {
  switch (budget) {
    case "<50k":
      return 1;
    case "50–100k":
      return 2;
    case "100–250k":
      return 2;
    case "250–500k":
      return 3;
    case "500k+":
      return 4;
    default:
      return 4;
  }
}

function moodCuisines(mood: string): string[] {
  const map: Record<string, string[]> = {
    "Comfort Food": ["Indonesian", "Western", "Chinese"],
    Healthy: ["Healthy", "Japanese", "Vietnamese"],
    "Something New": [],
    Fancy: ["French", "Japanese", "Italian"],
    "Quick Meal": ["Coffee", "Street Food", "Vietnamese", "Western"],
    Coffee: ["Coffee"],
    Dessert: ["Coffee", "Dessert"],
    "Date Night": ["Italian", "Japanese", "French", "Indonesian"],
    "Group Dinner": ["Korean", "Chinese", "Indonesian", "Western"],
    "Solo Meal": ["Coffee", "Japanese", "Vietnamese"],
  };
  return map[mood] ?? [];
}

export function filterForMakanApa(
  ranked: RecommendationResult[],
  filters: MakanApaFilters,
): RecommendationResult[] {
  const maxPrice = budgetToMaxPrice(filters.budget);
  const moodList = moodCuisines(filters.mood);
  const maxM = filters.maxDistanceKm * 1000;

  return ranked
    .filter((r) => {
      if (r.distanceMeters != null && r.distanceMeters > maxM) return false;
      if (r.restaurant.priceLevel > maxPrice) return false;
      if (r.status === "not_recommended") return false;
      if (
        filters.cuisine &&
        filters.cuisine !== "Any" &&
        r.restaurant.cuisine.toLowerCase() !== filters.cuisine.toLowerCase()
      ) {
        return false;
      }
      if (filters.mood === "Something New" && r.status === "visited") {
        return false;
      }
      if (moodList.length && filters.cuisine === "Any") {
        const isPriority =
          r.status === "wishlist" || r.status === "favorite";
        if (!isPriority && !moodList.includes(r.restaurant.cuisine)) {
          return false;
        }
      }
      return true;
    })
    .slice(0, 3);
}

/** Weighted random pick — higher score = higher chance. */
export function surprisePick(
  candidates: RecommendationResult[],
): RecommendationResult | null {
  if (!candidates.length) return null;
  const weights = candidates.map((c) => Math.max(1, c.score));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i]!;
    if (roll <= 0) return candidates[i]!;
  }
  return candidates[candidates.length - 1] ?? null;
}

export function sortRecommendations(
  items: RecommendationResult[],
  sortId: string,
  visitCounts: Map<string, number>,
): RecommendationResult[] {
  const copy = [...items];
  switch (sortId) {
    case "nearest":
      return copy.sort(
        (a, b) => (a.distanceMeters ?? 9e9) - (b.distanceMeters ?? 9e9),
      );
    case "highest_rating":
      return copy.sort((a, b) => {
        const ra =
          a.userRestaurant?.personalRating ?? a.restaurant.externalRating ?? 0;
        const rb =
          b.userRestaurant?.personalRating ?? b.restaurant.externalRating ?? 0;
        return rb - ra;
      });
    case "wishlist_first":
      return copy.sort((a, b) => {
        const wa = a.status === "wishlist" ? 0 : 1;
        const wb = b.status === "wishlist" ? 0 : 1;
        return wa - wb || b.score - a.score;
      });
    case "most_visited":
      return copy.sort(
        (a, b) =>
          (visitCounts.get(b.restaurant.id) ?? 0) -
          (visitCounts.get(a.restaurant.id) ?? 0),
      );
    case "price":
      return copy.sort(
        (a, b) => a.restaurant.priceLevel - b.restaurant.priceLevel,
      );
    case "newly_added":
      return copy.sort((a, b) =>
        (b.userRestaurant?.dateAdded ?? "").localeCompare(
          a.userRestaurant?.dateAdded ?? "",
        ),
      );
    case "best_match":
    default:
      return copy.sort((a, b) => b.score - a.score);
  }
}
