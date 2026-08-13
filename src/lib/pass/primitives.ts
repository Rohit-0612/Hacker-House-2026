/**
 * Drawing primitives shared by the pass and PFP painters.
 *
 * Everything here works in *logical* units. The painters pre-scale the context
 * once, so the same code produces the on-screen preview and the 3200px export
 * with no per-call resolution maths.
 */

export type Ctx = CanvasRenderingContext2D;

/** `ctx.roundRect` is recent enough (Safari 16.4) to deserve a fallback. */
export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  const rad = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function fillRoundRect(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
): void {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

export function strokeRoundRect(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  stroke: string,
  width = 2,
): void {
  roundRect(ctx, x, y, w, h, r);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}

export function line(
  ctx: Ctx,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 2,
  dash: number[] = [],
): void {
  ctx.save();
  ctx.beginPath();
  ctx.setLineDash(dash);
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}

export function dot(ctx: Ctx, x: number, y: number, r: number, fill: string): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

/**
 * The tear line between stub and body — punched holes rather than a dashed
 * stroke, so it reads as perforation rather than as a border.
 */
export function perforation(
  ctx: Ctx,
  x: number,
  y1: number,
  y2: number,
  color: string,
  step = 16,
  r = 3,
): void {
  for (let y = y1 + step / 2; y < y2; y += step) dot(ctx, x, y, r, color);
}

/* -------------------------------------------------------------------------- */
/* Text                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Letter-spaced text, drawn glyph by glyph.
 *
 * `ctx.letterSpacing` would be simpler but only landed in Safari 17.4, and the
 * wide mono labels are load-bearing in this design — losing the tracking on an
 * older iPhone would change the whole composition.
 */
export function trackedWidth(ctx: Ctx, text: string, tracking: number): number {
  const chars = [...text];
  let w = 0;
  for (const ch of chars) w += ctx.measureText(ch).width + tracking;
  return w - (chars.length ? tracking : 0);
}

export interface TrackedOptions {
  tracking?: number;
  align?: "left" | "center" | "right";
}

export function tracked(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  { tracking = 0, align = "left" }: TrackedOptions = {},
): number {
  const total = trackedWidth(ctx, text, tracking);
  let cursor = align === "left" ? x : align === "center" ? x - total / 2 : x - total;

  ctx.textAlign = "left";
  for (const ch of [...text]) {
    ctx.fillText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + tracking;
  }
  return total;
}

/**
 * Shrinks the font until the string fits, then draws it. User-supplied names,
 * teams and roles are arbitrary length — without this a long one runs straight
 * off the ticket, and truncating a person's name is a worse outcome than
 * setting it a few points smaller.
 */
export function fitted(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  makeFont: (size: number) => string,
  size: number,
  minSize: number,
  options: TrackedOptions = {},
): void {
  let current = size;
  ctx.font = makeFont(current);

  while (current > minSize && trackedWidth(ctx, text, options.tracking ?? 0) > maxWidth) {
    current -= 1;
    ctx.font = makeFont(current);
  }

  // Below minSize, ellipsise rather than shrink into illegibility.
  let out = text;
  if (trackedWidth(ctx, out, options.tracking ?? 0) > maxWidth) {
    while (out.length > 1 && trackedWidth(ctx, `${out}…`, options.tracking ?? 0) > maxWidth) {
      out = out.slice(0, -1);
    }
    out = `${out}…`;
  }

  tracked(ctx, out, x, y, options);
}

/** Text set around a circle, one glyph at a time — used for the PFP ring. */
export function arcText(
  ctx: Ctx,
  text: string,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  { tracking = 0, flip = false }: { tracking?: number; flip?: boolean } = {},
): void {
  const glyphs = [...text].map((ch) => ({ ch, width: ctx.measureText(ch).width + tracking }));
  const total = glyphs.reduce((sum, g) => sum + g.width, 0);
  const direction = flip ? -1 : 1;

  let angle = startAngle - (direction * total) / radius / 2;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const { ch, width } of glyphs) {
    const step = width / radius;
    angle += (direction * step) / 2;

    ctx.save();
    ctx.translate(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    ctx.rotate(angle + (flip ? -Math.PI / 2 : Math.PI / 2));
    ctx.fillText(ch, 0, 0);
    ctx.restore();

    angle += (direction * step) / 2;
  }

  ctx.restore();
}

/* -------------------------------------------------------------------------- */
/* Security-print detailing                                                   */
/* -------------------------------------------------------------------------- */

/**
 * A guilloché rosette — the interference pattern engraved on banknotes and rail
 * tickets. Cheap to draw, and it is most of what separates a generated ticket
 * from a screenshot of a div.
 */
export function guilloche(
  ctx: Ctx,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  { petals = 7, rings = 3, alpha = 0.16 }: { petals?: number; rings?: number; alpha?: number } = {},
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  for (let ring = 0; ring < rings; ring++) {
    const r = radius * (1 - ring * 0.17);
    const inner = r * 0.42;
    ctx.beginPath();
    for (let t = 0; t <= Math.PI * 2 * petals; t += 0.03) {
      const k = r - inner;
      const x = cx + k * Math.cos(t) + inner * Math.cos((k / inner) * t);
      const y = cy + k * Math.sin(t) - inner * Math.sin((k / inner) * t);
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.restore();
}

/** Offset halftone dots — mimics the dot gain of cheap ticket printing. */
export function halftone(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  { step = 9, r = 1.1, alpha = 0.1 }: { step?: number; r?: number; alpha?: number } = {},
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;

  let row = 0;
  for (let cy = y; cy < y + h; cy += step, row++) {
    const offset = row % 2 ? step / 2 : 0;
    for (let cx = x + offset; cx < x + w; cx += step) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/** Hairline crop/registration marks, as on a press sheet. */
export function registrationMarks(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  len = 18,
): void {
  const corners: [number, number, number, number][] = [
    [x, y, 1, 1],
    [x + w, y, -1, 1],
    [x, y + h, 1, -1],
    [x + w, y + h, -1, -1],
  ];
  for (const [cx, cy, sx, sy] of corners) {
    line(ctx, cx, cy, cx + sx * len, cy, color, 1);
    line(ctx, cx, cy, cx, cy + sy * len, color, 1);
  }
}

/* -------------------------------------------------------------------------- */
/* Aged paper & franking                                                      */
/* -------------------------------------------------------------------------- */

/** A deterministic wobble, so a given label always tears the same way. */
function wobble(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/**
 * Traces a torn, hand-cut edge instead of a ruled rectangle. This is most of
 * what stops the label reading as a `<div>` with a border-radius.
 */
export function decklePath(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  amp = 4,
  step = 22,
  seed = 7,
): void {
  const rng = wobble(seed);
  const jitter = () => (rng() - 0.5) * 2 * amp;

  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = x + step; i < x + w; i += step) ctx.lineTo(i, y + jitter());
  ctx.lineTo(x + w, y);
  for (let i = y + step; i < y + h; i += step) ctx.lineTo(x + w + jitter(), i);
  ctx.lineTo(x + w, y + h);
  for (let i = x + w - step; i > x; i -= step) ctx.lineTo(i, y + h + jitter());
  ctx.lineTo(x, y + h);
  for (let i = y + h - step; i > y; i -= step) ctx.lineTo(x + jitter(), i);
  ctx.closePath();
}

/** Paper fibre — irregular short strokes, not the regular dots of halftone. */
export function paperFibre(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  { count = 900, alpha = 0.05, seed = 3 }: { count?: number; alpha?: number; seed?: number } = {},
): void {
  const rng = wobble(seed);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  for (let i = 0; i < count; i++) {
    const px = x + rng() * w;
    const py = y + rng() * h;
    const len = 2 + rng() * 9;
    const angle = rng() * Math.PI;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(angle) * len, py + Math.sin(angle) * len);
    ctx.stroke();
  }
  ctx.restore();
}

/** Age spots, heavier toward the corners where a label is handled most. */
export function foxing(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  { count = 90, seed = 11 }: { count?: number; seed?: number } = {},
): void {
  const rng = wobble(seed);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = color;

  for (let i = 0; i < count; i++) {
    // Bias toward the edges: square the distance from centre.
    const px = x + (rng() < 0.5 ? rng() * rng() : 1 - rng() * rng()) * w;
    const py = y + (rng() < 0.5 ? rng() * rng() : 1 - rng() * rng()) * h;
    ctx.globalAlpha = 0.03 + rng() * 0.05;
    ctx.beginPath();
    ctx.ellipse(px, py, 3 + rng() * 14, 3 + rng() * 11, rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** A ring left by a cup on the counter where the tag was filled in. */
export function coffeeRing(ctx: Ctx, cx: number, cy: number, r: number, color: string): void {
  ctx.save();
  ctx.globalAlpha = 0.11;
  ctx.strokeStyle = color;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0.3, Math.PI * 1.75);
  ctx.stroke();
  ctx.globalAlpha = 0.06;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 9, 0.6, Math.PI * 1.6);
  ctx.stroke();
  ctx.restore();
}

/**
 * A rubber stamp: boxed, rotated a degree or two off true, and drawn at less
 * than full opacity so it reads as ink pressed onto paper rather than as UI.
 */
export function stampBox(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  angle = 0,
  draw?: (ctx: Ctx) => void,
): void {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.translate(-w / 2, -h / 2);
  ctx.globalAlpha = 0.88;

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, w, h);
  ctx.lineWidth = 1;
  ctx.strokeRect(5, 5, w - 10, h - 10);

  draw?.(ctx);
  ctx.restore();
}

/** A circular postmark: concentric rings, arced text, and cancellation bars. */
export function postmark(
  ctx: Ctx,
  cx: number,
  cy: number,
  r: number,
  color: string,
  top: string,
  bottom: string,
  centre: string,
  fonts: { arc: string; centre: string },
  angle = 0,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;

  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, r - 9, 0, Math.PI * 2);
  ctx.stroke();

  ctx.font = fonts.arc;
  arcText(ctx, top, 0, 0, r - 20, -Math.PI / 2, { tracking: 2 });
  arcText(ctx, bottom, 0, 0, r - 20, Math.PI / 2, { tracking: 2, flip: true });

  ctx.font = fonts.centre;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(centre, 0, 0);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // Cancellation bars either side of the centre.
  ctx.lineWidth = 2.5;
  for (const dy of [-r * 0.42, r * 0.42]) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.62, dy);
    ctx.lineTo(r * 0.62, dy);
    ctx.stroke();
  }
  ctx.restore();
}

/** Photo-corner mounts, as used to paste a print into an album. */
export function cornerMounts(ctx: Ctx, x: number, y: number, w: number, h: number, size: number, color: string): void {
  const corners: [number, number, number, number][] = [
    [x, y, 1, 1],
    [x + w, y, -1, 1],
    [x, y + h, 1, -1],
    [x + w, y + h, -1, -1],
  ];
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.85;
  for (const [cx, cy, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + sx * size, cy);
    ctx.lineTo(cx, cy + sy * size);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** The magenta asterisk-flower that punctuates the brand's illustration set. */
export function asterisk(ctx: Ctx, cx: number, cy: number, r: number, color: string, arms = 8): void {
  ctx.save();
  ctx.fillStyle = color;
  for (let i = 0; i < arms; i++) {
    const a = (i / arms) * Math.PI * 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.55, r * 0.26, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  dot(ctx, cx, cy, r * 0.24, color);
  ctx.restore();
}

/** Flat line-art palm, matching the event illustration style. */
export function palm(
  ctx: Ctx,
  x: number,
  y: number,
  scale: number,
  stroke: string,
  { fronds = 7, lean = 0.18 }: { fronds?: number; lean?: number } = {},
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";

  // Trunk
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-18 * lean * 5, -60, -10, -118);
  ctx.stroke();

  // Fronds radiating from the crown
  for (let i = 0; i < fronds; i++) {
    const a = Math.PI + (i / (fronds - 1)) * Math.PI;
    const len = 46 + (i % 2) * 12;
    ctx.beginPath();
    ctx.moveTo(-10, -118);
    ctx.quadraticCurveTo(
      -10 + Math.cos(a) * len * 0.6,
      -118 + Math.sin(a) * len * 0.6 - 16,
      -10 + Math.cos(a) * len,
      -118 + Math.sin(a) * len + 12,
    );
    ctx.stroke();
  }

  ctx.restore();
}

/** Rising-sun motif with rays, straight off the event's beach artwork. */
export function sunburst(
  ctx: Ctx,
  cx: number,
  cy: number,
  r: number,
  color: string,
  { rays = 12, rayLen = 0.55 }: { rays?: number; rayLen?: number } = {},
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";

  for (let i = 0; i < rays; i++) {
    const a = Math.PI + (i / (rays - 1)) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 1.25, cy + Math.sin(a) * r * 1.25);
    ctx.lineTo(cx + Math.cos(a) * r * (1.25 + rayLen), cy + Math.sin(a) * r * (1.25 + rayLen));
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 0);
  ctx.fill();
  ctx.restore();
}
