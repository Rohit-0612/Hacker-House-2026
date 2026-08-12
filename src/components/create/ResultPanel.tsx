"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import {
  captionFor,
  downloadUrl,
  filenameFor,
  shareFile,
  urlToFile,
  xIntentUrl,
} from "@/lib/share";
import type { CardVariant, GenerateResult } from "@/lib/types";

interface Props {
  result: GenerateResult;
  onRestart: () => void;
}

export function ResultPanel({ result, onRestart }: Props) {
  const [variant, setVariant] = useState<CardVariant>("landscape");
  const [downloaded, setDownloaded] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  // framer-motion animates via JS, so the prefers-reduced-motion block in
  // globals.css does not reach it — the check has to happen here.
  const reduced = useReducedMotion();

  /**
   * This panel replaces the form entirely, so without moving focus a keyboard
   * or screen-reader user is left on a detached button with no idea the image
   * was generated. The heading is focusable only programmatically (tabIndex -1),
   * so it never joins the tab order.
   */
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const isCard = result.format === "card";
  const active =
    (isCard ? result.images.find((i) => i.variant === variant) : result.images[0]) ??
    result.images[0];

  if (!active) return null;

  // Built from window.location rather than the shared siteUrl() helper: that
  // helper reads VERCEL_PROJECT_PRODUCTION_URL, which is not a NEXT_PUBLIC_
  // variable and so is undefined in the browser — it would silently fall back to
  // localhost and put a dead link in the tweet.
  const shareUrl =
    result.shareId && typeof window !== "undefined"
      ? `${window.location.origin}/s/${result.shareId}`
      : null;
  const filename = filenameFor(result.format, result.fields?.name);

  async function handleDownload() {
    if (!active) return;
    downloadUrl(active.url, filename);
    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 2600);
  }

  /**
   * Two share paths, tried in order:
   *  1. Web Share API with the file — mobile only, attaches the real PNG.
   *  2. X intent + share URL — X unfurls /s/[id], whose OG image is the graphic.
   */
  async function handleShare() {
    if (!active) return;
    setSharing(true);
    try {
      const file = await urlToFile(active.url, filename);
      const shared = await shareFile(file, result.format);
      if (shared) return;
      window.open(xIntentUrl(result.format, shareUrl), "_blank", "noopener,noreferrer");
    } catch {
      window.open(xIntentUrl(result.format, shareUrl), "_blank", "noopener,noreferrer");
    } finally {
      setSharing(false);
    }
  }

  async function handleCopyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard blocked — the link is visible in the tweet anyway */
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <SuccessBadge reduced={reduced} />
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-2xl font-bold outline-none"
        >
          Your identity is ready
        </h2>
        <p className="text-sm text-muted">
          Generated in {(result.elapsedMs / 1000).toFixed(1)}s · {active.width}×{active.height} PNG
        </p>
      </div>

      {isCard && result.images.length > 1 && (
        <div
          role="radiogroup"
          aria-label="Card size"
          className="mx-auto flex gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1.5"
        >
          {(["landscape", "square"] as CardVariant[]).map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={variant === v}
              onClick={() => setVariant(v)}
              className={cn(
                "min-h-10 rounded-full px-5 font-display text-xs font-bold transition-colors",
                variant === v ? "bg-ink text-night" : "text-muted hover:text-ink",
              )}
            >
              {v === "landscape" ? "1200×630" : "1080×1080"}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={active.variant}
          initial={{ opacity: 0, scale: reduced ? 1 : 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: reduced ? 1 : 0.98 }}
          transition={{ duration: reduced ? 0 : 0.25 }}
          className="flex justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.url}
            width={active.width}
            height={active.height}
            alt={
              result.fields
                ? `Builder ID card for ${result.fields.name}, ${result.fields.title}`
                : "Your HH Goa 2026 profile picture frame"
            }
            className={cn(
              "w-full max-w-lg shadow-[0_40px_110px_-32px_rgba(255,77,109,0.6)]",
              result.format === "pfp" ? "aspect-square rounded-full" : "rounded-2xl",
            )}
          />
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-col gap-2.5">
        <Button onClick={handleDownload} className="w-full">
          {downloaded ? (
            <>
              <CheckIcon /> Downloaded
            </>
          ) : (
            <>
              <DownloadIcon /> Download PNG
            </>
          )}
        </Button>

        <Button variant="secondary" onClick={handleShare} disabled={sharing} className="w-full">
          {sharing ? <Spinner /> : <XIcon />}
          {sharing ? "Preparing…" : "Share to X"}
        </Button>

        {/* Stacks on narrow phones: side by side, "Generate another" wraps onto
            two lines at 390px and the row looks broken. */}
        <div className="flex flex-col gap-1 min-[26rem]:flex-row min-[26rem]:gap-2.5">
          {shareUrl && (
            <Button variant="ghost" onClick={handleCopyLink} className="min-[26rem]:flex-1">
              {copied ? "Link copied" : "Copy link"}
            </Button>
          )}
          <Button variant="ghost" onClick={onRestart} className="min-[26rem]:flex-1">
            Generate another
          </Button>
        </div>
      </div>

      <p className="text-center text-xs leading-relaxed text-muted">
        {shareUrl ? (
          <>
            On mobile, Share attaches the PNG straight to X. On desktop it opens a tweet linking
            your card, and the preview shows this exact image.
          </>
        ) : (
          <>
            Share opens X with your caption prefilled. Attach the downloaded PNG to the tweet —
            link previews need blob storage, which isn&apos;t configured here.
          </>
        )}
      </p>

      <details className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <summary className="cursor-pointer font-display text-xs font-bold tracking-wider text-muted uppercase">
          Caption
        </summary>
        <p className="mt-2.5 text-sm whitespace-pre-line text-ink/85">
          {captionFor(result.format)}
        </p>
      </details>
    </motion.div>
  );
}

function SuccessBadge({ reduced }: { reduced: boolean | null }) {
  return (
    <motion.span
      initial={reduced ? { opacity: 0 } : { scale: 0, rotate: -25 }}
      animate={reduced ? { opacity: 1 } : { scale: 1, rotate: 0 }}
      transition={reduced ? { duration: 0.15 } : { type: "spring", stiffness: 320, damping: 16 }}
      className="mb-1 flex size-12 items-center justify-center rounded-full bg-sunset text-night"
      aria-hidden
    >
      <CheckIcon className="size-6" />
    </motion.span>
  );
}

function CheckIcon({ className = "size-[1.15rem]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="m5 13 4.5 4.5L19 7"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-[1.15rem]">
      <path
        d="M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5M4 17v2a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-[1.05rem]">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
