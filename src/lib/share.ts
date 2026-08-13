import { BRAND } from "./brand";
import type { Format } from "./types";

const CAPTION = `All aboard. I'm heading to Hacker House Goa 2026 — 28–31 Oct.\n\n${BRAND.hashtag}`;

export function captionFor(_format: Format): string {
  return CAPTION;
}

/**
 * X web intent. An image cannot be attached via intent, so when a share URL is
 * available we pass it and let X unfurl the OG card — which is why /pass/[id]
 * points og:image at the generated PNG.
 */
export function xIntentUrl(format: Format, shareUrl?: string | null): string {
  const params = new URLSearchParams({ text: captionFor(format) });
  if (shareUrl) params.set("url", shareUrl);
  return `https://x.com/intent/post?${params.toString()}`;
}

/** True when this looks like a phone or tablet — where an X app may be installed. */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

/**
 * Opens the X composer, preferring the installed app over the browser.
 *
 * Two things stop `https://x.com/intent/post` from reaching the app on a phone:
 * `target="_blank"` opts out of Universal Link / App Link handling entirely,
 * and even a top-level navigation only hands off if X's own link manifest
 * claims the `/intent/` path. The `twitter://` scheme goes straight to the app,
 * so it is tried first and the web intent is the fallback.
 *
 * The fallback is guarded by page visibility: if the app took over, this tab is
 * hidden and we must *not* also navigate it, or the user comes back to a stray
 * x.com page behind the app.
 */
export function openXComposer(format: Format, shareUrl?: string | null): void {
  const webUrl = xIntentUrl(format, shareUrl);

  if (!isTouchDevice()) {
    window.location.href = webUrl;
    return;
  }

  const message = shareUrl ? `${captionFor(format)}\n${shareUrl}` : captionFor(format);
  let settled = false;

  const goWeb = () => {
    if (settled || document.hidden) return;
    settled = true;
    window.location.href = webUrl;
  };

  const onHide = () => {
    if (document.hidden) settled = true;
  };
  document.addEventListener("visibilitychange", onHide, { once: true });

  // If the scheme is unhandled the page just sits there, so time out to the web.
  setTimeout(() => {
    document.removeEventListener("visibilitychange", onHide);
    goWeb();
  }, 1200);

  window.location.href = `twitter://post?message=${encodeURIComponent(message)}`;
}

/** Web Share API Level 2 — the only path that attaches the real PNG to the X app. */
export function canShareFiles(files: File[]): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (typeof nav.share !== "function" || typeof nav.canShare !== "function") return false;
  try {
    return nav.canShare({ files });
  } catch {
    return false;
  }
}

export async function shareFile(file: File, format: Format): Promise<boolean> {
  if (!canShareFiles([file])) return false;
  try {
    await navigator.share({ files: [file], text: captionFor(format) });
    return true;
  } catch (err) {
    // AbortError = user dismissed the sheet; not a failure worth surfacing.
    if (err instanceof DOMException && err.name === "AbortError") return true;
    return false;
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  downloadUrl(url, filename);
  // Revoked on the next tick: revoking synchronously can beat the click through
  // on Safari and silently download nothing.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function downloadUrl(url: string, filename: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function filenameFor(format: Format, name?: string): string {
  const slug =
    name
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24) || "builder";
  return format === "pfp" ? `hh-goa-2026-pfp-${slug}.png` : `hh-goa-2026-pass-${slug}.png`;
}

/**
 * A tab claimed synchronously inside a click handler.
 *
 * `window.open()` only counts as user-initiated for as long as the handler is on
 * the stack — call it after an `await` and iOS Safari swallows it. So the tab is
 * opened empty at click time and navigated once the upload resolves. Returns a
 * navigator that falls back to the current tab if the popup was blocked anyway.
 */
export function claimTab(): (url: string) => void {
  const win = typeof window !== "undefined" ? window.open("", "_blank") : null;
  if (win) win.opener = null;

  return (url: string) => {
    if (win && !win.closed) win.location.replace(url);
    else window.location.href = url;
  };
}

/** Resolves to `null` after `ms` — used to cap how long a share waits on upload. */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise.catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}
