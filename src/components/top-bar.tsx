"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/cn";

export function TopBar({
  title = "kania craves",
  showSearch = true,
}: {
  title?: string;
  showSearch?: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 bg-[var(--cream)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="heading-soft text-lg lowercase tracking-tight">
          {title}
        </Link>
        <div className="flex items-center gap-2">
          {showSearch && (
            <Link
              href="/search"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--cocoa)] shadow-[var(--shadow-card)]",
              )}
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </Link>
          )}
          <Link
            href="/add"
            className="flex h-9 items-center gap-1 rounded-full bg-[var(--strawberry)] px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--cocoa)]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Link>
        </div>
      </div>
      <div className="hidden md:block">
        <div className="mx-auto flex max-w-5xl gap-6 px-4 pb-3 text-[11px] font-semibold uppercase tracking-[0.14em]">
          {[
            ["/", "Home"],
            ["/explore", "Explore"],
            ["/map", "Map"],
            ["/saved", "Saved"],
            ["/makan-apa", "Makan Apa?"],
            ["/trip", "Trip"],
            ["/assistant", "Assistant"],
            ["/profile", "Profile"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="text-[var(--muted)] transition hover:text-[var(--berry)]"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
