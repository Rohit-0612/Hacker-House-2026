/**
 * Hacker House Goa 2026 — the identity.
 *
 * Single source of truth for the site chrome and the canvas-drawn pass, so a
 * colour change lands in the page and the generated PNG at once. The values are
 * sampled from the official event artwork rather than eyeballed.
 */

export const BRAND = {
  event: "HH GOA 2026",
  eventFull: "HACKER HOUSE GOA",
  devanagari: "गोवा",
  studio: "2:47 PM STUDIO",
  location: "GOA, INDIA",
  dates: "28 – 31 OCT 2026",
  datesTight: "28–31 OCT 2026",
  hashtag: "#FrameInGoa",
  coords: "15.2993° N  74.1240° E",
  motto: "LESS NOISE. MORE SIGNAL.",
  chant: "BUILD → COLLAB → SHIP",
  tagline: "Generate your Hacker House Goa 2026 builder baggage label.",
  passName: "BUILDER BAGGAGE LABEL",
  /** Carrier code motif — reused as the coach prefix and in the ids. */
  train: "HH26",
} as const;

/**
 * Two yellows, deliberately. The wordmark is a bright lemon; the gold is the
 * duller mustard used for buttons and marks. Collapsing them flattens the art.
 */
/**
 * `jungle` is sampled from the supplied palm artwork rather than the hero
 * screenshot. The palms are cropped rectangles composited onto this ground, so
 * the closer the page is to their own background, the less work the feathered
 * edges have to do.
 */
export const COLORS = {
  jungle: "#2C663D",
  jungleDeep: "#082A11",
  junglePanel: "#123B1F",
  jungleLine: "#1F5C33",
  gold: "#F0C018",
  goldDeep: "#D9A800",
  lemon: "#F7E017",
  magenta: "#F4007A",
  magentaDeep: "#C4005F",
  ink: "#0A0A0A",
  paper: "#FFFFFF",
  muted: "#9FC6AC",
} as const;

export const JOURNEY = [
  { day: "01", code: "GENESIS", name: "GENESIS DAY", blurb: "WHERE IT ALL BEGINS", date: "28 OCT" },
  { day: "02", code: "TRIANGLE", name: "DAY OF TRIANGLE", blurb: "PROBLEM. SOLUTION. MARKET", date: "29 OCT" },
  { day: "03", code: "BUILD", name: "BUILD DAY", blurb: "HEADS DOWN. SHIP OR SHIP", date: "30 OCT" },
  { day: "04", code: "LAUNCH", name: "LAUNCH DAY", blurb: "THE WORLD WATCHES", date: "31 OCT" },
] as const;

export const LINKS = {
  x: "https://x.com/247pmstudio",
  telegram: "https://t.me/twofourtysevenpm",
} as const;
