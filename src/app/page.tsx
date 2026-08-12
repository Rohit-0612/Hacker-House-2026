import Link from "next/link";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { Hero } from "@/components/landing/Hero";
import { LivePreview } from "@/components/landing/LivePreview";
import { BRAND } from "@/lib/brand";

/**
 * Server component. The animated pieces are client islands, so the initial HTML
 * is fully rendered and the page paints without waiting on hydration.
 */
export default function LandingPage() {
  return (
    <>
      <main id="main" className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(70%_50%_at_50%_0%,rgba(123,92,255,0.32),transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[26rem] h-[36rem] bg-[radial-gradient(60%_50%_at_70%_40%,rgba(255,77,109,0.18),transparent_70%)]"
        />

        <div className="relative z-10">
          <Hero />
          <LivePreview />
          <FeatureCards />

          <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-5 pt-6 pb-24 text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Ready in about <span className="text-sunset">ten seconds</span>
            </h2>
            <p className="max-w-md text-sm text-muted sm:text-base">
              One photo in, a share-ready PNG out. Nothing to sign up for.
            </p>
            <Link
              href="/create"
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-sunset px-9 font-display text-base font-bold text-night shadow-[0_20px_54px_-16px_rgba(255,110,90,0.9)] transition-transform duration-200 motion-safe:hover:scale-[1.04] motion-safe:active:scale-95"
            >
              Create yours
            </Link>
          </section>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/8 px-5 py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="font-display text-[0.7rem] font-bold tracking-[0.26em] text-muted">
            {BRAND.event}
          </p>
          <p className="text-xs text-muted">
            {BRAND.hashtag} · {BRAND.coords}
          </p>
        </div>
      </footer>
    </>
  );
}
