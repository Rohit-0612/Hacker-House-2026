import "server-only";

import { blobStore } from "./blob";
import { localStore } from "./local";
import type { ShareStore } from "./types";

export { isValidShareId } from "./types";
export type { ShareRecord, ShareStore } from "./types";

function onVercel(): boolean {
  return Boolean(process.env.VERCEL);
}

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Picks a persistence backend, or null when there is nowhere durable to write —
 * in which case the caller returns inline data: URLs and hides the link-share
 * path. Storage is an enhancement; the generator never depends on it.
 *
 *   Blob token present  -> Vercel Blob (production, and locally if you pull the token)
 *   local dev, no token -> filesystem, so /pass/[id] and OG tags stay testable
 *   on Vercel, no token -> null; ephemeral per-instance disk would hand out
 *                          share links that 404 on other instances
 */
export function getShareStore(): ShareStore | null {
  if (isBlobConfigured()) return blobStore;
  if (!onVercel()) return localStore;
  return null;
}

/** True when share URLs are relative and need the request origin prepended. */
export function storeUsesRelativeUrls(store: ShareStore): boolean {
  return store.kind === "local";
}

export async function getShareRecord(id: string) {
  const store = getShareStore();
  if (!store) return null;
  return store.getRecord(id);
}
