import "server-only";

import { list, put } from "@vercel/blob";
import { isValidShareId, type ShareRecord, type ShareStore } from "./types";
import type { OutputVariant } from "../types";

/**
 * Vercel Blob — the production store. This is what makes the X link preview
 * show the real graphic: the PNG needs a public URL for `og:image` to resolve.
 * The token is injected automatically once a Blob store is connected.
 */
const prefixFor = (id: string) => `shares/${id}/`;

export const blobStore: ShareStore = {
  kind: "blob",

  async putImage(id: string, variant: OutputVariant, png: Buffer): Promise<string> {
    const blob = await put(`${prefixFor(id)}${variant}.png`, png, {
      access: "public",
      contentType: "image/png",
      addRandomSuffix: false,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
    return blob.url;
  },

  async putRecord(record: ShareRecord): Promise<void> {
    await put(`${prefixFor(record.id)}meta.json`, JSON.stringify(record), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      // Short TTL: written once, read by crawlers moments later.
      cacheControlMaxAge: 60,
    });
  },

  async getRecord(id: string): Promise<ShareRecord | null> {
    if (!isValidShareId(id)) return null;

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
  },
};
