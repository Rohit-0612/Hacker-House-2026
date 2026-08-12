"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Route-level error boundary. Without this a server error in /create or /s/[id]
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
      className="flex min-h-dvh flex-col items-center justify-center gap-5 px-5 text-center"
    >
      <p className="font-display text-5xl font-bold text-sunset">Oops</p>
      <h1 className="font-display text-xl font-bold">That didn&apos;t go to plan</h1>
      <p className="max-w-sm text-sm text-muted">
        Something broke while loading this page. Trying again usually clears it.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2.5">
        <Button onClick={reset}>Try again</Button>
        <a
          href="/create"
          className="inline-flex min-h-12 items-center rounded-full px-6 font-display text-[0.95rem] font-bold text-muted transition-colors hover:text-ink"
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
