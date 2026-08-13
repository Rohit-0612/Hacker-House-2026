import { COLORS } from "@/lib/brand";
import { drawCropped, type CropRect, type NormalisedPhoto } from "./photo";
import type { Ctx } from "./primitives";

/**
 * The PFP frame.
 *
 * The ring is supplied artwork (public/pfp-frame.webp), not something drawn
 * here — this module only registers the photo into its opening and composites.
 *
 * Square rather than round: X crops to a circle itself, and shipping a
 * transparent-cornered PNG means anyone who posts it as an image instead of
 * setting it as an avatar gets a ragged edge.
 */

/**
 * Where the frame's transparent opening sits, as fractions of the artwork's
 * own square. Measured from the asset's alpha channel rather than eyeballed —
 * the opening is very slightly below centre, which is not something you would
 * guess and is instantly visible if you get it wrong.
 */
const HOLE = { cx: 0.5024, cy: 0.5244, r: 0.2874 } as const;

/**
 * The photo is drawn a little larger than the measured opening so it passes
 * *under* the ring's inner edge. Without the bleed, antialiasing on both the
 * photo's clip and the frame's inner edge leaves a hairline of background.
 */
const BLEED = 1.04;

export interface PfpInput {
  photo: NormalisedPhoto;
  crop: CropRect;
  frame: HTMLImageElement;
}

/** The frame's natural size defines the logical space, so a higher-resolution
 *  asset yields a bigger export with no code change. */
export function pfpLogical(frame: HTMLImageElement): { width: number; height: number } {
  return { width: frame.naturalWidth, height: frame.naturalHeight };
}

export function drawPfp(ctx: Ctx, input: PfpInput): void {
  const { frame } = input;
  const w = frame.naturalWidth;
  const h = frame.naturalHeight;

  // Ground shows through the frame's transparent margins.
  ctx.fillStyle = COLORS.jungle;
  ctx.fillRect(0, 0, w, h);

  const cx = HOLE.cx * w;
  const cy = HOLE.cy * h;
  const r = HOLE.r * w * BLEED;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  drawCropped(ctx, input.photo, input.crop, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();

  ctx.drawImage(frame, 0, 0, w, h);
}
