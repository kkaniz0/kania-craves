"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { useDemoStore } from "@/hooks/use-demo-store";
import { searchAll } from "@/lib/demo/store";

export default function SearchPage() {
  const store = useDemoStore();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    // use live store via searchAll which reads latest
    void store;
    return searchAll(query);
  }, [query, store]);

  const urMap = useMemo(
    () => new Map(store.userRestaurants.map((u) => [u.restaurantId, u])),
    [store.userRestaurants],
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">
          Search
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Restaurant, cuisine, area, dish, tag, or notes.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        <Input
          className="pl-10"
          placeholder='Try “ramen”, “Senopati”, “date night”…'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {!query.trim() && (
        <p className="text-sm text-[var(--muted)]">
          Tip: searches recommended menu and personal notes too.
        </p>
      )}

      {query.trim() && results.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted)]">
          No results for “{query}”.
        </div>
      )}

      <ul className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-card)]">
        {results.map((r) => {
          const ur = urMap.get(r.id);
          return (
            <li key={r.id}>
              <Link
                href={`/restaurant/${r.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[var(--surface-2)]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{r.name}</p>
                    {ur && <StatusBadge status={ur.status} />}
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    {r.cuisine} · {r.area}
                    {ur?.recommendedMenu ? ` · ${ur.recommendedMenu}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
