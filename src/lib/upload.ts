import type { Artwork } from "./pass";
import { isApiError, type PassFields } from "./types";

export interface UploadResult {
  /** Absolute URL of the /pass/[id] share page. */
  shareUrl: string;
  /** Absolute URL of the stored OG image. */
  imageUrl: string;
}

/**
 * Publishes the artwork so `/pass/[id]` has something to point `og:image` at.
 *
 * This is the only moment a user's photo leaves the browser, and it only happens
 * when they explicitly ask to share a link.
 *
 * Only the share board goes up — one ~250KB JPEG. The full-resolution PNG is the
 * user's download and never needed storing: `og:image` only ever pointed at the
 * board, and not uploading it keeps this inside the Blob free tier.
 */
export async function uploadPass(artwork: Artwork, fields: PassFields): Promise<UploadResult> {
  const body = new FormData();
  body.set("id", artwork.id);
  body.set("format", artwork.format);
  body.set("fields", JSON.stringify(fields));
  body.set("identity", JSON.stringify(artwork.identity));
  body.set("share", artwork.share.blob, "share.jpg");

  const res = await fetch("/api/pass", { method: "POST", body });
  const payload: unknown = await res.json();

  if (!res.ok) {
    throw new Error(isApiError(payload) ? payload.error : "Couldn't publish that pass.");
  }

  return payload as UploadResult;
}

/**
 * Uploads at most once per artwork.
 *
 * Share on X, Copy link and LinkedIn all need the same published URL; without
 * this, using two of them would write the same pass to storage twice.
 */
export function onceUploader(artwork: Artwork, fields: PassFields) {
  let pending: Promise<UploadResult> | null = null;
  return () => (pending ??= uploadPass(artwork, fields));
}
