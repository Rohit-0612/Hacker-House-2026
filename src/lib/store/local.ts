import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { OUTPUT_SIZES, type OutputVariant } from "../types";
import { isValidShareId, type ShareRecord, type ShareStore } from "./types";

/**
 * Filesystem-backed store for local development ONLY.
 *
 * It exists so the share page, `og:image` and `twitter:card` can be exercised
 * end to end without a Vercel Blob token — otherwise the brief's headline
 * requirement ("the link preview shows the actual graphic") is unverifiable
 * until after a deploy.
 *
 * This must never run on Vercel: serverless filesystems are per-instance and
 * ephemeral, so a share link would resolve on the instance that wrote it and
 * 404 on every other one. Intermittently broken links are worse than no links,
 * which is why selection in ./index.ts is gated on `!process.env.VERCEL`.
 */
const ROOT = path.join(process.cwd(), ".next", "cache", "shares");

/** Rejects anything that isn't a known variant, so `variant` never reaches a path unchecked. */
export function isValidVariant(value: string): value is OutputVariant {
  return Object.hasOwn(OUTPUT_SIZES, value);
}

function dirFor(id: string): string {
  return path.join(ROOT, id);
}

export const localStore: ShareStore = {
  kind: "local",

  async putImage(id: string, variant: OutputVariant, png: Buffer): Promise<string> {
    await fs.mkdir(dirFor(id), { recursive: true });
    await fs.writeFile(path.join(dirFor(id), `${variant}.png`), png);
    // Relative; the API route and share page make it absolute where required.
    return `/api/share-asset/${id}/${variant}`;
  },

  async putRecord(record: ShareRecord): Promise<void> {
    await fs.mkdir(dirFor(record.id), { recursive: true });
    await fs.writeFile(path.join(dirFor(record.id), "meta.json"), JSON.stringify(record));
  },

  async getRecord(id: string): Promise<ShareRecord | null> {
    if (!isValidShareId(id)) return null;
    try {
      const raw = await fs.readFile(path.join(dirFor(id), "meta.json"), "utf8");
      const record = JSON.parse(raw) as ShareRecord;
      if (!record || typeof record.id !== "string" || !Array.isArray(record.images)) return null;
      return record;
    } catch {
      return null;
    }
  },
};

/** Reads a stored PNG. Both segments are validated before touching the disk. */
export async function readLocalImage(id: string, variant: string): Promise<Buffer | null> {
  if (!isValidShareId(id) || !isValidVariant(variant)) return null;
  try {
    return await fs.readFile(path.join(dirFor(id), `${variant}.png`));
  } catch {
    return null;
  }
}
