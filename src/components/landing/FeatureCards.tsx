"use client";

import { motion, useReducedMotion } from "framer-motion";

const FEATURES = [
  {
    title: "Handles real photos",
    body: "Portrait, landscape, off-centre, sideways iPhone HEIC. Smart cropping finds the subject so you never have to crop first.",
    icon: (
      <path
        d="M4 16.5 8.5 12l3 3L15 11l5 5.5M4 5.5h16v13H4z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Real PNG, high resolution",
    body: "Rendered server-side at 1000×1000 and 1200×630 — an actual image file, not a screenshot of a web page.",
    icon: (
      <path
        d="M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5M4 17v2a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-2"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Share that actually works",
    body: "On mobile the PNG attaches straight to X. On desktop the link preview shows your real card — never a blank thumbnail.",
    icon: (
      <path
        d="M8.5 13.5 15 17m-6.5-6.5L15 7M12 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm8-6.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm0 13a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

export function FeatureCards() {
  const reduced = useReducedMotion();

  return (
    <section className="mx-auto w-full max-w-5xl px-5 py-16">
      <div className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((feature, i) => (
          <motion.article
            key={feature.title}
            initial={{ opacity: 0, y: reduced ? 0 : 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="glass grain relative flex flex-col gap-3.5 overflow-hidden rounded-3xl p-6"
          >
            <span
              aria-hidden
              className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-surf"
            >
              <svg viewBox="0 0 24 24" fill="none" className="size-5">
                {feature.icon}
              </svg>
            </span>
            <h3 className="font-display text-base font-bold">{feature.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{feature.body}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
