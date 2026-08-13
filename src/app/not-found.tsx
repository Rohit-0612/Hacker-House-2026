import Link from "next/link";
import { BRAND } from "@/lib/brand";

export default function NotFound() {
  return (
    <main
      id="main"
      className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-jungle-deep px-5 text-center"
    >
      <p className="font-display text-6xl font-bold text-lemon">404</p>
      <h1 className="font-condensed text-xl tracking-[0.1em] text-paper uppercase">
        Off the rails
      </h1>
      <p className="max-w-sm font-mono text-sm leading-relaxed text-muted">
        That pass link may have expired, or it was never issued.
      </p>
      <Link
        href="/#pass"
        className="mt-2 inline-flex min-h-12 items-center rounded-lg border-2 border-ink bg-gold px-7 font-condensed tracking-[0.14em] text-ink uppercase shadow-[4px_4px_0_var(--color-ink)]"
      >
        Make your own
      </Link>
      <p className="label mt-4 text-muted/60">{BRAND.event}</p>
    </main>
  );
}
