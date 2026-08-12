/**
 * Sunset Coast — the HH Goa 2026 identity.
 *
 * Single source of truth for both the web UI and the server-rendered graphics,
 * so a colour change lands in the landing page and the generated PNG at once.
 */

export const BRAND = {
  event: "HH GOA 2026",
  wordmark: "FRAME IN GOA",
  hashtag: "#FrameInGoa",
  /** Panaji, Goa — used as a fine-print motif across every surface. */
  coords: "15.2993° N  74.1240° E",
  tagline: "Generate your HH Goa 2026 Builder Identity",
} as const;

export const COLORS = {
  night: "#070B1F",
  nightRaised: "#0D1330",
  coral: "#FF4D6D",
  amber: "#FF9E4A",
  violet: "#7B5CFF",
  cyan: "#22D3EE",
  text: "#F8FAFC",
  muted: "#94A3B8",
} as const;

/** The sunset arc — the one gradient that ties every surface together. */
export const SUNSET = [COLORS.coral, COLORS.amber] as const;
export const SUNSET_FULL = [COLORS.violet, COLORS.coral, COLORS.amber] as const;

export const FONT_DISPLAY = "Space Grotesk";
export const FONT_BODY = "Inter";
