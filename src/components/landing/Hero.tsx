"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function Hero() {
  const reduced = useReducedMotion();

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduced ? 0 : 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <section className="relative flex flex-col items-center px-5 pt-20 pb-14 text-center sm:pt-28">
      <motion.span
        {...rise(0)}
        className="glass mb-7 inline-flex items-center gap-2.5 rounded-full px-4 py-2"
      >
        <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-coral" />
        <span className="font-display text-[0.7rem] font-bold tracking-[0.26em] text-ink/90">
          {BRAND.event}
        </span>
      </motion.span>

      <motion.h1
        {...rise(0.08)}
        className="max-w-4xl font-display text-5xl leading-[0.95] font-bold tracking-tight sm:text-7xl lg:text-8xl"
      >
        Frame In <span className="text-sunset">Goa</span>
      </motion.h1>

      <motion.p {...rise(0.16)} className="mt-6 max-w-xl text-base text-muted sm:text-lg">
        {BRAND.tagline}. Upload one photo — get a branded profile picture or builder ID card,
        ready to post.
      </motion.p>

      <motion.div {...rise(0.24)} className="mt-9 flex flex-col items-center gap-4">
        <Link
          href="/create"
          className="inline-flex min-h-14 items-center justify-center gap-2.5 rounded-full bg-sunset px-9 font-display text-base font-bold text-night shadow-[0_20px_54px_-16px_rgba(255,110,90,0.9)] transition-transform duration-200 motion-safe:hover:scale-[1.04] motion-safe:active:scale-95"
        >
          Create yours
          <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-[1.15rem]">
            <path
              d="M5 12h13m0 0-5.5-5.5M18 12l-5.5 5.5"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <p className="text-xs text-muted">No login · Free · Takes about 10 seconds</p>
      </motion.div>
    </section>
  );
}
