import "server-only";

import sharp, { type Metadata, type Sharp } from "sharp";
import { MAX_DIMENSION, MIN_DIMENSION } from "../validate";

// A few concurrent generations on a small lambda can otherwise fight for RAM.
sharp.concurrency(1);
sharp.cache({ memory: 64 });

export type PhotoErrorCode = "decode_failed" | "too_small" | "too_big_dimensions";

export class PhotoError extends Error {
  code: PhotoErrorCode;

  constructor(message: string, code: PhotoErrorCode) {
    super(message);
    this.name = "PhotoError";
    this.code = code;
  }
}

export interface ProcessedPhoto {
  /** Ready to drop straight into an SVG <image href> or a satori <img src>. */
  dataUri: string;
  size: number;
}

/**
 * Crops an arbitrary user photo to a centred square.
 *
 * The brief is explicit that portrait, landscape and off-centre photos all have
 * to work without the user cropping first, so:
 *
 *  - `.rotate()` with no argument applies the EXIF orientation. iPhone photos are
 *    almost always stored sideways with an orientation flag; skipping this is the
 *    classic "why is everyone upside down" bug.
 *  - `fit: "cover"` scales-and-crops rather than squashing, so nothing distorts.
 *  - `strategy.attention` picks the crop window by saliency (skin tones, edges,
 *    saturation) instead of blindly taking the middle. On a landscape shot with
 *    the subject off to one side, a centre crop would cut their head in half.
 *    This gets the subject without shipping a face-detection model.
 *
 * The result is deliberately re-encoded as a modest JPEG: it is about to be
 * base64'd into an SVG, and inlining a 12MP original would blow up both memory
 * and render time for zero visible gain at the size it is displayed.
 */
export async function processPhoto(input: Buffer, targetSize: number): Promise<ProcessedPhoto> {
  let pipeline: Sharp;
  let meta: Metadata;

  try {
    pipeline = sharp(input, { failOn: "none", animated: false });
    meta = await pipeline.metadata();
  } catch (cause) {
    throw new PhotoError("We couldn't read that image. Try a JPG or PNG.", "decode_failed");
  }

  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  if (!width || !height) {
    throw new PhotoError("We couldn't read that image. Try a JPG or PNG.", "decode_failed");
  }
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    throw new PhotoError(
      `That photo is ${width}×${height}. We need at least ${MIN_DIMENSION}×${MIN_DIMENSION} for a sharp result.`,
      "too_small",
    );
  }
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    throw new PhotoError(
      `That photo is ${width}×${height}, which is larger than we can process. Try a smaller export.`,
      "too_big_dimensions",
    );
  }

  let jpeg: Buffer;
  try {
    jpeg = await pipeline
      .rotate()
      .resize(targetSize, targetSize, {
        fit: "cover",
        position: sharp.strategy.attention,
        withoutEnlargement: false,
      })
      .flatten({ background: "#0D1330" }) // PNGs with alpha would go black behind the circle
      .jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: "4:4:4" })
      .toBuffer();
  } catch (cause) {
    // Decoding can fail well after metadata parsed cleanly. The main case is
    // HEIC: sharp's prebuilt libheif reads the container header but has no HEVC
    // decoder, so metadata() succeeds and the pixel decode then dies with
    // "bad seek". HEIC is normally converted to JPEG in the browser before it
    // ever reaches here, so this is the fallback for when that was bypassed.
    if (meta.format === "heif") {
      throw new PhotoError(
        "We couldn't read that HEIC photo. Try uploading it again, or export it as JPG first.",
        "decode_failed",
      );
    }
    throw new PhotoError("We couldn't process that image. Try a JPG or PNG.", "decode_failed");
  }

  return {
    dataUri: `data:image/jpeg;base64,${jpeg.toString("base64")}`,
    size: jpeg.byteLength,
  };
}

/** Cheap sniff so we can reject non-images before handing bytes to sharp. */
export async function probe(input: Buffer): Promise<{ width: number; height: number; format?: string }> {
  const meta = await sharp(input, { failOn: "none" }).metadata();
  return { width: meta.width ?? 0, height: meta.height ?? 0, format: meta.format };
}
