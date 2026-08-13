"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/cn";

const STAGES = [
  "BOARDING...",
  "ASSIGNING BUILDER ID...",
  "ROUTING TO GOA...",
  "VERIFYING...",
] as const;

/** Total theatre budget. The paint itself takes ~50ms; this is pacing. */
export const BOARDING_MS = 1400;
const STAGE_MS = BOARDING_MS / STAGES.length;

export function BoardingOverlay({ open }: { open: boolean }) {
  return <AnimatePresence>{open && <Overlay />}</AnimatePresence>;
}

/**
 * Split out so the stage counter resets by unmounting rather than by an effect
 * writing state on close — generating a second pass has to start from BOARDING.
 */
function Overlay() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setStage((s) => Math.min(s + 1, STAGES.length - 1)),
      STAGE_MS,
    );
    return () => window.clearInterval(timer);
  }, []);

  return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="scanlines fixed inset-0 z-50 flex items-center justify-center bg-jungle-deep/95 px-6 backdrop-blur-sm"
          role="status"
          aria-live="assertive"
        >
          <div className="flex w-full max-w-sm flex-col items-center gap-8">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="grid size-20 place-items-center rounded-2xl border-[3px] border-lemon bg-jungle text-4xl"
              aria-hidden
            >
              🚂
            </motion.div>

            <ol className="flex w-full flex-col gap-3.5">
              {STAGES.map((text, i) => (
                <li key={text} className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={cn(
                      "size-2.5 shrink-0 rounded-full border-2 transition-colors duration-300",
                      i < stage
                        ? "border-lemon bg-lemon"
                        : i === stage
                          ? "border-magenta bg-magenta motion-safe:animate-pulse"
                          : "border-muted/40",
                    )}
                  />
                  <span
                    className={cn(
                      "font-condensed text-sm tracking-[0.16em] transition-colors duration-300",
                      i <= stage ? "text-paper" : "text-muted/45",
                    )}
                  >
                    {text}
                  </span>
                </li>
              ))}
            </ol>

            <div className="w-full">
              <div className="h-1 w-full overflow-hidden rounded-full bg-paper/12">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: BOARDING_MS / 1000, ease: "linear" }}
                  className="h-full bg-magenta"
                />
              </div>
              <p className="label mt-4 text-center text-muted">
                {BRAND.event} · {BRAND.passName}
              </p>
            </div>
          </div>
        </motion.div>
  );
}
