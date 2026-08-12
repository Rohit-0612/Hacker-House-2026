import { z } from "zod";

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
export const MIN_DIMENSION = 200;
export const MAX_DIMENSION = 8000;

/**
 * HEIC must be converted to JPEG client-side before upload — sharp's prebuilt
 * binary ships no HEVC decoder, so the server genuinely cannot read it (see
 * src/lib/heic.ts and the decode fallback in src/lib/render/photo.ts).
 *
 * The extension is accepted alongside the MIME type because Safari reports
 * inconsistent types for iPhone photos, sometimes an empty string.
 */
export const ACCEPTED_MIME = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"];

/** The `accept` attribute for the file input. */
export const ACCEPT_ATTR = [...ACCEPTED_MIME, ...ACCEPTED_EXTENSIONS].join(",");

export function isHeic(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

export function hasAcceptedExtension(name: string): boolean {
  const lower = name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Client-side pre-flight. The server re-validates everything from actual image
 * bytes — this exists purely to fail fast and give a useful message.
 */
export function validateFile(file: File): string | null {
  if (file.size === 0) return "That file looks empty. Try another photo.";
  if (file.size > MAX_FILE_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `That photo is ${mb}MB — the limit is 10MB. Try a smaller one.`;
  }
  const typeOk = (ACCEPTED_MIME as readonly string[]).includes(file.type);
  if (!typeOk && !hasAcceptedExtension(file.name)) {
    return "Unsupported format. Use a JPG, PNG, WEBP or HEIC photo.";
  }
  return null;
}

const trimmed = (max: number) => z.string().trim().max(max);

export const fieldsSchema = z.object({
  name: trimmed(28).min(1, "Add your name"),
  stack: trimmed(32).min(1, "Add your stack or role"),
  title: trimmed(32).min(1, "Pick a builder title"),
});

export type Fields = z.infer<typeof fieldsSchema>;

export const formatSchema = z.enum(["pfp", "card"]);

/**
 * Strips control characters and collapses whitespace. Satori renders whatever it
 * is handed, so unchecked input can break the layout (or smuggle in RTL overrides).
 */
export function sanitizeText(value: string, max: number): string {
  return Array.from(value.normalize("NFC"))
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      if (code < 0x20 || code === 0x7f) return false; // control chars
      if (code >= 0x200b && code <= 0x200f) return false; // zero-width / bidi marks
      if (code >= 0x202a && code <= 0x202e) return false; // bidi overrides
      return true;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
