"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, Map, Bookmark, User } from "lucide-react";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/map", label: "Map", icon: Map },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 bg-white/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(233,139,170,0.12)] md:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-1">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] transition",
                  active
                    ? "text-[var(--berry)]"
                    : "text-[var(--muted)] hover:text-[var(--cocoa)]",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition",
                    active && "bg-[var(--strawberry)]",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active && "stroke-[2.5]")} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
