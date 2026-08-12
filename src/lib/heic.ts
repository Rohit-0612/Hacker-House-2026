import { isHeic } from "./validate";

/**
 * Converts iPhone HEIC photos to JPEG in the browser.
 *
 * Done client-side on purpose: the decoder is a ~1.5MB WASM blob, so it is
 * dynamically imported only when a HEIC file actually shows up — most users
 * never download it. Converting here also means the preview can render
 * immediately, since no browser except Safari can paint HEIC in an <img>.
 */
export async function toDisplayableImage(file: File): Promise<File> {
  if (!isHeic(file)) return file;

  const { heicTo } = await import("heic-to");
  const blob = await heicTo({ blob: file, type: "image/jpeg", quality: 0.92 });

  const name = file.name.replace(/\.(heic|heif)$/i, ".jpg");
  return new File([blob], name, { type: "image/jpeg", lastModified: file.lastModified });
}
