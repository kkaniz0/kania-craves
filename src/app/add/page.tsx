"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  findDuplicateCandidates,
  quickAddRestaurant,
} from "@/lib/demo/store";
import type { Restaurant, RestaurantStatus } from "@/lib/types";
import { WISHLIST_TAGS } from "@/lib/types";
import { searchAreas } from "@/lib/geo/areas";

export default function AddRestaurantPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<RestaurantStatus>("wishlist");
  const [cuisine, setCuisine] = useState("");
  const [notes, setNotes] = useState("");
  const [menu, setMenu] = useState("");
  const [rating, setRating] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<Restaurant[]>([]);
  const [pendingForce, setPendingForce] = useState(false);

  const areaSuggestions = useMemo(() => searchAreas(location), [location]);

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function onNameBlur() {
    if (name.trim().length < 2) return;
    setDuplicates(findDuplicateCandidates(name));
  }

  function submit(e: FormEvent, force = false) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !location.trim()) {
      setError("Restaurant name and location are required.");
      return;
    }
    const result = quickAddRestaurant(
      {
        name,
        location,
        status,
        cuisine: cuisine || undefined,
        notes: notes || undefined,
        recommendedMenu: menu || undefined,
        rating: rating ? Number(rating) : undefined,
        tags,
      },
      { force },
    );
    if (result.duplicates.length && !force) {
      setDuplicates(result.duplicates);
      setPendingForce(true);
      return;
    }
    router.push(`/restaurant/${result.restaurant.id}`);
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Quick add
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Save a restaurant in under 10 seconds. Name, location, status.
        </p>
      </div>

      <form
        onSubmit={(e) => submit(e, false)}
        className="space-y-4 rounded-2xl bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]"
      >
        <div className="space-y-1.5">
          <Label htmlFor="name">Restaurant Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={onNameBlur}
            placeholder="Sushi Masa"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Senopati"
            list="area-list"
            required
          />
          <datalist id="area-list">
            {areaSuggestions.map((a) => (
              <option key={a.name} value={a.name} />
            ))}
          </datalist>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status">Status *</Label>
          <select
            id="status"
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as RestaurantStatus)}
          >
            <option value="wishlist">Wishlist</option>
            <option value="visited">Visited</option>
            <option value="favorite">Favorite</option>
            <option value="want_to_try_again">Want to Try Again</option>
            <option value="not_recommended">Not Recommended</option>
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cuisine">Cuisine</Label>
            <Input
              id="cuisine"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              placeholder="Japanese"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rating">Rating</Label>
            <Input
              id="rating"
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              placeholder="4.5"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="menu">Recommended menu</Label>
          <Input
            id="menu"
            value={menu}
            onChange={(e) => setMenu(e.target.value)}
            placeholder="Omakase, ramen"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Heard about this from…"
          />
        </div>

        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2">
            {WISHLIST_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-3 py-1 text-xs ${
                  tags.includes(tag)
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface-2)] text-[var(--foreground)]"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        {duplicates.length > 0 && (
          <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-medium text-amber-950">
              Is this the same restaurant?
            </p>
            <ul className="space-y-1 text-sm text-amber-900">
              {duplicates.map((d) => (
                <li key={d.id}>
                  {d.name} — {d.area}
                  <button
                    type="button"
                    className="ml-2 underline"
                    onClick={() => router.push(`/restaurant/${d.id}`)}
                  >
                    Open existing
                  </button>
                </li>
              ))}
            </ul>
            {pendingForce && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => submit(e as unknown as FormEvent, true)}
              >
                Save as new anyway
              </Button>
            )}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg">
          Save restaurant
        </Button>
      </form>
    </div>
  );
}
