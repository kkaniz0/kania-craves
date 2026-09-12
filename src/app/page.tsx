"use client";

import Link from "next/link";
import { Dice5, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { LocationPrompt } from "@/components/location-prompt";
import { RestaurantCard } from "@/components/restaurant-card";
import { Button } from "@/components/ui/button";
import { useUserLocation } from "@/hooks/use-user-location";
import { useNearbyRecommendations } from "@/hooks/use-nearby";
import { addRecommendationFeedback } from "@/lib/demo/store";
import { formatDistance } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";

export default function HomePage() {
  const { location } = useUserLocation();
  const nearby = useNearbyRecommendations(
    location ? { lat: location.lat, lng: location.lng } : null,
    3000,
    "best_match",
  );

  return (
    <div className="space-y-10">
      <section className="animate-fade-up relative overflow-hidden rounded-[2rem] bg-[var(--strawberry)] px-5 pb-6 pt-8 text-center shadow-[var(--shadow-card)] sm:px-8">
        <p className="brand-watermark absolute inset-x-0 top-2 text-[18vw] sm:text-[7rem]">
          kania
        </p>
        <div className="relative z-10 space-y-4">
          <p className="label-caps text-[var(--cocoa)]/70">Kania Craves</p>
          <h1 className="heading-soft mx-auto max-w-md text-3xl leading-tight sm:text-4xl">
            Lagi di mana hari ini?
          </h1>
          <p className="mx-auto max-w-sm text-sm text-[var(--cocoa)]/75">
            Soft picks from your wishlist & favorites — decide where to eat in
            seconds.
          </p>
          <div className="mx-auto max-w-md pt-1 text-left">
            <LocationPrompt />
          </div>
        </div>
      </section>

      <section className="animate-fade-up-delay grid gap-3 sm:grid-cols-2">
        <Link
          href="/makan-apa"
          className="rhode-tile flex min-h-[140px] flex-col items-center justify-center gap-2 p-6 text-center transition hover:brightness-[0.98]"
        >
          <Sparkles className="h-6 w-6 text-[var(--cocoa)]" />
          <p className="label-caps">Primary</p>
          <h2 className="heading-soft text-2xl">Makan Apa?</h2>
          <span className="mt-2 rounded-full bg-white/80 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em]">
            Get top 3
          </span>
        </Link>
        <Link
          href="/makan-apa?mode=surprise"
          className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-[1.5rem] bg-[var(--vanilla)] p-6 text-center shadow-[var(--shadow-card)] transition hover:brightness-[0.98]"
        >
          <Dice5 className="h-6 w-6 text-[var(--cocoa)]" />
          <p className="label-caps">Feeling lucky</p>
          <h2 className="heading-soft text-2xl">Surprise Me</h2>
          <span className="mt-2 rounded-full bg-[var(--cocoa)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--cream)]">
            Roll now
          </span>
        </Link>
      </section>

      {!location && (
        <EmptyHint text="Set your location to see nearby recommendations." />
      )}

      {location && nearby.personalNearby.length === 0 && (
        <EmptyHint
          text="Belum ada restoran tersimpan di sekitar sini."
          ctaHref="/add"
          cta="Add your first spot"
        />
      )}

      {nearby.topPick && (
        <section className="space-y-4">
          <SectionTitle title="Top Pick Near You" />
          <div className="overflow-hidden rounded-[2rem] bg-white shadow-[var(--shadow-lift)] md:grid md:grid-cols-2">
            <RestaurantCard item={nearby.topPick} className="shadow-none" />
            <div className="flex flex-col justify-center space-y-4 bg-[var(--lilac)]/35 p-6 md:rounded-l-none">
              <p className="label-caps text-center md:text-left">Why this?</p>
              <ul className="space-y-2 text-center text-sm md:text-left">
                {nearby.topPick.reasons.map((reason) => (
                  <li key={reason} className="flex justify-center gap-2 md:justify-start">
                    <span className="text-[var(--berry)]">✓</span>
                    {reason}
                  </li>
                ))}
              </ul>
              <div className="flex justify-center gap-2 pt-1 md:justify-start">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() =>
                    addRecommendationFeedback(
                      nearby.topPick!.restaurant.id,
                      nearby.topPick!.score,
                      "up",
                    )
                  }
                >
                  <ThumbsUp className="h-3.5 w-3.5" /> Good
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    addRecommendationFeedback(
                      nearby.topPick!.restaurant.id,
                      nearby.topPick!.score,
                      "down",
                    )
                  }
                >
                  <ThumbsDown className="h-3.5 w-3.5" /> Not for me
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      <HorizontalSection
        title="Wishlist Near You"
        empty="Belum ada wishlist kamu di sekitar sini."
        items={nearby.wishlist}
      />

      <HorizontalSection
        title="Favorites Nearby"
        empty="No favorites nearby yet."
        items={nearby.favorites}
      />

      <section className="space-y-4">
        <SectionTitle
          title="Your Restaurants Nearby"
          href="/explore"
          linkLabel="See all"
        />
        {nearby.personalNearby.length === 0 ? (
          <EmptyHint text="Save restaurants with coordinates to see them here." />
        ) : (
          <ul className="rhode-card divide-y divide-[var(--border)]">
            {nearby.personalNearby.slice(0, 8).map((item) => (
              <li key={item.restaurant.id}>
                <Link
                  href={`/restaurant/${item.restaurant.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-[var(--surface-2)]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold uppercase tracking-[0.06em]">
                        {item.restaurant.name}
                      </p>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-[var(--muted)]">
                      {item.restaurant.cuisine} · {item.restaurant.area}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-[var(--berry)]">
                    {formatDistance(item.distanceMeters)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <HorizontalSection
        title="Recent Visits"
        empty="No visits logged yet."
        items={nearby.recent}
      />
    </div>
  );
}

function SectionTitle({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 className="heading-soft text-2xl">{title}</h2>
      {href && (
        <Link
          href={href}
          className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--berry)]"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

function HorizontalSection({
  title,
  items,
  empty,
}: {
  title: string;
  items: ReturnType<typeof useNearbyRecommendations>["wishlist"];
  empty: string;
}) {
  return (
    <section className="space-y-4">
      <SectionTitle title={title} />
      {items.length === 0 ? (
        <EmptyHint
          text={empty}
          ctaHref="/explore"
          cta="Discover nearby"
        />
      ) : (
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 snap-x">
          {items.map((item) => (
            <div
              key={item.restaurant.id}
              className="w-[260px] shrink-0 snap-start"
            >
              <RestaurantCard item={item} compact />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyHint({
  text,
  cta,
  ctaHref,
}: {
  text: string;
  cta?: string;
  ctaHref?: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-[var(--border)] bg-white/70 px-4 py-8 text-center">
      <p className="text-sm text-[var(--muted)]">{text}</p>
      {cta && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-3 inline-flex rounded-full bg-[var(--strawberry)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--cocoa)]"
        >
          {cta}
        </Link>
      )}
    </div>
  );
}
