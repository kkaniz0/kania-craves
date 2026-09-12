export interface OpeningHours {
  weekdayText?: string[];
  openNow?: boolean;
}

export interface PlaceResult {
  provider: string;
  providerPlaceId: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  cuisine?: string;
  rating?: number;
  priceLevel?: number;
  photoUrl?: string;
}

export interface PlaceDetail extends PlaceResult {
  openingHours?: OpeningHours | null;
  reviewCount?: number;
  phone?: string;
  website?: string;
}

export interface SearchFilters {
  cuisine?: string;
  openNow?: boolean;
  minRating?: number;
}

/**
 * Swap-ready restaurant discovery provider.
 * Phase 1 uses personal DB only. External APIs plug in here later.
 */
export interface RestaurantProvider {
  readonly name: string;
  searchNearby(
    lat: number,
    lng: number,
    radiusM: number,
    filters?: SearchFilters,
  ): Promise<PlaceResult[]>;
  searchRestaurant(query: string): Promise<PlaceResult[]>;
  getRestaurantDetail(placeId: string): Promise<PlaceDetail | null>;
  getCoordinates(
    address: string,
  ): Promise<{ lat: number; lng: number } | null>;
  getOpeningHours(placeId: string): Promise<OpeningHours | null>;
}

/** Phase 1: no external discoveries — app still works on personal DB. */
export class NullExternalProvider implements RestaurantProvider {
  readonly name = "null";

  async searchNearby(): Promise<PlaceResult[]> {
    return [];
  }

  async searchRestaurant(): Promise<PlaceResult[]> {
    return [];
  }

  async getRestaurantDetail(): Promise<PlaceDetail | null> {
    return null;
  }

  async getCoordinates(): Promise<{ lat: number; lng: number } | null> {
    return null;
  }

  async getOpeningHours(): Promise<OpeningHours | null> {
    return null;
  }
}

export function getExternalProvider(): RestaurantProvider {
  return new NullExternalProvider();
}
