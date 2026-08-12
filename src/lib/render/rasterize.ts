import "server-only";

import { Resvg, type ResvgRenderOptions } from "@resvg/resvg-js";
import { fontBuffers } from "./fonts";

interface RasterizeOptions {
  /** Target pixel width. The SVG is scaled to match, so authoring units stay readable. */
  width: number;
}

/**
 * resvg-js 2.6.2 implements `font.fontBuffers` in its native binding but leaves
 * it out of the published types, so the options object is assembled here and
 * cast at the boundary.
 *
 * Verified rather than assumed: with `loadSystemFonts: false`, rendering text
 * produces glyphs when fontBuffers is supplied and a completely blank image when
 * it is not. Buffers are used instead of `fontFiles` paths because resolving
 * paths inside a serverless bundle is the fragile approach this pipeline is
 * deliberately built to avoid.
 */
type FontOptions = NonNullable<ResvgRenderOptions["font"]> & { fontBuffers?: Buffer[] };

/**
 * SVG -> PNG.
 *
 * System font loading is disabled deliberately: it makes local output identical
 * to production, instead of silently succeeding on a dev machine that happens to
 * have Inter installed and then falling back to a default face on Vercel.
 */
export function rasterize(svg: string, { width }: RasterizeOptions): Buffer {
  const font: FontOptions = {
    fontBuffers: fontBuffers(),
    defaultFontFamily: "Inter",
    loadSystemFonts: false,
  };

  const resvg = new Resvg(svg, {
    font,
    fitTo: { mode: "width", value: width },
    shapeRendering: 2, // geometricPrecision
    textRendering: 1, // optimizeLegibility
    imageRendering: 0, // optimizeQuality
  });

  return Buffer.from(resvg.render().asPng());
}
