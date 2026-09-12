"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Navigation, Star } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useUserLocation } from "@/hooks/use-user-location";
import type { RecommendationResult, RestaurantStatus } from "@/lib/types";
import { googleMapsDirectionsUrl } from "@/lib/maps/google";
import { formatDistance, priceLabel } from "@/lib/utils";
import { cn } from "@/lib/cn";

export function RestaurantCard({
  item,
  compact = false,
  className,
}: {
  item: RecommendationResult;
  compact?: boolean;
  className?: string;
}) {
  const { location } = useUserLocation();
  const { restaurant, score, distanceMeters, status, reasons } = item;
  const rating =
    item.userRestaurant?.personalRating ?? restaurant.externalRating;
  const mapsUrl = googleMapsDirectionsUrl(
    restaurant,
    location ? { lat: location.lat, lng: location.lng } : null,
  );

  return (
    <article
      className={cn(
        "rhode-card group transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      <Link href={`/restaurant/${restaurant.id}`} className="block">
        <div
          className={cn(
            "relative mx-3 mt-3 overflow-hidden rounded-[1.15rem] bg-[var(--strawberry)]",
            compact ? "h-32" : "h-44",
          )}
        >
          {restaurant.photoUrl ? (
            <Image
              src={restaurant.photoUrl}
              alt={restaurant.name}
              fill
              className="object-cover transition duration-700 group-hover:scale-[1.04]"
              sizes="(max-width:768px) 90vw, 360px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[var(--muted)]">
              No photo
            </div>
          )}
          <div className="absolute left-3 top-3">
            <StatusBadge status={status as RestaurantStatus} />
          </div>
          {score > 0 && (
            <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cocoa)] backdrop-blur">
              {score}% match
            </div>
          )}
        </div>
        <div className="space-y-2 px-4 pb-2 pt-4 text-center">
          {rating != null && (
            <div className="flex items-center justify-center gap-1 text-xs font-medium text-[var(--cocoa)]">
              <Star className="h-3 w-3 fill-[var(--peach)] text-[var(--peach)]" />
              {rating.toFixed(1)}
            </div>
          )}
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--cocoa)]">
            {restaurant.name}
          </h3>
          <p className="text-xs text-[var(--muted)]">
            {restaurant.cuisine} · {priceLabel(restaurant.priceLevel)}
          </p>
          <div className="flex items-center justify-center gap-1 text-xs text-[var(--muted)]">
            <MapPin className="h-3.5 w-3.5 text-[var(--berry)]" />
            {formatDistance(distanceMeters)} · {restaurant.area}
          </div>
          {!compact && reasons[0] && (
            <p className="pt-1 text-[11px] text-[var(--berry)]">{reasons[0]}</p>
          )}
        </div>
      </Link>
      <div className="flex gap-2 px-4 pb-4 pt-1">
        <Button asChild size="sm" variant="default" className="flex-1">
          <a href={mapsUrl} target="_blank" rel="noreferrer">
            <Navigation className="h-3.5 w-3.5" />
            Navigate
          </a>
        </Button>
        <Button asChild size="sm" variant="outline" className="flex-1">
          <Link href={`/restaurant/${restaurant.id}`}>Open</Link>
        </Button>
      </div>
    </article>
  );
}
