import { BRAND, COLORS } from "@/lib/brand";
import type { Format } from "@/lib/types";
import { font } from "./fonts";
import { asterisk, halftone, palm, sunburst, tracked, type Ctx } from "./primitives";

/**
 * The 1200×630 board the finished artwork is mounted on for `og:image`.
 *
 * X's `summary_large_image` crops to 1.91:1. The pass is 16:9 and the PFP is
 * square, so posting either directly means X trims the ends off the ticket or
 * pillarboxes the avatar. Centring the artwork on a board sized to X's own ratio
 * means the unfurl shows the whole thing, framed deliberately.
 */
export const OG_LOGICAL = { width: 1200, height: 630 } as const;

export function drawOgBoard(ctx: Ctx, artwork: HTMLCanvasElement, format: Format): void {
  ctx.fillStyle = COLORS.jungleDeep;
  ctx.fillRect(0, 0, OG_LOGICAL.width, OG_LOGICAL.height);

  ctx.save();
  ctx.globalAlpha = 0.55;
  palm(ctx, 46, 210, 0.8, COLORS.jungle);
  palm(ctx, 1168, 250, 0.9, COLORS.jungle, { lean: -0.2 });
  palm(ctx, 90, 700, 0.95, COLORS.jungle, { lean: -0.1 });
  ctx.restore();

  sunburst(ctx, 600, 120, 46, COLORS.jungle, { rays: 11, rayLen: 0.4 });
  halftone(ctx, 0, 0, OG_LOGICAL.width, OG_LOGICAL.height, COLORS.ink, {
    step: 11,
    r: 1.2,
    alpha: 0.16,
  });

  if (format === "pass") mountPass(ctx, artwork);
  else mountPfp(ctx, artwork);
}

/** The pass fills the board; it already carries all the wording it needs. */
function mountPass(ctx: Ctx, artwork: HTMLCanvasElement): void {
  const pad = 22;
  const h = OG_LOGICAL.height - pad * 2;
  const w = (artwork.width / artwork.height) * h;

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(artwork, (OG_LOGICAL.width - w) / 2, pad, w, h);
}

/** A lone circle in a 1.91:1 frame reads as an accident, so it gets a lockup. */
function mountPfp(ctx: Ctx, artwork: HTMLCanvasElement): void {
  const size = 500;
  const x = 74;
  const y = (OG_LOGICAL.height - size) / 2;

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(artwork, x, y, size, size);

  const tx = x + size + 62;

  ctx.fillStyle = COLORS.lemon;
  ctx.font = font("display", 78, 700);
  ctx.fillText("HACKER", tx, 268);
  ctx.fillText("HOUSE", tx, 348);

  ctx.fillStyle = COLORS.magenta;
  ctx.font = font("condensed", 40);
  tracked(ctx, "GOA 2026", tx, 402, { tracking: 5 });

  ctx.fillStyle = COLORS.paper;
  ctx.font = font("mono", 20, 700);
  tracked(ctx, BRAND.datesTight, tx, 448, { tracking: 3 });

  asterisk(ctx, tx + 10, 490, 14, COLORS.magenta);
  ctx.fillStyle = COLORS.muted;
  ctx.font = font("mono", 16);
  tracked(ctx, BRAND.motto, tx + 38, 496, { tracking: 2.2 });
}
