"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { randomBuilderTitle } from "@/lib/builder-titles";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/cn";
import type { Format } from "@/lib/types";

/**
 * An interactive mock of both outputs, built from DOM rather than a generated
 * image: it stays crisp at any size, ships no bytes, and needs no sample face.
 * Geometry and type mirror the real renderers closely enough to set accurate
 * expectations before anyone uploads anything.
 */
export function LivePreview() {
  const [format, setFormat] = useState<Format>("pfp");
  const [title, setTitle] = useState("Midnight Shipper");

  return (
    <section className="mx-auto w-full max-w-5xl px-5 py-10">
      <div className="glass grain relative overflow-hidden rounded-[2rem] p-6 sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-coral/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -left-20 size-72 rounded-full bg-violet/25 blur-3xl"
        />

        <div className="relative flex flex-col items-center gap-7">
          <div className="flex flex-col items-center gap-2.5 text-center">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Two formats, one upload</h2>
            <p className="max-w-md text-sm text-muted">
              Preview what you&apos;ll get. Toggle between them, and reroll the builder title.
            </p>
          </div>

          <div
            role="radiogroup"
            aria-label="Preview format"
            className="flex gap-1.5 rounded-full border border-white/10 bg-night/60 p-1.5"
          >
            {(
              [
                ["pfp", "PFP Frame"],
                ["card", "Builder ID"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={format === value}
                onClick={() => setFormat(value)}
                className={cn(
                  "min-h-10 rounded-full px-5 font-display text-xs font-bold transition-colors",
                  format === value ? "bg-sunset text-night" : "text-muted hover:text-ink",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex min-h-[19rem] w-full items-center justify-center sm:min-h-[22rem]">
            <AnimatePresence mode="wait">
              {format === "pfp" ? (
                <motion.div key="pfp" {...swap}>
                  <PfpMock />
                </motion.div>
              ) : (
                <motion.div key="card" {...swap} className="w-full max-w-2xl">
                  <CardMock title={title} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => setTitle((t) => randomBuilderTitle(t))}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 text-xs font-semibold text-muted transition-colors hover:border-white/25 hover:text-ink"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-4">
              <path
                d="M3 12a9 9 0 0 1 15.3-6.4L21 8m0 0V3m0 5h-5M21 12a9 9 0 0 1-15.3 6.4L3 16m0 0v5m0-5h5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Reroll builder title
          </button>
        </div>
      </div>
    </section>
  );
}

const swap = {
  initial: { opacity: 0, scale: 0.94, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.94, y: -10 },
  transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const },
};

function PfpMock() {
  return (
    <div className="relative size-60 shrink-0 sm:size-72">
      <div className="absolute inset-0 rounded-full bg-sunset-full p-[7%] shadow-[0_30px_80px_-24px_rgba(255,77,109,0.7)]">
        <div className="relative flex size-full items-end justify-center overflow-hidden rounded-full bg-night-raised ring-2 ring-surf/50">
          <Silhouette />
        </div>
      </div>

      {/* Ring lettering, matched to the generated frame's curved text.
          The wrapper's p-[7%] puts the gradient band between r=86 and r=100 in
          this 200-unit viewBox. Top-arc glyphs grow outward from the baseline
          and bottom-arc glyphs grow inward, so the two radii sit either side of
          the band centre (93) rather than being equal. */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <path id="preview-arc-top" d="M 10 100 A 90 90 0 0 1 190 100" />
          <path id="preview-arc-bottom" d="M 4 100 A 96 96 0 0 0 196 100" />
        </defs>
        <text
          fill="#F8FAFC"
          fontSize="8.5"
          fontWeight="700"
          letterSpacing="1.6"
          className="font-display"
        >
          <textPath href="#preview-arc-top" startOffset="50%" textAnchor="middle">
            {BRAND.event}
          </textPath>
        </text>
        <text
          fill="#070B1F"
          fontSize="8.5"
          fontWeight="700"
          letterSpacing="2.6"
          className="font-display"
        >
          <textPath href="#preview-arc-bottom" startOffset="50%" textAnchor="middle">
            BUILDER
          </textPath>
        </text>
      </svg>
      <span className="sr-only">
        Preview of the circular {BRAND.event} profile picture frame with curved lettering.
      </span>
    </div>
  );
}

function CardMock({ title }: { title: string }) {
  return (
    <div className="relative aspect-[1200/630] w-full overflow-hidden rounded-2xl bg-night shadow-[0_36px_90px_-30px_rgba(255,77,109,0.55)]">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 8%, rgba(123,92,255,0.42) 0%, rgba(123,92,255,0) 46%), radial-gradient(circle at 88% 96%, rgba(255,77,109,0.38) 0%, rgba(255,77,109,0) 52%)",
        }}
      />

      <div className="relative flex h-full items-center gap-[4%] px-[5%] py-[4%]">
        <div className="aspect-square h-[75%] shrink-0 rounded-full bg-sunset-full p-[3%]">
          <div className="relative flex size-full items-end justify-center overflow-hidden rounded-full bg-night-raised ring-2 ring-night">
            <Silhouette />
          </div>
        </div>

        <div className="flex h-full min-w-0 flex-1 flex-col justify-between py-[1%]">
          <div className="flex min-w-0 flex-col gap-[3%]">
            <div className="flex items-center gap-2">
              <span aria-hidden className="h-[3px] w-6 rounded-full bg-sunset" />
              <span className="font-display text-[clamp(0.5rem,1.35vw,0.8rem)] font-bold tracking-[0.28em] text-ink">
                {BRAND.wordmark}
              </span>
            </div>

            <p className="truncate font-display text-[clamp(1.1rem,4.4vw,2.6rem)] leading-none font-bold tracking-tight">
              Aditi Raikar
            </p>

            <div className="flex flex-col gap-[2px]">
              <span className="font-display text-[clamp(0.4rem,1.1vw,0.65rem)] font-bold tracking-[0.22em] text-surf">
                STACK
              </span>
              <span className="truncate text-[clamp(0.55rem,1.6vw,1rem)] font-semibold">
                Full-stack · TypeScript
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.span
                key={title}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                className="inline-flex w-fit max-w-full items-center gap-2 truncate rounded-full bg-sunset px-[3%] py-[1.6%] font-display text-[clamp(0.55rem,1.7vw,1.05rem)] font-bold text-[#2A0A12]"
              >
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-night/70" />
                {title}
              </motion.span>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between border-t border-white/12 pt-[2%]">
            <span className="text-sunset font-display text-[clamp(0.5rem,1.3vw,0.8rem)] font-bold">
              {BRAND.hashtag}
            </span>
            <span className="text-[clamp(0.4rem,1.1vw,0.7rem)] tracking-wider text-muted">
              {BRAND.coords}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Neutral stand-in for the uploaded photo. */
function Silhouette() {
  return (
    <svg viewBox="0 0 100 100" className="size-[86%] text-ink/25" aria-hidden>
      <circle cx="50" cy="34" r="19" fill="currentColor" />
      <path d="M12 100a38 34 0 0 1 76 0Z" fill="currentColor" />
    </svg>
  );
}
