"use client";

import { createDemoStore, DEMO_USER_ID } from "./seed";
import type {
  Collection,
  DemoStore,
  QuickAddInput,
  Restaurant,
  RestaurantStatus,
  RestaurantVisit,
  UserPreferences,
  UserRestaurant,
} from "../types";
import { nameSimilarity, slugify, uid } from "../utils";
import { resolveManualLocation } from "../geo/areas";

const STORAGE_KEY = "kania_craves_demo_v2";

type Listener = () => void;

let memoryStore: DemoStore | null = null;
const listeners = new Set<Listener>();

function canUseStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function loadStore(): DemoStore {
  if (memoryStore) return memoryStore;
  if (canUseStorage()) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        memoryStore = JSON.parse(raw) as DemoStore;
        return memoryStore;
      }
    } catch {
      // fall through to seed
    }
  }
  memoryStore = createDemoStore();
  persist();
  return memoryStore;
}

function persist() {
  if (!memoryStore) return;
  if (canUseStorage()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
  }
  listeners.forEach((l) => l());
}

export function subscribeStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetDemoStore(): DemoStore {
  memoryStore = createDemoStore();
  persist();
  return memoryStore;
}

export function getStoreSnapshot(): DemoStore {
  return loadStore();
}

export function findDuplicateCandidates(
  name: string,
  lat?: number | null,
  lng?: number | null,
): Restaurant[] {
  const store = loadStore();
  return store.restaurants.filter((r) => {
    const sim = nameSimilarity(r.name, name);
    if (sim >= 0.8) return true;
    if (
      lat != null &&
      lng != null &&
      r.latitude != null &&
      r.longitude != null
    ) {
      const dLat = Math.abs(r.latitude - lat);
      const dLng = Math.abs(r.longitude - lng);
      if (dLat < 0.0008 && dLng < 0.0008 && sim >= 0.5) return true;
    }
    return false;
  });
}

export function quickAddRestaurant(
  input: QuickAddInput,
  opts?: { force?: boolean },
): { restaurant: Restaurant; userRestaurant: UserRestaurant; duplicates: Restaurant[] } {
  const store = loadStore();
  const duplicates = findDuplicateCandidates(
    input.name,
    input.latitude,
    input.longitude,
  );
  if (duplicates.length && !opts?.force) {
    return {
      restaurant: duplicates[0]!,
      userRestaurant:
        store.userRestaurants.find((u) => u.restaurantId === duplicates[0]!.id) ??
        ({
          id: "",
          userId: DEMO_USER_ID,
          restaurantId: duplicates[0]!.id,
          status: input.status,
          personalRating: null,
          priority: "medium",
          notes: "",
          favorite: false,
          recommendedMenu: "",
          tags: [],
          source: "manual",
          wouldVisitAgain: null,
          dateAdded: new Date().toISOString(),
          lastVisited: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as UserRestaurant),
      duplicates,
    };
  }

  const areaGuess =
    resolveManualLocation(input.location) ??
    resolveManualLocation(input.area ?? "") ??
    null;
  const now = new Date().toISOString();
  const id = uid("rest");
  const restaurant: Restaurant = {
    id,
    name: input.name.trim(),
    slug: slugify(input.name),
    address: input.location,
    area: input.area || areaGuess?.name || input.location,
    city: input.city || areaGuess?.city || "Jakarta",
    country: areaGuess?.country || "Indonesia",
    latitude: input.latitude ?? areaGuess?.lat ?? null,
    longitude: input.longitude ?? areaGuess?.lng ?? null,
    cuisine: input.cuisine || "Other",
    category: "Restaurant",
    priceLevel: input.priceLevel ?? 2,
    externalRating: null,
    externalReviewCount: null,
    openingHours: null,
    photoUrl: null,
    provider: "manual",
    providerPlaceId: null,
    isDemo: false,
    createdAt: now,
    updatedAt: now,
  };

  const userRestaurant: UserRestaurant = {
    id: uid("ur"),
    userId: DEMO_USER_ID,
    restaurantId: id,
    status: input.status,
    personalRating: input.rating ?? null,
    priority: input.priority ?? "medium",
    notes: input.notes ?? "",
    favorite: input.status === "favorite",
    recommendedMenu: input.recommendedMenu ?? "",
    tags: input.tags ?? [],
    source: "manual",
    wouldVisitAgain: null,
    dateAdded: now,
    lastVisited: input.status === "visited" ? now : null,
    createdAt: now,
    updatedAt: now,
  };

  store.restaurants.unshift(restaurant);
  store.userRestaurants.unshift(userRestaurant);
  persist();
  return { restaurant, userRestaurant, duplicates: [] };
}

export function updateUserRestaurant(
  restaurantId: string,
  patch: Partial<UserRestaurant>,
): UserRestaurant | null {
  const store = loadStore();
  const idx = store.userRestaurants.findIndex(
    (u) => u.restaurantId === restaurantId,
  );
  if (idx === -1) {
    const now = new Date().toISOString();
    const created: UserRestaurant = {
      id: uid("ur"),
      userId: DEMO_USER_ID,
      restaurantId,
      status: (patch.status as RestaurantStatus) ?? "wishlist",
      personalRating: patch.personalRating ?? null,
      priority: patch.priority ?? "medium",
      notes: patch.notes ?? "",
      favorite: patch.favorite ?? false,
      recommendedMenu: patch.recommendedMenu ?? "",
      tags: patch.tags ?? [],
      source: "manual",
      wouldVisitAgain: patch.wouldVisitAgain ?? null,
      dateAdded: now,
      lastVisited: patch.lastVisited ?? null,
      createdAt: now,
      updatedAt: now,
    };
    store.userRestaurants.unshift(created);
    persist();
    return created;
  }
  const current = store.userRestaurants[idx]!;
  const updated = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  store.userRestaurants[idx] = updated;
  persist();
  return updated;
}

export function addVisit(
  visit: Omit<RestaurantVisit, "id" | "userId" | "createdAt">,
): RestaurantVisit {
  const store = loadStore();
  const record: RestaurantVisit = {
    ...visit,
    id: uid("visit"),
    userId: DEMO_USER_ID,
    createdAt: new Date().toISOString(),
  };
  store.visits.unshift(record);
  updateUserRestaurant(visit.restaurantId, {
    status: "visited",
    lastVisited: visit.visitDate,
    personalRating: visit.rating ?? undefined,
    wouldVisitAgain: visit.wouldReturn,
  });
  persist();
  return record;
}

export function createCollection(name: string, description = ""): Collection {
  const store = loadStore();
  const now = new Date().toISOString();
  const col: Collection = {
    id: uid("col"),
    userId: DEMO_USER_ID,
    name,
    description,
    createdAt: now,
    updatedAt: now,
    restaurantIds: [],
  };
  store.collections.unshift(col);
  persist();
  return col;
}

export function toggleCollectionRestaurant(
  collectionId: string,
  restaurantId: string,
): Collection | null {
  const store = loadStore();
  const col = store.collections.find((c) => c.id === collectionId);
  if (!col) return null;
  if (col.restaurantIds.includes(restaurantId)) {
    col.restaurantIds = col.restaurantIds.filter((id) => id !== restaurantId);
  } else {
    col.restaurantIds.push(restaurantId);
  }
  col.updatedAt = new Date().toISOString();
  persist();
  return col;
}

export function updatePreferences(
  patch: Partial<UserPreferences>,
): UserPreferences {
  const store = loadStore();
  store.preferences = { ...store.preferences, ...patch };
  persist();
  return store.preferences;
}

export function addRecommendationFeedback(
  restaurantId: string,
  score: number,
  feedback: "up" | "down",
) {
  const store = loadStore();
  store.recommendationFeedback.unshift({
    id: uid("fb"),
    restaurantId,
    score,
    feedback,
    createdAt: new Date().toISOString(),
  });
  persist();
}

export function searchAll(query: string) {
  const store = loadStore();
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const urMap = new Map(
    store.userRestaurants.map((u) => [u.restaurantId, u]),
  );
  return store.restaurants.filter((r) => {
    const ur = urMap.get(r.id);
    const hay = [
      r.name,
      r.cuisine,
      r.area,
      r.city,
      r.address,
      r.category,
      ur?.notes,
      ur?.recommendedMenu,
      ...(ur?.tags ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}
