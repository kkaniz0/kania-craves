export type RestaurantStatus =
  | "wishlist"
  | "visited"
  | "favorite"
  | "want_to_try_again"
  | "not_recommended"
  | "discover";

export type Priority = "high" | "medium" | "low";

export type PriceLevel = 1 | 2 | 3 | 4;

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface UserLocation extends Coordinates {
  area: string;
  city: string;
  timestamp: number;
  source: "gps" | "manual";
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  address: string;
  area: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  cuisine: string;
  category: string;
  priceLevel: PriceLevel;
  externalRating: number | null;
  externalReviewCount: number | null;
  openingHours: string | null;
  photoUrl: string | null;
  provider: string;
  providerPlaceId: string | null;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRestaurant {
  id: string;
  userId: string;
  restaurantId: string;
  status: RestaurantStatus;
  personalRating: number | null;
  priority: Priority;
  notes: string;
  favorite: boolean;
  recommendedMenu: string;
  tags: string[];
  source: string;
  wouldVisitAgain: boolean | null;
  dateAdded: string;
  lastVisited: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantVisit {
  id: string;
  userId: string;
  restaurantId: string;
  visitDate: string;
  rating: number | null;
  foodRating: number | null;
  serviceRating: number | null;
  ambienceRating: number | null;
  valueRating: number | null;
  spending: number | null;
  orderedItems: string;
  notes: string;
  wouldReturn: boolean | null;
  companion: string;
  createdAt: string;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  restaurantIds: string[];
}

export interface UserPreferences {
  userId: string;
  cuisineWeights: Record<string, number>;
  pricePreference: PriceLevel | null;
  saveLocationHistory: boolean;
  recommendationWeights: RecommendationWeights;
  favoriteAreas: string[];
  budgetPreference: string | null;
}

export interface RecommendationWeights {
  wishlist: number;
  favorite: number;
  cuisine: number;
  distance: number;
  rating: number;
  openNow: number;
  price: number;
  disliked: number;
  recentVisit: number;
}

export interface RecommendationResult {
  restaurant: Restaurant;
  userRestaurant: UserRestaurant | null;
  score: number;
  distanceMeters: number | null;
  reasons: string[];
  status: RestaurantStatus;
}

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface DemoStore {
  profile: Profile;
  restaurants: Restaurant[];
  userRestaurants: UserRestaurant[];
  visits: RestaurantVisit[];
  collections: Collection[];
  preferences: UserPreferences;
  recommendationFeedback: RecommendationFeedback[];
}

export interface RecommendationFeedback {
  id: string;
  restaurantId: string;
  score: number;
  feedback: "up" | "down";
  createdAt: string;
}

export interface QuickAddInput {
  name: string;
  location: string;
  status: RestaurantStatus;
  cuisine?: string;
  notes?: string;
  recommendedMenu?: string;
  rating?: number;
  latitude?: number | null;
  longitude?: number | null;
  area?: string;
  city?: string;
  priceLevel?: PriceLevel;
  tags?: string[];
  priority?: Priority;
}

export interface MakanApaFilters {
  budget: string;
  maxDistanceKm: number;
  cuisine: string;
  mood: string;
  mealType: string;
  withWho: string;
  timeAvailable: string;
}

export interface SortOption {
  id:
    | "nearest"
    | "best_match"
    | "highest_rating"
    | "wishlist_first"
    | "most_visited"
    | "price"
    | "newly_added";
  label: string;
}

export const DEFAULT_WEIGHTS: RecommendationWeights = {
  wishlist: 30,
  favorite: 25,
  cuisine: 20,
  distance: 15,
  rating: 10,
  openNow: 10,
  price: 10,
  disliked: -30,
  recentVisit: -10,
};

export const RADIUS_OPTIONS = [
  { label: "500 m", meters: 500 },
  { label: "1 km", meters: 1000 },
  { label: "2 km", meters: 2000 },
  { label: "3 km", meters: 3000 },
  { label: "5 km", meters: 5000 },
  { label: "10 km", meters: 10000 },
] as const;

export const SORT_OPTIONS: SortOption[] = [
  { id: "nearest", label: "Nearest" },
  { id: "best_match", label: "Best Match" },
  { id: "highest_rating", label: "Highest Rating" },
  { id: "wishlist_first", label: "Wishlist First" },
  { id: "most_visited", label: "Most Visited" },
  { id: "price", label: "Price" },
  { id: "newly_added", label: "Newly Added" },
];

export const WISHLIST_TAGS = [
  "Date Night",
  "Casual",
  "Fine Dining",
  "Coffee",
  "Dessert",
  "Healthy",
  "Comfort Food",
  "Japanese",
  "Indonesian",
  "Korean",
  "Italian",
  "Chinese",
  "Western",
  "Street Food",
  "Brunch",
  "Late Night",
] as const;

export const BUDGET_OPTIONS = [
  "<50k",
  "50–100k",
  "100–250k",
  "250–500k",
  "500k+",
] as const;

export const MOOD_OPTIONS = [
  "Comfort Food",
  "Healthy",
  "Something New",
  "Fancy",
  "Quick Meal",
  "Coffee",
  "Dessert",
  "Date Night",
  "Group Dinner",
  "Solo Meal",
] as const;
