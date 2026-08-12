import "server-only";

import opentype from "opentype.js";
import { loadFonts } from "./fonts";

/**
 * Lays text along a circular arc and emits it as SVG <path> outlines.
 *
 * Why outlines instead of <textPath> + font-family:
 *
 * resvg resolves fonts by the family name in the font's own `name` table, not
 * by the filename or the name we register it under. The vendored
 * SpaceGrotesk-Bold.ttf is a static instance cut from the variable font and
 * carries the stale family name "Space Grotesk Light" (subfamily Bold,
 * usWeightClass 700 — the outlines are correct, only the name is wrong). So
 * `font-family="Space Grotesk"` matched nothing. macOS fell back to something
 * legible and hid the bug; the linux runtime, with loadSystemFonts disabled,
 * had nothing to fall back to and silently rendered no glyphs at all.
 *
 * Converting to outlines here removes font matching from rasterisation
 * completely — the same guarantee satori already gives the ID card, which is
 * why that half of the app never broke.
 */

let cached: opentype.Font | null = null;

function displayFont(): opentype.Font {
  if (cached) return cached;

  const font = loadFonts().find((f) => f.name === "Space Grotesk" && f.weight === 700);
  if (!font) throw new Error("Display font (Space Grotesk 700) is not loaded");

  // opentype wants a standalone ArrayBuffer, not a Node Buffer view into a
  // larger pool — slicing guarantees the correct byte range.
  const { buffer, byteOffset, byteLength } = font.data;
  cached = opentype.parse(buffer.slice(byteOffset, byteOffset + byteLength) as ArrayBuffer);
  return cached;
}

export interface CurvedTextOptions {
  cx: number;
  cy: number;
  /** Baseline radius. Glyphs grow outward on a top arc and inward on a bottom arc. */
  radius: number;
  fontSize: number;
  letterSpacing?: number;
  half: "top" | "bottom";
  fill: string;
  fillOpacity?: number;
}

/**
 * Both halves read left-to-right and stay upright: a top arc sweeps with
 * increasing angle, a bottom arc with decreasing angle. Each glyph is rotated
 * to the tangent and centred on its own slice of the arc.
 */
export function curvedTextToPaths(text: string, options: CurvedTextOptions): string {
  const { cx, cy, radius, fontSize, letterSpacing = 0, half, fill, fillOpacity = 1 } = options;
  const font = displayFont();
  const chars = Array.from(text);
  if (chars.length === 0) return "";

  const widths = chars.map((ch) => font.getAdvanceWidth(ch, fontSize));
  const total =
    widths.reduce((sum, w) => sum + w, 0) + letterSpacing * Math.max(0, chars.length - 1);

  // Arc length s subtends s/radius radians.
  const halfSpan = total / 2 / radius;
  const centreAngle = half === "top" ? Math.PI * 1.5 : Math.PI * 0.5;
  const direction = half === "top" ? 1 : -1;
  const startAngle = centreAngle - direction * halfSpan;

  const parts: string[] = [];
  let travelled = 0;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i] as string;
    const width = widths[i] as number;
    const angle = startAngle + direction * ((travelled + width / 2) / radius);

    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    const rotation = (angle * 180) / Math.PI + direction * 90;

    const d = font.getPath(ch, 0, 0, fontSize).toPathData(2);
    if (d) {
      // Rotate to the tangent, then shift back by half the glyph so it is
      // centred on its slice rather than starting there.
      parts.push(
        `<path d="${d}" fill="${fill}"${fillOpacity !== 1 ? ` fill-opacity="${fillOpacity}"` : ""} ` +
          `transform="translate(${x.toFixed(3)} ${y.toFixed(3)}) rotate(${rotation.toFixed(3)}) translate(${(-width / 2).toFixed(3)} 0)"/>`,
      );
    }

    travelled += width + letterSpacing;
  }

  return parts.join("\n  ");
}
