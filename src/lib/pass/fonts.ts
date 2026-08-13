import { CANVAS_FONTS } from "@/lib/fonts";
import { BRAND } from "@/lib/brand";

/**
 * Canvas2D has no font fallback story worth relying on: hand `ctx.font` a family
 * the document has not finished loading and it silently substitutes a system
 * face, producing artwork that looks subtly (or completely) wrong with no error
 * anywhere. So every family/weight the painters use is loaded up front.
 *
 * Memoised — the second generation must not pay for this again.
 */
let ready: Promise<void> | null = null;

export function ensureCanvasFonts(): Promise<void> {
  ready ??= load();
  return ready;
}

async function load(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;

  const jobs: Promise<unknown>[] = [];
  for (const [role, { family, weights }] of Object.entries(CANVAS_FONTS)) {
    for (const weight of weights) {
      // `document.fonts.load` only probes the glyphs in the sample text, which
      // defaults to Latin. The Devanagari face has no Latin coverage worth
      // testing, so it has to be probed with the string it will actually draw.
      const sample = role === "deva" ? BRAND.devanagari : undefined;
      jobs.push(document.fonts.load(`${weight} 100px ${family}`, sample).catch(() => undefined));
    }
  }

  await Promise.all(jobs);
  await document.fonts.ready;
}

/**
 * The PFP ring artwork.
 *
 * Memoised and awaited before painting for the same reason the fonts are: an
 * image that has not finished decoding draws nothing at all, silently, and the
 * export would come out as a bare photo on a green square.
 *
 * Lazily fetched — it is ~800KB of lossless line art, and most visitors only
 * ever generate a pass.
 */
let framePromise: Promise<HTMLImageElement> | null = null;

export function loadPfpFrame(): Promise<HTMLImageElement> {
  framePromise ??= new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => {
      framePromise = null; // let a later attempt retry rather than cache the failure
      reject(new Error("Couldn't load the PFP frame artwork."));
    };
    img.src = "/pfp-frame.webp";
  });
  return framePromise;
}

/** Builds a `ctx.font` string for one of the brand faces. */
export function font(role: keyof typeof CANVAS_FONTS, size: number, weight?: number): string {
  const spec = CANVAS_FONTS[role];
  return `${weight ?? spec.weights[0]} ${size}px ${spec.family}`;
}
