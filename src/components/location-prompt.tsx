"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchAreas } from "@/lib/geo/areas";
import { useUserLocation } from "@/hooks/use-user-location";

export function LocationPrompt({
  autoRequest = true,
}: {
  autoRequest?: boolean;
}) {
  const { location, status, error, requestGps, setManual } = useUserLocation();
  const [query, setQuery] = useState("");
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    if (autoRequest && status === "idle" && !location) {
      const t = setTimeout(() => requestGps(), 400);
      return () => clearTimeout(t);
    }
  }, [autoRequest, status, location, requestGps]);

  useEffect(() => {
    if (status === "denied" || status === "error") setShowManual(true);
  }, [status]);

  const suggestions = useMemo(() => searchAreas(query), [query]);

  if (location && !showManual) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[1.25rem] bg-white/90 px-4 py-3 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--matcha)]">
            <MapPin className="h-4 w-4 text-[var(--cocoa)]" />
          </span>
          <div>
            <p className="label-caps">You are here</p>
            <p className="text-sm font-medium text-[var(--cocoa)]">
              {location.area}, {location.city}
            </p>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setShowManual(true)}>
          Change
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-[1.5rem] bg-white/90 p-4 shadow-[var(--shadow-card)]">
      <div>
        <h2 className="heading-soft text-xl">
          Allow location to find food near you
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Session only — we don’t store exact coordinates unless you enable
          history.
        </p>
      </div>
      {error && (
        <p className="rounded-2xl bg-[var(--vanilla)] px-3 py-2 text-sm text-[var(--cocoa)]">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          onClick={requestGps}
          className="flex-1"
          disabled={status === "prompting"}
        >
          <LocateFixed className="h-4 w-4" />
          {status === "prompting" ? "Locating…" : "Use my location"}
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowManual(true)}
          className="flex-1"
        >
          Search area
        </Button>
      </div>
      {(showManual || status === "denied") && (
        <div className="space-y-2">
          <Input
            placeholder="Senopati, SCBD, Blok M, PIK…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setManual(query);
            }}
          />
          <ul className="max-h-40 overflow-auto rounded-2xl border border-[var(--border)] bg-white">
            {suggestions.map((area) => (
              <li key={area.name}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-[var(--surface-2)]"
                  onClick={() => {
                    setManual(area.name);
                    setShowManual(false);
                    setQuery("");
                  }}
                >
                  <span>{area.name}</span>
                  <span className="text-[var(--muted)]">{area.city}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
