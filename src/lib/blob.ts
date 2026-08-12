import "server-only";

import { list, put } from "@vercel/blob";
import type { Format, GenerateFields, OutputVariant } from "./types";

/**
 * Vercel Blob backs the link-share path: the brief requires that an X link
 * preview shows the real generated graphic, which means the PNG needs a public
 * URL and an OG page pointing at it.
 *
 * The token is injected automatically on Vercel. Locally it is usually absent,
 * so every function here degrades to "no storage" rather than throwing — the
 * generator still works, it just falls back to download + Web Share.
 */
export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export interface ShareRecord {
  id: string;
  format: Format;
  fields: GenerateFields | null;
  images: { variant: OutputVariant; url: string; width: number; height: number }[];
  createdAt: string;
}

export function newShareId(): string {
  // 12 chars of base36 from crypto — short enough for a tweet, unguessable enough
  // that share pages are not enumerable.
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 12);
}

const prefixFor = (id: string) => `shares/${id}/`;

export async function putShareImage(
  id: string,
  variant: OutputVariant,
  png: Buffer,
): Promise<string> {
  const blob = await put(`${prefixFor(id)}${variant}.png`, png, {
    access: "public",
    contentType: "image/png",
    addRandomSuffix: false,
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  });
  return blob.url;
}

export async function putShareRecord(record: ShareRecord): Promise<void> {
  await put(`${prefixFor(record.id)}meta.json`, JSON.stringify(record), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    // Short TTL: the record is written once and read by crawlers moments later.
    cacheControlMaxAge: 60,
  });
}

/** Returns null for unknown ids, an unconfigured store, or a malformed record. */
export async function getShareRecord(id: string): Promise<ShareRecord | null> {
  if (!isBlobConfigured()) return null;
  if (!/^[a-z0-9]{6,24}$/.test(id)) return null;

  try {
    const { blobs } = await list({ prefix: `${prefixFor(id)}meta.json`, limit: 1 });
    const meta = blobs[0];
    if (!meta) return null;

    const res = await fetch(meta.url, { next: { revalidate: 300 } });
    if (!res.ok) return null;

    const record = (await res.json()) as ShareRecord;
    if (!record || typeof record.id !== "string" || !Array.isArray(record.images)) return null;
    return record;
  } catch {
    return null;
  }
}
