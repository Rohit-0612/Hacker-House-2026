import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-sunset text-night shadow-[0_16px_44px_-14px_rgba(255,110,90,0.75)] hover:shadow-[0_20px_54px_-12px_rgba(255,110,90,0.9)]",
  secondary: "glass text-ink hover:border-white/20 hover:bg-white/[0.06]",
  ghost: "text-muted hover:text-ink",
};

/** min-h-12 keeps every control at/above the 44px touch target on mobile. */
const BASE =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-display text-[0.95rem] font-bold transition-all duration-200 disabled:pointer-events-none disabled:opacity-45 motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.97]";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ variant = "primary", className, ...props }: Props) {
  return <button className={cn(BASE, VARIANTS[variant], className)} {...props} />;
}

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant };

export function ButtonLink({ variant = "primary", className, ...props }: LinkProps) {
  return <a className={cn(BASE, VARIANTS[variant], className)} {...props} />;
}
