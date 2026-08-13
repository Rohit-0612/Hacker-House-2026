import { toDisplayableImage } from "@/lib/heic";
import { MIN_DIMENSION } from "@/lib/validate";
import type { Ctx } from "./primitives";

/** Longest edge kept after normalisation. Well above anything the pass needs,
 *  while keeping a 12MP phone photo from sitting decoded in memory. */
const MAX_EDGE = 2000;

export class PhotoError extends Error {}

export interface NormalisedPhoto {
  /** EXIF-corrected, capped pixels. Also the draw source for the painters. */
  canvas: HTMLCanvasElement;
  /** Object URL of those same pixels, for the crop UI's <img>. */
  url: string;
  width: number;
  height: number;
}

/** Crop rectangle as percentages of the photo — resolution independent, so it
 *  survives the difference between the on-screen <img> and the export canvas. */
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Decodes a user photo into something safe to draw from.
 *
 * The `<img>` route is deliberate: browsers apply EXIF orientation to `<img>`
 * automatically (`image-orientation: from-image` is the CSS initial value), so
 * iPhone photos come out upright without a metadata parser. `createImageBitmap`
 * can do the same, but its `imageOrientation` option is silently ignored where
 * unsupported — which fails as sideways photos rather than as an error.
 */
export async function normalisePhoto(file: File): Promise<NormalisedPhoto> {
  const usable = await toDisplayableImage(file);

  const sourceUrl = URL.createObjectURL(usable);
  let img: HTMLImageElement;
  try {
    img = await decode(sourceUrl);
  } catch {
    URL.revokeObjectURL(sourceUrl);
    throw new PhotoError("We couldn't read that photo. Try exporting it as a JPG.");
  }

  const { naturalWidth: w, naturalHeight: h } = img;
  URL.revokeObjectURL(sourceUrl);

  if (Math.min(w, h) < MIN_DIMENSION) {
    throw new PhotoError(
      `That photo is ${w}×${h}. It needs to be at least ${MIN_DIMENSION}px on the short edge.`,
    );
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
  const canvas = downscale(img, Math.round(w * scale), Math.round(h * scale));

  const blob = await toBlob(canvas);
  return { canvas, url: URL.createObjectURL(blob), width: canvas.width, height: canvas.height };
}

export function revokePhoto(photo: NormalisedPhoto | null): void {
  if (photo) URL.revokeObjectURL(photo.url);
}

function decode(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("decode failed"));
    img.src = url;
  });
}

function canvasOf(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function context(canvas: HTMLCanvasElement): Ctx {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new PhotoError("This browser wouldn't give us a canvas to draw on.");
  return ctx;
}

/**
 * Halving passes down to the target size.
 *
 * A single drawImage from 4000px to 500px samples far too sparsely and comes out
 * crunchy; stepping down by halves keeps the detail that makes a small photo on
 * a ticket look sharp rather than aliased.
 */
function downscale(
  source: CanvasImageSource & { width?: number },
  targetW: number,
  targetH: number,
): HTMLCanvasElement {
  let currentW =
    source instanceof HTMLImageElement ? source.naturalWidth : (source as HTMLCanvasElement).width;
  let currentH =
    source instanceof HTMLImageElement ? source.naturalHeight : (source as HTMLCanvasElement).height;

  let current: CanvasImageSource = source;

  while (currentW > targetW * 2 && currentH > targetH * 2) {
    const nextW = Math.max(targetW, Math.round(currentW / 2));
    const nextH = Math.max(targetH, Math.round(currentH / 2));
    const step = canvasOf(nextW, nextH);
    const ctx = context(step);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(current, 0, 0, nextW, nextH);
    current = step;
    currentW = nextW;
    currentH = nextH;
  }

  const out = canvasOf(targetW, targetH);
  const ctx = context(out);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(current, 0, 0, targetW, targetH);
  return out;
}

export function toBlob(canvas: HTMLCanvasElement, type = "image/png", quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new PhotoError("Couldn't encode the image."))),
      type,
      quality,
    );
  });
}

/** The whole photo, as a crop — the default before the user touches anything. */
export const FULL_CROP: CropRect = { x: 0, y: 0, width: 100, height: 100 };

/**
 * Draws the cropped region into a destination rect, cover-style.
 *
 * The crop is already the right aspect (the crop UI locks it), but a user can
 * drag a selection a pixel off; covering rather than stretching means a slightly
 * wrong crop loses a sliver of edge instead of distorting a face.
 */
export function drawCropped(
  ctx: Ctx,
  photo: NormalisedPhoto,
  crop: CropRect,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): void {
  const sx = (crop.x / 100) * photo.width;
  const sy = (crop.y / 100) * photo.height;
  const sw = (crop.width / 100) * photo.width;
  const sh = (crop.height / 100) * photo.height;

  const scale = Math.max(dw / sw, dh / sh);
  const drawW = sw * scale;
  const drawH = sh * scale;

  ctx.save();
  ctx.beginPath();
  ctx.rect(dx, dy, dw, dh);
  ctx.clip();
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    photo.canvas,
    sx,
    sy,
    sw,
    sh,
    dx + (dw - drawW) / 2,
    dy + (dh - drawH) / 2,
    drawW,
    drawH,
  );
  ctx.restore();
}
