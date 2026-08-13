"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { BRAND } from "@/lib/brand";
import { GoaBadge, Sun, Waves } from "./Motifs";

const WORDS = ["HACKER", "HOUSE"];

export function Hero() {
  const ref = useRef<HTMLElement>(null);

  // Scroll-linked parallax on the foliage. Purely additive: at scroll position 0
  // — which is what the server renders — every value is its identity, so there
  // is nothing here that can disagree with the SSR'd markup.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const palmY = useTransform(scrollYProgress, [0, 1], ["0%", "26%"]);
  const sunY = useTransform(scrollYProgress, [0, 1], ["0%", "-40%"]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[92svh] flex-col px-5 pt-6 pb-14 sm:px-8"
    >
      <motion.div
        aria-hidden
        style={{ y: sunY }}
        className="pointer-events-none absolute inset-x-0 top-[38%] -z-10 flex justify-center"
      >
        <Sun className="w-[min(76vw,40rem)] text-lemon/20" />
      </motion.div>

      <motion.div aria-hidden style={{ y: palmY }} className="pointer-events-none absolute inset-x-0 bottom-0 -z-10">
        <Waves className="h-24 w-full text-paper/10" />
      </motion.div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-8 pt-16 sm:pt-20">
        <h1 className="relative text-center leading-[0.82] text-lemon">
          <span className="sr-only">
            {BRAND.eventFull} — {BRAND.dates}
          </span>

          <span aria-hidden className="block">
            {WORDS.map((word, i) => (
              <span key={word} className="block overflow-hidden py-[0.02em]">
                <span
                  style={{ animationDelay: `${0.1 + i * 0.12}s` }}
                  className="animate-rise block font-display text-[clamp(3.6rem,17vw,11rem)] font-bold tracking-[-0.02em]"
                >
                  {word}
                </span>
              </span>
            ))}
          </span>

          {/* Anchored to the heading, not to a word: each word sits in an
              overflow-hidden box so its reveal can be masked, and a badge
              positioned inside one of those gets its lower half sliced off.
              Centred on the h1 lands it on the join between the two lines,
              which is where the event's own lockup puts it. */}
          <GoaBadge
            aria-hidden
            className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-[clamp(1.6rem,6.4vw,4rem)]"
          />
        </h1>

        <div
          style={{ animationDelay: "0.55s" }}
          className="animate-fade flex flex-col items-center gap-6"
        >
          <p className="label flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-lemon">
            <span>{BRAND.location}</span>
            <span aria-hidden className="text-magenta">
              ·
            </span>
            <span>{BRAND.dates}</span>
            <span aria-hidden className="text-magenta">
              ·
            </span>
            <span>{BRAND.studio}</span>
          </p>

          <a
            href="#pass"
            className="group inline-flex min-h-14 items-center gap-3 rounded-lg border-2 border-ink bg-gold px-8 font-condensed text-base tracking-[0.16em] text-ink uppercase shadow-[5px_5px_0_var(--color-ink)] transition-transform duration-150 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-x-[3px] motion-safe:active:translate-y-[3px] motion-safe:active:shadow-none"
          >
            Get your baggage label
            <span aria-hidden className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </a>

          <p className="label text-center text-paper/60">
            Upload one photo · No signup · Ready in seconds
          </p>
        </div>
      </div>
    </section>
  );
}
