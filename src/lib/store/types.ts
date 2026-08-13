import type { Format, OutputVariant, PassFields, PassIdentity, ShareImage } from "../types";

export interface ShareRecord {
  id: string;
  format: Format;
  fields: PassFields;
  identity: PassIdentity;
  images: ShareImage[];
  createdAt: string;
}

/** Extensions the store knows how to write and serve. */
export const IMAGE_EXTENSIONS = { "image/png": "png", "image/jpeg": "jpg" } as const;
export type ImageContentType = keyof typeof IMAGE_EXTENSIONS;

export function extensionFor(contentType: string): string | null {
  return IMAGE_EXTENSIONS[contentType as ImageContentType] ?? null;
}

/**
 * A place to persist the generated share image so a share page can point
 * `og:image` at it. Two implementations exist (Vercel Blob, and a dev-only
 * local store); both satisfy this shape so the API route and share page don't
 * care which is in play.
 */
export interface ShareStore {
  readonly kind: "blob" | "local";
  putImage(
    id: string,
    variant: OutputVariant,
    bytes: Buffer,
    contentType: ImageContentType,
  ): Promise<string>;
  putRecord(record: ShareRecord): Promise<void>;
  getRecord(id: string): Promise<ShareRecord | null>;
}

/** Share ids appear in URLs and file paths — validate before either use. */
export const SHARE_ID_PATTERN = /^[a-z0-9]{6,24}$/;

export function isValidShareId(id: string): boolean {
  return SHARE_ID_PATTERN.test(id);
}
