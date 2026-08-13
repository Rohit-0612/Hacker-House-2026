"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Route-level error boundary. Without this a server error in /pass/[id]
 * renders Next's unstyled default screen, which looks like the site is broken
 * rather than like something went wrong inside it.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[route error]", error);
  }, [error]);

  return (
    <main
      id="main"
      className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-jungle-deep px-5 text-center"
    >
      <p className="font-display text-5xl font-bold text-lemon">Signal lost</p>
      <h1 className="font-condensed text-xl tracking-[0.1em] text-paper uppercase">
        That didn&apos;t go to plan
      </h1>
      <p className="max-w-sm font-mono text-sm leading-relaxed text-muted">
        Something broke while loading this page. Trying again usually clears it.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2.5">
        <Button onClick={reset}>Try again</Button>
        {/* A plain <a>, deliberately: "start over" needs a full document load.
            next/link would soft-navigate within the same React tree that just
            threw, which is the state the user is trying to escape. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/#pass"
          className="inline-flex min-h-12 items-center px-6 font-condensed text-sm tracking-[0.14em] text-muted uppercase transition-colors hover:text-paper"
        >
          Start over
        </a>
      </div>
      {error.digest && (
        <p className="mt-1 font-mono text-[0.7rem] text-muted/60">ref {error.digest}</p>
      )}
    </main>
  );
}
