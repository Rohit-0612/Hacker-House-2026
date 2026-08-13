"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/cn";
import type { Artwork } from "@/lib/pass";
import {
  canShareFiles,
  claimTab,
  downloadBlob,
  filenameFor,
  shareFile,
  withTimeout,
  xIntentUrl,
} from "@/lib/share";
import type { PassFields } from "@/lib/types";
import { onceUploader, type UploadResult } from "@/lib/upload";

/** How long a *click* will wait on a publish that wasn't already prefetched. */
const UPLOAD_BUDGET_MS = 8000;

/**
 * Whether this browser can put a file into a share sheet.
 *
 * Read through useSyncExternalStore so the server renders `false` and the client
 * reads the real capability without a state write from an effect — the same
 * hydration trap that `useReducedMotion` set earlier in this project. The
 * capability never changes for a given page, so there is nothing to subscribe
 * to and the snapshot is cached.
 */
const subscribeNever = () => () => {};
let shareCapability: boolean | null = null;

function canShareSnapshot(): boolean {
  shareCapability ??= canShareFiles([
    new File([new Uint8Array(1)], "pass.png", { type: "image/png" }),
  ]);
  return shareCapability;
}

interface Props {
  artwork: Artwork;
  fields: PassFields;
  onRestart: () => void;
}

type Busy = "x" | "share" | "link" | null;

export function PassResult({ artwork, fields, onRestart }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [published, setPublished] = useState<UploadResult | null>(null);
  const [zoom, setZoom] = useState(false);
  const canShare = useSyncExternalStore(subscribeNever, canShareSnapshot, () => false);

  const upload = useMemo(() => onceUploader(artwork, fields), [artwork, fields]);
  const filename = filenameFor(artwork.format, fields.name);

  // Focus the result so a keyboard or screen-reader user is not left at the
  // bottom of a form that has just been replaced.
  useEffect(() => {
    heading.current?.focus();
  }, []);

  /**
   * Publishes ahead of the click.
   *
   * Started on hover/focus of a share control rather than when the pass is
   * generated: every generation writing to Blob would burn the free tier on
   * people who never share. By the time the pointer travels to the button the
   * ~250KB upload is usually already done, which is what lets Share on X be a
   * plain link instead of a scripted popup.
   */
  const prefetch = useCallback(() => {
    if (published) return;
    void upload()
      .then(setPublished)
      .catch(() => undefined);
  }, [published, upload]);

  const download = () => {
    downloadBlob(artwork.main.blob, filename);
    setNotice(null);
  };

  const publish = async (): Promise<UploadResult | null> => {
    if (published) return published;
    const result = await withTimeout(upload(), UPLOAD_BUDGET_MS);
    if (result) setPublished(result);
    return result;
  };

  /**
   * Only used when the link isn't ready yet. Once it is, Share on X renders as a
   * real anchor and this never runs — an ordinary navigation is not subject to
   * the popup heuristics that were swallowing the tab.
   */
  const shareOnX = async () => {
    setBusy("x");
    setNotice(null);
    const navigate = claimTab();

    try {
      const result = await publish();
      if (result) {
        navigate(xIntentUrl(artwork.format, result.shareUrl));
      } else {
        // Deliberately no download here: a file appearing unannounced is what
        // made this look broken. Say what happened and let them choose.
        navigate(xIntentUrl(artwork.format));
        setNotice(
          "We couldn't publish a link, so the post has no preview. Download the pass and attach it.",
        );
      }
    } finally {
      setBusy(null);
    }
  };

  /** Web Share Level 2 — the only path that attaches the real PNG to the X app. */
  const sharePass = async () => {
    const file = new File([artwork.main.blob], filename, { type: "image/png" });
    setBusy("share");
    await shareFile(file, artwork.format);
    setBusy(null);
  };

  const copyLink = async () => {
    setBusy("link");
    setNotice(null);
    try {
      const result = await publish();
      if (!result) {
        setNotice("Couldn't publish a link just now. Download the pass and post it directly.");
        return;
      }
      await navigator.clipboard.writeText(result.shareUrl);
      setNotice("Share link copied.");
    } catch {
      setNotice("Couldn't copy the link — check clipboard permissions.");
    } finally {
      setBusy(null);
    }
  };

  const rows: [string, string][] = [
    ["Tag no.", artwork.identity.ticketNo],
    ["Baggage ID", artwork.identity.builderId],
    ["PNR", artwork.identity.pnr],
    ["Seat", artwork.identity.seat],
    ["Coach", artwork.identity.coach],
    ["Platform", artwork.identity.platform],
    ["Team", fields.team],
    ["Origin", fields.city],
  ];

  const shareHref = published ? xIntentUrl(artwork.format, published.shareUrl) : null;
  const localOnly =
    typeof window !== "undefined" && /^(localhost|127\.|\[?::1)/.test(window.location.hostname);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-8"
    >
      <div className="flex flex-col gap-2">
        <h3
          ref={heading}
          tabIndex={-1}
          className="font-condensed text-3xl tracking-[0.06em] text-paper uppercase outline-none sm:text-4xl"
        >
          Your pass is <span className="text-lemon">ready</span>
        </h3>
        {/* The PFP frame carries no name, so the greeting has to degrade. */}
        <p className="label text-muted">
          {fields.name ? `All aboard, ${fields.name}. ` : ""}
          {BRAND.chant}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setZoom(true)}
        className="group block w-full overflow-hidden rounded-xl border-2 border-jungle-line bg-jungle-deep"
        aria-label="Enlarge your pass"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={artwork.main.url}
          width={artwork.main.width}
          height={artwork.main.height}
          alt={fields.name ? `${fields.name}'s ${BRAND.event} builder pass` : `${BRAND.event} PFP frame`}
          className="w-full transition-transform duration-300 motion-safe:group-hover:scale-[1.02]"
        />
      </button>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button onClick={download} className="w-full">
          Download pass
        </Button>

        {/* Feature-gated: where there is no share sheet, this used to silently
            download and read as a broken share. */}
        {canShare && (
          <Button variant="magenta" onClick={sharePass} disabled={busy !== null} className="w-full">
            {busy === "share" && <Spinner />}
            Share pass
          </Button>
        )}

        {shareHref ? (
          <ButtonLink
            variant="outline"
            href={shareHref}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("w-full", !canShare && "sm:col-start-2 sm:row-start-1")}
          >
            <XLogo />
            Share on X
          </ButtonLink>
        ) : (
          <Button
            variant="outline"
            onClick={shareOnX}
            onPointerEnter={prefetch}
            onFocus={prefetch}
            disabled={busy !== null}
            className={cn("w-full", !canShare && "sm:col-start-2 sm:row-start-1")}
          >
            {busy === "x" ? <Spinner /> : <XLogo />}
            Share on X
          </Button>
        )}

        <Button
          variant="outline"
          onClick={copyLink}
          onPointerEnter={prefetch}
          onFocus={prefetch}
          disabled={busy !== null}
          className="w-full"
        >
          {busy === "link" && <Spinner />}
          Copy verify link
        </Button>
      </div>

      {published && (
        <p className="label break-all text-muted">
          Share link: <span className="text-lemon">{published.shareUrl}</span>
        </p>
      )}

      {localOnly && (
        <p className="label text-muted/80">
          Heads up: X can&apos;t read a link preview from localhost. Deploy the site to see the pass
          unfurl in a post.
        </p>
      )}

      <p aria-live="polite" className={notice ? "label text-lemon" : "sr-only"}>
        {notice}
      </p>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border-2 border-jungle-line bg-jungle-panel p-5 sm:grid-cols-4">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1">
            <dt className="label text-muted">{label}</dt>
            <dd className="truncate font-condensed text-base tracking-[0.08em] text-lemon uppercase">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex justify-center">
        <Button variant="ghost" onClick={onRestart}>
          Create another pass
        </Button>
      </div>

      {zoom && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Your pass, enlarged"
          onClick={() => setZoom(false)}
          onKeyDown={(e) => e.key === "Escape" && setZoom(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-jungle-deep/95 p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={artwork.main.url} alt="" className="max-h-full max-w-full object-contain" />
          <button
            type="button"
            autoFocus
            onClick={() => setZoom(false)}
            className="absolute right-4 top-4 min-h-11 rounded-lg border-2 border-paper/40 px-4 font-condensed text-sm tracking-[0.14em] text-paper uppercase"
          >
            Close
          </button>
        </div>
      )}
    </motion.div>
  );
}

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
      <path d="M18.9 2H22l-7.2 8.2L23.2 22h-6.6l-5.2-6.8L5.5 22H2.4l7.7-8.8L1.2 2h6.8l4.7 6.2L18.9 2Zm-1.1 18h1.7L7.3 3.8H5.5L17.8 20Z" />
    </svg>
  );
}
