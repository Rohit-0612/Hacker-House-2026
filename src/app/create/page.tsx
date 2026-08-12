import type { Metadata } from "next";
import Link from "next/link";
import { CreateFlow } from "@/components/create/CreateFlow";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Create your builder identity",
  description: BRAND.tagline,
};

export default function CreatePage() {
  return (
    <main id="main" className="relative min-h-dvh px-5 pt-6 pb-20">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(70%_45%_at_50%_0%,rgba(123,92,255,0.26),transparent_65%)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col gap-7">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-4">
              <path
                d="M15 5 8 12l7 7"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </Link>
          <span className="font-display text-[0.7rem] font-bold tracking-[0.28em] text-muted">
            {BRAND.event}
          </span>
        </header>

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Build your <span className="text-sunset">identity</span>
          </h1>
          <p className="text-sm text-muted sm:text-base">
            Upload a photo, pick a format, and get a share-ready PNG in seconds. No account, no
            watermark queue.
          </p>
        </div>

        <ErrorBoundary>
          <CreateFlow />
        </ErrorBoundary>
      </div>
    </main>
  );
}
