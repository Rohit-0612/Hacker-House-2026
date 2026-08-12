import "server-only";

import fs from "node:fs";
import path from "node:path";

export interface LoadedFont {
  name: string;
  data: Buffer;
  weight: 400 | 600 | 700;
  style: "normal";
}

const FONT_DIR = path.join(process.cwd(), "src", "assets", "fonts");

const FONT_FILES: { file: string; name: string; weight: 400 | 600 | 700 }[] = [
  { file: "Inter-Regular.ttf", name: "Inter", weight: 400 },
  { file: "Inter-SemiBold.ttf", name: "Inter", weight: 600 },
  { file: "SpaceGrotesk-Bold.ttf", name: "Space Grotesk", weight: 700 },
];

let cache: LoadedFont[] | null = null;

/**
 * Reads the vendored TTFs once per lambda instance.
 *
 * These are static instances, not variable fonts — satori's opentype parser
 * ignores variation axes and would otherwise render every weight at the font's
 * default instance (Space Grotesk defaults to Light, which looks broken).
 *
 * next.config.ts must keep these in `outputFileTracingIncludes`, since the
 * tracer cannot see through readFileSync.
 */
export function loadFonts(): LoadedFont[] {
  if (cache) return cache;

  cache = FONT_FILES.map(({ file, name, weight }) => {
    const full = path.join(FONT_DIR, file);
    let data: Buffer;
    try {
      data = fs.readFileSync(full);
    } catch (cause) {
      throw new Error(
        `Font "${file}" is missing from the deployment bundle (looked in ${FONT_DIR}). ` +
          `Check outputFileTracingIncludes in next.config.ts.`,
        { cause },
      );
    }
    return { name, data, weight, style: "normal" as const };
  });

  return cache;
}

/** Raw buffers for resvg, which does its own font matching by family name. */
export function fontBuffers(): Buffer[] {
  return loadFonts().map((f) => f.data);
}
