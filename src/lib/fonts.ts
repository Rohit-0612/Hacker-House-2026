import { Anton, Baloo_2, JetBrains_Mono, Playfair_Display } from "next/font/google";

/**
 * Self-hosted by Next at build time — no runtime request to Google, and no
 * layout shift from a late-arriving webfont.
 *
 * These are also the faces the pass is drawn with. `next/font` rewrites every
 * family to a hashed name (`__Anton_1a2b3c`), so canvas code must ask for the
 * font by `.style.fontFamily` rather than the human name — see CANVAS_FONTS.
 */
export const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-playfair",
  display: "swap",
});

export const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

export const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

// Baloo 2 is the Devanagari cut of the family — the Bhai/Paaji/Da variants are
// Gujarati, Gurmukhi and Bengali, and would render गोवा as tofu.
export const baloo = Baloo_2({
  subsets: ["devanagari", "latin"],
  weight: ["700", "800"],
  variable: "--font-baloo",
  display: "swap",
});

export const fontVariables = [
  playfair.variable,
  anton.variable,
  jetbrains.variable,
  baloo.variable,
].join(" ");

/**
 * Family strings for `ctx.font`, paired with the weights the pass actually uses.
 * Canvas2D has no fallback story: hand it a family the document has not loaded
 * and it silently substitutes a system face, so every weight listed here is
 * explicitly awaited in ensureCanvasFonts() before the first fillText().
 */
export const CANVAS_FONTS = {
  display: { family: playfair.style.fontFamily, weights: [700, 900] },
  condensed: { family: anton.style.fontFamily, weights: [400] },
  mono: { family: jetbrains.style.fontFamily, weights: [400, 700] },
  deva: { family: baloo.style.fontFamily, weights: [800] },
} as const;

export type CanvasFontRole = keyof typeof CANVAS_FONTS;
