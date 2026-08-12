import { BRAND } from "./brand";
import type { Format } from "./types";

const CAPTIONS: Record<Format, string> = {
  pfp: `Heading to HH Goa 2026 with my builder identity.\n\n${BRAND.hashtag}`,
  card: `Heading to HH Goa 2026 with my builder identity.\n\n${BRAND.hashtag}`,
};

export function captionFor(format: Format): string {
  return CAPTIONS[format];
}

/**
 * X web intent. An image cannot be attached via intent, so when a share URL is
 * available we pass it and let X unfurl the OG card — which is why /s/[id]
 * points og:image at the generated PNG.
 */
export function xIntentUrl(format: Format, shareUrl?: string | null): string {
  const params = new URLSearchParams({ text: captionFor(format) });
  if (shareUrl) params.set("url", shareUrl);
  return `https://x.com/intent/post?${params.toString()}`;
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

export async function urlToFile(url: string, filename: string): Promise<File> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], filename, { type: "image/png" });
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
  return format === "pfp" ? `hh-goa-2026-pfp-${slug}.png` : `hh-goa-2026-id-${slug}.png`;
}
