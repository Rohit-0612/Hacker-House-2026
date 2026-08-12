import type { Format, GenerateFields, OutputVariant } from "../types";

export interface ShareRecord {
  id: string;
  format: Format;
  fields: GenerateFields | null;
  images: { variant: OutputVariant; url: string; width: number; height: number }[];
  createdAt: string;
}

/**
 * A place to persist generated PNGs so a share page can point `og:image` at
 * them. Two implementations exist (Vercel Blob, and a dev-only local store);
 * both satisfy this shape so the API route and share page don't care which.
 */
export interface ShareStore {
  readonly kind: "blob" | "local";
  putImage(id: string, variant: OutputVariant, png: Buffer): Promise<string>;
  putRecord(record: ShareRecord): Promise<void>;
  getRecord(id: string): Promise<ShareRecord | null>;
}

/** Share ids appear in URLs and file paths — validate before either use. */
export const SHARE_ID_PATTERN = /^[a-z0-9]{6,24}$/;

export function isValidShareId(id: string): boolean {
  return SHARE_ID_PATTERN.test(id);
}

export function newShareId(): string {
  // 12 chars of base36 from crypto — short enough for a tweet, unguessable
  // enough that share pages are not enumerable.
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 12);
}
