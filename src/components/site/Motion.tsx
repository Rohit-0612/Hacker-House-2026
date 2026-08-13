"use client";

import { MotionConfig } from "framer-motion";

/**
 * Reduced motion, handled once, by the animation library.
 *
 * Components must not branch on `useReducedMotion()` in anything they render:
 * the hook reads a media query, so it is always `false` during SSR and can be
 * `true` on the client, which produces a hydration mismatch and a re-render of
 * the whole tree. `reducedMotion="user"` lets Framer drop transform animations
 * itself, downstream of render, so the markup stays identical on both sides.
 */
export function Motion({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
