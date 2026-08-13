import { z } from "zod";

export const MAX_FILE_BYTES = 12 * 1024 * 1024; // 12MB
/** Below this the photo is too soft for a 300px-wide panel on a 3200px export. */
export const MIN_DIMENSION = 200;
/**
 * Ceiling on the published share image, so /api/pass can't be used as free
 * object storage. The board encodes to roughly 250KB of JPEG, so 3MB is a very
 * loose guard rather than a limit anyone should meet.
 */
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

/**
 * HEIC is converted to JPEG in the browser before anything else touches it
 * (src/lib/heic.ts) — no browser but Safari can paint it in an <img>, and the
 * crop UI needs a paintable image.
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

/** Fail fast with a useful message before paying for a decode. */
export function validateFile(file: File): string | null {
  if (file.size === 0) return "That file looks empty. Try another photo.";
  if (file.size > MAX_FILE_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `That photo is ${mb}MB — the limit is 12MB. Try a smaller one.`;
  }
  const typeOk = (ACCEPTED_MIME as readonly string[]).includes(file.type);
  if (!typeOk && !hasAcceptedExtension(file.name)) {
    return "Unsupported format. Use a JPG, PNG, WEBP or HEIC photo.";
  }
  return null;
}

const trimmed = (max: number) => z.string().trim().max(max);

export const fieldsSchema = z.object({
  name: trimmed(24).min(1, "Add your name"),
  team: trimmed(24).min(1, "Add a team name"),
  role: trimmed(26).min(1, "Add your role or stack"),
  city: trimmed(20).min(1, "Where are you travelling from?"),
});

export type Fields = z.infer<typeof fieldsSchema>;

export const formatSchema = z.enum(["pass", "pfp"]);

/**
 * Strips control characters and collapses whitespace.
 *
 * The canvas draws whatever it is handed, and the same strings are echoed on the
 * share page — so bidi overrides and zero-width joiners are removed here rather
 * than being allowed to scramble either surface.
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
