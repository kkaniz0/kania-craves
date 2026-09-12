import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[11px] font-semibold uppercase tracking-[0.14em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--berry)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--strawberry)] text-[var(--cocoa)] hover:bg-[var(--berry)] hover:text-white",
        secondary:
          "bg-[var(--vanilla)] text-[var(--cocoa)] hover:bg-[var(--peach)]",
        outline:
          "border border-[var(--border)] bg-white/70 text-[var(--cocoa)] hover:bg-[var(--surface-2)]",
        ghost: "text-[var(--cocoa)] hover:bg-[var(--surface-2)]",
        dark: "bg-[var(--cocoa)] text-[var(--cream)] hover:bg-[#3f2c33]",
        matcha:
          "bg-[var(--matcha)] text-[var(--cocoa)] hover:brightness-95",
        danger: "bg-[var(--berry)] text-white hover:brightness-95",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-[10px]",
        lg: "h-12 px-8 text-xs",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
