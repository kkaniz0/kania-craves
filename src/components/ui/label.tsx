import * as React from "react";
import { cn } from "@/lib/cn";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]",
      className,
    )}
    {...props}
  />
));
Label.displayName = "Label";
