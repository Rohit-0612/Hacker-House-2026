import "server-only";

import { BRAND, COLORS } from "../brand";
import { curvedTextToPaths } from "./curved-text";

/**
 * The PFP frame is hand-authored SVG rather than a satori layout, because the
 * defining detail — "HH GOA 2026" curved along the ring — needs <textPath>,
 * which is a flexbox layout engine's blind spot. Writing the SVG directly also
 * gives exact control over ring geometry, which matters when the artwork has to
 * survive being scaled down to a 48px avatar.
 */

const S = 1000; // authoring canvas, 1:1 with output pixels
const C = S / 2;

const GEO = {
  ringOuter: 496,
  ringInner: 430,
  /** Photo sits just inside the ring so no background seam shows at the join. */
  photoRadius: 433,
  /** Text baselines ride on these radii; offset from the band centre so glyphs
   *  end up optically centred on the band rather than sitting on its edge. */
  textRadiusTop: 449,
  textRadiusBottom: 477,
  fontSize: 38,
} as const;

const bandCenter = (GEO.ringOuter + GEO.ringInner) / 2;
const bandWidth = GEO.ringOuter - GEO.ringInner;

export function renderPfpSvg(photoDataUri: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${COLORS.violet}"/>
      <stop offset="38%" stop-color="${COLORS.coral}"/>
      <stop offset="100%" stop-color="${COLORS.amber}"/>
    </linearGradient>

    <linearGradient id="cornerGlow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${COLORS.violet}" stop-opacity="0.30"/>
      <stop offset="50%" stop-color="${COLORS.night}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${COLORS.coral}" stop-opacity="0.26"/>
    </linearGradient>

    <radialGradient id="bloom" cx="50%" cy="50%" r="50%">
      <stop offset="60%" stop-color="${COLORS.violet}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${COLORS.violet}" stop-opacity="0.45"/>
    </radialGradient>

    <!-- Darkens the photo only where it meets the ring, so the subject stays
         bright while the join reads as depth rather than a pasted-on circle. -->
    <radialGradient id="vignette" cx="50%" cy="50%" r="50%">
      <stop offset="72%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.42"/>
    </radialGradient>

    <clipPath id="photoClip">
      <circle cx="${C}" cy="${C}" r="${GEO.photoRadius}"/>
    </clipPath>

  </defs>

  <!-- The corners survive X's circular crop only when the avatar is shown square
       elsewhere, so they are filled rather than left transparent. -->
  <rect width="${S}" height="${S}" fill="${COLORS.night}"/>
  <rect width="${S}" height="${S}" fill="url(#cornerGlow)"/>
  <circle cx="${C}" cy="${C}" r="${GEO.ringOuter}" fill="${COLORS.nightRaised}"/>
  <circle cx="${C}" cy="${C}" r="${GEO.ringOuter}" fill="url(#bloom)"/>

  <image
    x="${C - GEO.photoRadius}" y="${C - GEO.photoRadius}"
    width="${GEO.photoRadius * 2}" height="${GEO.photoRadius * 2}"
    preserveAspectRatio="xMidYMid slice"
    clip-path="url(#photoClip)"
    xlink:href="${photoDataUri}"/>
  <circle cx="${C}" cy="${C}" r="${GEO.photoRadius}" fill="url(#vignette)"/>

  <circle cx="${C}" cy="${C}" r="${bandCenter}" fill="none"
          stroke="url(#ring)" stroke-width="${bandWidth}"/>

  <!-- Cyan surf hairline: a single cool line keeps the warm ring from reading flat. -->
  <circle cx="${C}" cy="${C}" r="${GEO.ringInner + 3}" fill="none"
          stroke="${COLORS.cyan}" stroke-width="2.5" stroke-opacity="0.65"/>
  <circle cx="${C}" cy="${C}" r="${GEO.ringOuter - 2}" fill="none"
          stroke="${COLORS.text}" stroke-width="1.5" stroke-opacity="0.22"/>

  ${curvedTextToPaths(BRAND.event, {
    cx: C,
    cy: C,
    radius: GEO.textRadiusTop,
    fontSize: GEO.fontSize,
    letterSpacing: 7,
    half: "top",
    fill: COLORS.text,
  })}

  ${curvedTextToPaths("BUILDER", {
    cx: C,
    cy: C,
    radius: GEO.textRadiusBottom,
    fontSize: GEO.fontSize,
    letterSpacing: 11,
    half: "bottom",
    fill: COLORS.night,
    fillOpacity: 0.92,
  })}

  ${sideMarker(C - bandCenter, C)}
  ${sideMarker(C + bandCenter, C)}
</svg>`;
}

/** Diamond ticks at 9 and 3 o'clock, separating the two text runs on the band. */
function sideMarker(x: number, y: number): string {
  const r = 7;
  return `<path d="M ${x} ${y - r} L ${x + r} ${y} L ${x} ${y + r} L ${x - r} ${y} Z"
    fill="${COLORS.night}" fill-opacity="0.85"/>`;
}

export const PFP_OUTPUT_WIDTH = S;
