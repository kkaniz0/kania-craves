import { cn } from "@/lib/cn";
import type { RestaurantStatus } from "@/lib/types";

const STYLES: Record<
  RestaurantStatus,
  { label: string; className: string }
> = {
  wishlist: {
    label: "Wishlist",
    className: "bg-[var(--peach)] text-[var(--cocoa)] border-transparent",
  },
  favorite: {
    label: "Favorite",
    className: "bg-[var(--berry)] text-white border-transparent",
  },
  visited: {
    label: "Visited",
    className: "bg-[var(--matcha)] text-[var(--cocoa)] border-transparent",
  },
  want_to_try_again: {
    label: "Try Again",
    className: "bg-[var(--vanilla)] text-[var(--cocoa)] border-transparent",
  },
  not_recommended: {
    label: "Skip",
    className: "bg-[var(--lilac)] text-[var(--cocoa)] border-transparent",
  },
  discover: {
    label: "Discover",
    className: "bg-[var(--strawberry)] text-[var(--cocoa)] border-transparent",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: RestaurantStatus;
  className?: string;
}) {
  const style = STYLES[status] ?? STYLES.discover;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
        style.className,
        className,
      )}
    >
      {style.label}
    </span>
  );
}
