import type { Format, PassFields, PassIdentity } from "@/lib/types";
import { OUTPUT_SIZES } from "@/lib/types";
import { drawOgBoard, OG_LOGICAL } from "./draw-og";
import { drawPass, PASS_LOGICAL } from "./draw-pass";
import { drawPfp, pfpLogical } from "./draw-pfp";
import { ensureCanvasFonts, loadPfpFrame } from "./fonts";
import { deriveIdentity } from "./identity";
import { toBlob, type CropRect, type NormalisedPhoto } from "./photo";
import type { Ctx } from "./primitives";

export { normalisePhoto, revokePhoto, PhotoError, FULL_CROP } from "./photo";
export type { NormalisedPhoto, CropRect } from "./photo";

/** Crop aspect the UI locks to, per format. */
export const CROP_ASPECT: Record<Format, number> = { pass: 4 / 5, pfp: 1 };

/**
 * The share image is JPEG, not PNG.
 *
 * It only ever exists to be `og:image`, where a lossless encode buys nothing —
 * and at roughly a fifth of the bytes it keeps both Vercel Blob storage and
 * egress comfortably inside the free tier.
 */
const SHARE_TYPE = "image/jpeg";
const SHARE_QUALITY = 0.85;

export interface ArtworkInput {
  format: Format;
  fields: PassFields;
  photo: NormalisedPhoto;
  crop: CropRect;
  /** Minted before painting so the QR can encode this pass's own share URL. */
  id: string;
  /** Origin the share URL is built against — `window.location.origin`. */
  origin: string;
}

export interface RenderedImage {
  blob: Blob;
  width: number;
  height: number;
}

export interface Artwork {
  id: string;
  format: Format;
  identity: PassIdentity;
  shareUrl: string;
  /** The download artefact (PNG), plus an object URL for the on-screen preview. */
  main: RenderedImage & { url: string };
  /** The 1.91:1 board `og:image` points at (JPEG). */
  share: RenderedImage;
  elapsedMs: number;
}

/**
 * Paints both outputs.
 *
 * One paint per artefact, at full export resolution — the preview is the same
 * pixels shown through an object URL, so what the user sees cannot drift from
 * what they download.
 */
export async function renderArtwork(input: ArtworkInput): Promise<Artwork> {
  const started = performance.now();

  // The frame is only needed for the PFP, but both awaits are cheap once warm.
  const [, frame] = await Promise.all([
    ensureCanvasFonts(),
    input.format === "pfp" ? loadPfpFrame() : Promise.resolve(null),
  ]);

  const identity = deriveIdentity(input.fields, input.id);
  const shareUrl = `${input.origin.replace(/\/$/, "")}/pass/${input.id}`;

  const artwork =
    input.format === "pass"
      ? paint(PASS_LOGICAL.width, PASS_LOGICAL.height, OUTPUT_SIZES.pass.width / PASS_LOGICAL.width, (ctx) =>
          drawPass(ctx, {
            fields: input.fields,
            identity,
            photo: input.photo,
            crop: input.crop,
            shareUrl,
          }),
        )
      : (() => {
          const logical = pfpLogical(frame!);
          // Drawn 1:1 with the supplied artwork so its line work stays crisp.
          return paint(logical.width, logical.height, 1, (ctx) =>
            drawPfp(ctx, { photo: input.photo, crop: input.crop, frame: frame! }),
          );
        })();

  const board = paint(
    OG_LOGICAL.width,
    OG_LOGICAL.height,
    OUTPUT_SIZES.og.width / OG_LOGICAL.width,
    (ctx) => drawOgBoard(ctx, artwork, input.format),
  );

  const [mainBlob, shareBlob] = await Promise.all([
    toBlob(artwork),
    toBlob(board, SHARE_TYPE, SHARE_QUALITY),
  ]);

  return {
    id: input.id,
    format: input.format,
    identity,
    shareUrl,
    main: {
      blob: mainBlob,
      url: URL.createObjectURL(mainBlob),
      width: artwork.width,
      height: artwork.height,
    },
    share: { blob: shareBlob, width: board.width, height: board.height },
    elapsedMs: Math.round(performance.now() - started),
  };
}

/**
 * A canvas whose context is pre-scaled, so painters work in logical units and
 * never see the export resolution.
 */
function paint(
  logicalWidth: number,
  logicalHeight: number,
  scale: number,
  draw: (ctx: Ctx) => void,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(logicalWidth * scale);
  canvas.height = Math.round(logicalHeight * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser wouldn't give us a canvas to draw on.");

  ctx.scale(scale, scale);
  ctx.textBaseline = "alphabetic";
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  draw(ctx);

  return canvas;
}

/**
 * Share id, minted in the browser.
 *
 * It has to exist before painting so the QR can point at the pass's own share
 * page. 12 base36 characters from `crypto` — short enough for a URL, and far too
 * sparse to enumerate.
 */
export function newPassId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 12);
}
