/** Escapes text destined for SVG markup. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * A circular arc path for <textPath>.
 *
 * Both arcs travel left-to-right; only the sweep flag differs, which is what
 * picks the upper or lower half of the circle. Travelling right-to-left along
 * the bottom instead would render "BUILDER" upside-down — glyph orientation
 * follows the direction of travel, not the position on the circle.
 *
 * Consequence for callers: glyphs grow outward from the baseline on the top arc
 * and inward on the bottom arc, so the two text radii are not symmetric.
 */
export function arcPath(cx: number, cy: number, r: number, half: "top" | "bottom"): string {
  const left = `${cx - r} ${cy}`;
  const right = `${cx + r} ${cy}`;
  const sweep = half === "top" ? 1 : 0;
  return `M ${left} A ${r} ${r} 0 0 ${sweep} ${right}`;
}

/** Deterministic 32-bit hash — same name always yields the same decorative glyph. */
export function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Small deterministic PRNG seeded from the hash above. */
export function seededRandom(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 0xffffffff;
  };
}
