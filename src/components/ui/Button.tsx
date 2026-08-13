import { cn } from "@/lib/cn";

type Variant = "primary" | "magenta" | "outline" | "ghost";

/**
 * Hard-edged blocks with an offset ink shadow — the buttons are printed matter,
 * matching the ticket rather than the usual soft-glow web button.
 */
const VARIANTS: Record<Variant, string> = {
  primary: "bg-gold text-ink border-ink shadow-[4px_4px_0_var(--color-ink)]",
  magenta: "bg-magenta text-paper border-ink shadow-[4px_4px_0_var(--color-ink)]",
  outline: "bg-transparent text-paper border-paper/45 hover:border-paper hover:bg-paper/8",
  ghost: "border-transparent text-muted hover:text-paper",
};

/** min-h-12 keeps every control at or above the 44px touch target on mobile. */
const BASE =
  "inline-flex min-h-12 items-center justify-center gap-2.5 rounded-lg border-2 px-6 font-condensed text-[0.95rem] tracking-[0.12em] uppercase transition-all duration-150 disabled:pointer-events-none disabled:opacity-40 motion-safe:active:translate-x-[2px] motion-safe:active:translate-y-[2px] motion-safe:active:shadow-none";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

export function Button({ variant = "primary", className, ...props }: Props) {
  return <button className={cn(BASE, VARIANTS[variant], className)} {...props} />;
}

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant };

export function ButtonLink({ variant = "primary", className, ...props }: LinkProps) {
  return <a className={cn(BASE, VARIANTS[variant], className)} {...props} />;
}
