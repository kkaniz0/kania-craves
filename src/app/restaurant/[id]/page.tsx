"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Heart,
  MapPin,
  Navigation,
  Pencil,
  Share2,
  Star,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDemoStore } from "@/hooks/use-demo-store";
import { useUserLocation } from "@/hooks/use-user-location";
import { getRestaurantWithUser, formatIdr } from "@/lib/analytics/taste";
import { scoreRestaurant } from "@/lib/recommendation/engine";
import {
  addVisit,
  updateUserRestaurant,
} from "@/lib/demo/store";
import {
  googleMapsDirectionsUrl,
  googleMapsPlaceUrl,
} from "@/lib/maps/google";
import {
  estimateWalkMinutes,
  formatDistance,
  haversineMeters,
  priceLabel,
} from "@/lib/utils";
import type { RestaurantStatus } from "@/lib/types";

export default function RestaurantDetailPage() {
  const params = useParams<{ id: string }>();
  const store = useDemoStore();
  const { location } = useUserLocation();
  const data = useMemo(
    () => getRestaurantWithUser(store, params.id),
    [store, params.id],
  );
  const [showJournal, setShowJournal] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  if (!data) {
    return (
      <div className="space-y-3 py-10 text-center">
        <p>Restaurant not found.</p>
        <Link href="/" className="text-[var(--accent)]">
          Back home
        </Link>
      </div>
    );
  }

  const { restaurant, userRestaurant, visits } = data;
  const distance =
    location && restaurant.latitude != null && restaurant.longitude != null
      ? haversineMeters(
          { lat: location.lat, lng: location.lng },
          { lat: restaurant.latitude, lng: restaurant.longitude },
        )
      : null;
  const scored = scoreRestaurant({
    restaurant,
    userRestaurant,
    userLocation: location
      ? { lat: location.lat, lng: location.lng }
      : null,
    preferences: store.preferences,
    visits: store.visits,
  });

  const origin = location
    ? { lat: location.lat, lng: location.lng }
    : null;
  const navUrl = googleMapsDirectionsUrl(restaurant, origin);
  const placeUrl = googleMapsPlaceUrl(restaurant);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `Check out ${restaurant.name} on Kania Craves`;
    if (navigator.share) {
      await navigator.share({ title: restaurant.name, text, url });
    } else {
      await navigator.clipboard.writeText(url);
      setShareMsg("Link copied");
      setTimeout(() => setShareMsg(null), 2000);
    }
  }

  function setStatus(status: RestaurantStatus) {
    updateUserRestaurant(restaurant.id, {
      status,
      favorite: status === "favorite" ? true : userRestaurant?.favorite,
    });
  }

  function onJournalSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    addVisit({
      restaurantId: restaurant.id,
      visitDate: String(fd.get("visitDate") || new Date().toISOString().slice(0, 10)),
      rating: num(fd.get("rating")),
      foodRating: num(fd.get("foodRating")),
      serviceRating: num(fd.get("serviceRating")),
      ambienceRating: num(fd.get("ambienceRating")),
      valueRating: num(fd.get("valueRating")),
      spending: num(fd.get("spending")),
      orderedItems: String(fd.get("orderedItems") || ""),
      notes: String(fd.get("notes") || ""),
      wouldReturn: fd.get("wouldReturn") === "yes",
      companion: String(fd.get("companion") || ""),
    });
    if (fd.get("recommendedMenu")) {
      updateUserRestaurant(restaurant.id, {
        recommendedMenu: String(fd.get("recommendedMenu")),
      });
    }
    setShowJournal(false);
    e.currentTarget.reset();
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-[var(--surface)] shadow-[var(--shadow-lift)]">
        <div className="relative h-56 w-full md:h-72">
          {restaurant.photoUrl ? (
            <Image
              src={restaurant.photoUrl}
              alt={restaurant.name}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[var(--surface-2)]">
              No photo
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 text-white">
            <div className="mb-2 flex gap-2">
              <StatusBadge status={scored.status} />
              {restaurant.isDemo && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px]">
                  Demo data
                </span>
              )}
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl">
              {restaurant.name}
            </h1>
            <p className="text-sm text-white/80">
              {restaurant.cuisine} · {priceLabel(restaurant.priceLevel)} ·{" "}
              {restaurant.area}
            </p>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Meta
            label="Distance"
            value={`${formatDistance(distance)}${
              estimateWalkMinutes(distance)
                ? ` · ~${estimateWalkMinutes(distance)} min walk`
                : ""
            }`}
          />
          <Meta
            label="Match"
            value={`${scored.score}% — ${scored.reasons[0] ?? "Based on your taste"}`}
          />
          <Meta
            label="Personal rating"
            value={
              userRestaurant?.personalRating != null
                ? String(userRestaurant.personalRating)
                : "—"
            }
          />
          <Meta
            label="External rating"
            value={
              restaurant.externalRating != null
                ? `${restaurant.externalRating} (${restaurant.externalReviewCount ?? 0})`
                : "—"
            }
          />
          <Meta label="Hours" value={restaurant.openingHours ?? "—"} />
          <Meta label="Address" value={restaurant.address || "—"} />
        </div>

        <div className="flex flex-wrap gap-2 border-t border-[var(--border)] p-4">
          <Button asChild>
            <a href={navUrl} target="_blank" rel="noreferrer">
              <Navigation className="h-4 w-4" /> Navigate
            </a>
          </Button>
          <Button variant="secondary" onClick={() => setStatus("wishlist")}>
            Add to Wishlist
          </Button>
          <Button variant="secondary" onClick={() => setShowJournal(true)}>
            Mark as Visited
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              updateUserRestaurant(restaurant.id, {
                favorite: true,
                status: "favorite",
              })
            }
          >
            <Heart className="h-4 w-4" /> Favorite
          </Button>
          <Button variant="ghost" onClick={share}>
            <Share2 className="h-4 w-4" /> Share
          </Button>
          <Button variant="ghost" asChild>
            <Link href={`/add?edit=${restaurant.id}`}>
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          </Button>
        </div>
        {shareMsg && (
          <p className="px-4 pb-3 text-sm text-[var(--accent)]">{shareMsg}</p>
        )}
      </div>

      <section className="space-y-2 rounded-2xl bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-[family-name:var(--font-display)] text-xl">
          Why this?
        </h2>
        <ul className="space-y-1 text-sm">
          {scored.reasons.map((r) => (
            <li key={r}>✓ {r}</li>
          ))}
        </ul>
      </section>

      {(userRestaurant?.recommendedMenu || userRestaurant?.notes) && (
        <section className="space-y-2 rounded-2xl bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
          <h2 className="font-[family-name:var(--font-display)] text-xl">
            Your notes
          </h2>
          {userRestaurant.recommendedMenu && (
            <p className="text-sm">
              <span className="text-[var(--muted)]">Recommended: </span>
              {userRestaurant.recommendedMenu}
            </p>
          )}
          {userRestaurant.notes && (
            <p className="text-sm text-[var(--muted)]">{userRestaurant.notes}</p>
          )}
          {userRestaurant.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {userRestaurant.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-3 rounded-2xl bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-xl">
            Visit history
          </h2>
          <Button size="sm" onClick={() => setShowJournal(true)}>
            Log visit
          </Button>
        </div>
        <p className="text-sm text-[var(--muted)]">
          Visited {visits.length} time{visits.length === 1 ? "" : "s"}
        </p>
        {visits.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No visits logged yet.</p>
        ) : (
          <ul className="space-y-3">
            {visits.map((v) => (
              <li
                key={v.id}
                className="rounded-xl border border-[var(--border)] p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{v.visitDate}</span>
                  {v.rating != null && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {v.rating}
                    </span>
                  )}
                </div>
                {v.orderedItems && (
                  <p className="mt-1 text-[var(--muted)]">Ate: {v.orderedItems}</p>
                )}
                {v.notes && <p className="mt-1">{v.notes}</p>}
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {[v.companion, v.spending != null ? formatIdr(v.spending) : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-[family-name:var(--font-display)] text-xl">
          Map
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <a
            href={navUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-2xl bg-[var(--surface)] p-4 text-sm shadow-[var(--shadow-card)]"
          >
            <MapPin className="h-4 w-4 text-[var(--accent)]" />
            Directions in Google Maps
          </a>
          <a
            href={placeUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-2xl bg-[var(--surface)] p-4 text-sm shadow-[var(--shadow-card)]"
          >
            <MapPin className="h-4 w-4 text-[var(--accent)]" />
            Open place on Google Maps
          </a>
        </div>
      </section>

      {showJournal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <form
            onSubmit={onJournalSubmit}
            className="max-h-[90dvh] w-full max-w-lg space-y-3 overflow-y-auto rounded-3xl bg-[var(--surface)] p-5 shadow-[var(--shadow-lift)]"
          >
            <h3 className="font-[family-name:var(--font-display)] text-2xl">
              How was it?
            </h3>
            <Field name="visitDate" label="Date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            <div className="grid grid-cols-2 gap-3">
              <Field name="rating" label="Overall" type="number" step="0.1" min="0" max="5" />
              <Field name="foodRating" label="Food" type="number" step="0.1" min="0" max="5" />
              <Field name="serviceRating" label="Service" type="number" step="0.1" min="0" max="5" />
              <Field name="ambienceRating" label="Ambience" type="number" step="0.1" min="0" max="5" />
              <Field name="valueRating" label="Value" type="number" step="0.1" min="0" max="5" />
              <Field name="spending" label="Spending (IDR)" type="number" />
            </div>
            <Field name="orderedItems" label="What I ordered" />
            <Field name="recommendedMenu" label="Recommended menu" />
            <Field name="companion" label="Who I went with" />
            <div className="space-y-1.5">
              <Label>Would come again?</Label>
              <select
                name="wouldReturn"
                className="h-11 w-full rounded-xl border border-[var(--border)] px-3 text-sm"
                defaultValue="yes"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea name="notes" placeholder="How was it?" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowJournal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Save visit
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  ...rest
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  step?: string;
  min?: string;
  max?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} {...rest} />
    </div>
  );
}

function num(v: FormDataEntryValue | null): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
