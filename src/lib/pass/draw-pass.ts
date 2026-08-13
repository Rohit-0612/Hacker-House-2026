import { BRAND, COLORS, JOURNEY } from "@/lib/brand";
import type { PassFields, PassIdentity } from "@/lib/types";
import { font } from "./fonts";
import { barcodePattern } from "./identity";
import { drawCropped, type CropRect, type NormalisedPhoto } from "./photo";
import {
  asterisk,
  coffeeRing,
  cornerMounts,
  decklePath,
  dot,
  fillRoundRect,
  fitted,
  foxing,
  guilloche,
  line,
  paperFibre,
  palm,
  postmark,
  registrationMarks,
  stampBox,
  tracked,
  type Ctx,
} from "./primitives";
import { drawQr } from "./qr";

/**
 * The Builder Baggage Label.
 *
 * A vintage steamer-trunk / luggage tag rather than a filled-in ticket form:
 * the destination is the hero, the photo is a pasted artefact, and the data is
 * franked on in rubber stamps. It keeps the travel spirit the rest of the site
 * runs on (BOARDING…, ROUTING TO GOA, the four stations) without repeating the
 * reference ticket's field grid.
 *
 * Drawn in a 1600×900 logical space; the caller pre-scales the context, so this
 * code is resolution-independent and the same function produces the preview and
 * the 3200px export.
 */
export const PASS_LOGICAL = { width: 1600, height: 900 } as const;

/** Aged stock — a bleached, handled cousin of the brand gold. */
const STOCK = "#F3E3B4";
const STOCK_SHADE = "#DFC98C";
const TWINE = "#C9A227";

/** The label, before its slight rotation. */
const L = { x: 92, y: 72, w: 1416, h: 756 };
const TILT = -1.2;

/* Column guides inside the label's own coordinate space. */
const A = 150; // destination block
const B = 640; // routing + franking
const C = 1040; // photo + verification

export interface PassInput {
  fields: PassFields;
  identity: PassIdentity;
  photo: NormalisedPhoto;
  crop: CropRect;
  /** Encoded into the QR so a scan lands on the share page for this pass. */
  shareUrl: string;
}

export function drawPass(ctx: Ctx, input: PassInput): void {
  ground(ctx);

  ctx.save();
  // Rotate about the label's centre so nothing has to be laid out on a slant.
  ctx.translate(L.x + L.w / 2, L.y + L.h / 2);
  ctx.rotate((TILT * Math.PI) / 180);
  ctx.translate(-L.w / 2, -L.h / 2);

  stock(ctx);
  eyelet(ctx);
  destination(ctx, input.identity);
  routing(ctx, input.fields);
  franking(ctx, input.fields, input.identity);
  stations(ctx);
  photoPanel(ctx, input);

  ctx.restore();
}

/* -------------------------------------------------------------------------- */

function ground(ctx: Ctx): void {
  ctx.fillStyle = COLORS.jungleDeep;
  ctx.fillRect(0, 0, PASS_LOGICAL.width, PASS_LOGICAL.height);

  ctx.save();
  ctx.globalAlpha = 0.42;
  palm(ctx, 40, 300, 1.0, COLORS.jungle);
  palm(ctx, 1576, 340, 1.1, COLORS.jungle, { lean: -0.2 });
  palm(ctx, 150, 940, 1.2, COLORS.jungle, { lean: -0.1 });
  palm(ctx, 1470, 960, 1.0, COLORS.jungle);
  ctx.restore();

  registrationMarks(ctx, 26, 26, PASS_LOGICAL.width - 52, PASS_LOGICAL.height - 52, COLORS.jungleLine);
}

/** Torn cream card with a drop shadow, print texture and age. */
function stock(ctx: Ctx): void {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 12;
  decklePath(ctx, 0, 0, L.w, L.h, 5, 24, 7);
  ctx.fillStyle = STOCK;
  ctx.fill();
  ctx.restore();

  ctx.save();
  decklePath(ctx, 0, 0, L.w, L.h, 5, 24, 7);
  ctx.clip();

  paperFibre(ctx, 0, 0, L.w, L.h, "#8A6A2A", { count: 1500, alpha: 0.06 });
  foxing(ctx, 0, 0, L.w, L.h, "#9A7B33", { count: 110 });
  coffeeRing(ctx, 1170, 690, 92, "#7A5A20");

  // Double keyline border, the way a printed label is ruled.
  ctx.strokeStyle = COLORS.ink;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 3;
  ctx.strokeRect(26, 26, L.w - 52, L.h - 52);
  ctx.lineWidth = 1;
  ctx.strokeRect(34, 34, L.w - 68, L.h - 68);
  ctx.globalAlpha = 1;

  // A magenta band bleeding off the bottom edge, the one loud brand note.
  ctx.fillStyle = COLORS.magenta;
  ctx.globalAlpha = 0.92;
  ctx.fillRect(0, L.h - 26, L.w, 26);
  ctx.globalAlpha = 1;

  ctx.restore();
}

/** Punched eyelet and twine, at the left edge where a tag is tied on. */
function eyelet(ctx: Ctx): void {
  const cx = 84;
  const cy = L.h / 2;

  ctx.save();
  // Reinforcement washer.
  dot(ctx, cx, cy, 34, STOCK_SHADE);
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 34, 0, Math.PI * 2);
  ctx.stroke();

  // The hole itself, showing the ground through.
  dot(ctx, cx, cy, 17, COLORS.jungleDeep);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 17, 0, Math.PI * 2);
  ctx.stroke();

  // Twine looping out through the punch.
  ctx.strokeStyle = TWINE;
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(cx, cy - 12);
  ctx.bezierCurveTo(cx - 90, cy - 70, cx - 120, cy + 60, cx, cy + 12);
  ctx.stroke();
  ctx.strokeStyle = COLORS.ink;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

/** Column A — GOA as the hero, the way a shipping label shouts its port. */
function destination(ctx: Ctx, id: PassIdentity): void {
  ctx.fillStyle = COLORS.ink;
  ctx.globalAlpha = 0.72;
  ctx.font = font("mono", 19);
  tracked(ctx, "HACKER HOUSE · BUILDER BAGGAGE", A, 108, { tracking: 3.4 });
  ctx.globalAlpha = 1;
  line(ctx, A, 128, 600, 128, COLORS.ink, 2.5);

  ctx.fillStyle = COLORS.jungle;
  ctx.font = font("display", 232, 700);
  ctx.fillText("GOA", A - 8, 352);

  goaBadge(ctx, 470, 160, 0.6);

  ctx.fillStyle = COLORS.ink;
  ctx.font = font("mono", 23, 700);
  tracked(ctx, BRAND.datesTight, A, 404, { tracking: 4 });
  line(ctx, A, 428, 600, 428, COLORS.ink, 1.5, [4, 6]);

  ctx.globalAlpha = 0.68;
  ctx.font = font("mono", 15);
  tracked(ctx, "ISSUED BY", A, 470, { tracking: 2.6 });
  ctx.globalAlpha = 1;
  ctx.fillStyle = COLORS.ink;
  ctx.font = font("condensed", 30);
  tracked(ctx, BRAND.studio, A, 504, { tracking: 1.6 });

  // Tally barcode across the foot of the block.
  const bars = barcodePattern(id.ticketNo, 60);
  let x = A;
  ctx.fillStyle = COLORS.ink;
  bars.forEach((bar, i) => {
    const width = bar * 2.1;
    if (i % 2 === 0 && x < 600) ctx.fillRect(x, 552, width, 74);
    x += width + 3.4;
  });

  ctx.font = font("mono", 17, 700);
  tracked(ctx, `TAG NO. ${id.ticketNo}`, A, 654, { tracking: 2.4 });
}

/** The magenta गोवा lockup that sits inside the event's wordmark. */
export function goaBadge(ctx: Ctx, x: number, y: number, scale = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(-0.06);

  ctx.font = font("deva", 46, 800);
  const w = ctx.measureText(BRAND.devanagari).width;
  const padX = 20;
  const boxW = w + padX * 2;
  const boxH = 62;

  fillRoundRect(ctx, -4, -4, boxW + 8, boxH + 8, 22, COLORS.ink);
  fillRoundRect(ctx, 0, 0, boxW, boxH, 20, COLORS.magenta);

  ctx.fillStyle = COLORS.lemon;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(BRAND.devanagari, boxW / 2, boxH / 2 + 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.restore();
}

/** A dotted great-circle arc instead of a FROM/TO row. */
function routing(ctx: Ctx, fields: PassFields): void {
  const x0 = B + 10;
  const x1 = 1000;
  const baseY = 214;
  const apex = 138;

  ctx.save();
  ctx.strokeStyle = COLORS.magenta;
  ctx.lineWidth = 3;
  ctx.setLineDash([7, 9]);
  ctx.beginPath();
  ctx.moveTo(x0, baseY);
  ctx.quadraticCurveTo((x0 + x1) / 2, apex - 46, x1, baseY);
  ctx.stroke();
  ctx.restore();

  dot(ctx, x0, baseY, 8, COLORS.ink);
  dot(ctx, x1, baseY, 8, COLORS.magenta);
  ctx.beginPath();
  ctx.arc(x1, baseY, 15, 0, Math.PI * 2);
  ctx.strokeStyle = COLORS.magenta;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  plane(ctx, (x0 + x1) / 2, apex - 6, COLORS.ink);

  ctx.fillStyle = COLORS.ink;
  ctx.globalAlpha = 0.66;
  ctx.font = font("mono", 14);
  tracked(ctx, "FROM", x0, baseY + 32, { tracking: 2.4 });
  tracked(ctx, "TO", x1, baseY + 32, { tracking: 2.4, align: "right" });
  ctx.globalAlpha = 1;

  ctx.fillStyle = COLORS.ink;
  fitted(ctx, fields.city.toUpperCase(), x0, baseY + 68, 220, (s) => font("condensed", s), 34, 20, {
    tracking: 1,
  });
  ctx.fillStyle = COLORS.jungle;
  ctx.font = font("condensed", 34);
  tracked(ctx, "GOA", x1, baseY + 68, { tracking: 1, align: "right" });
}

/** Passenger, team, class and ids — franked on as rubber stamps. */
function franking(ctx: Ctx, fields: PassFields, id: PassIdentity): void {
  // PASSENGER — the largest stamp, tilted the most.
  stampBox(ctx, B, 318, 360, 96, COLORS.ink, -1.6, (c) => {
    c.fillStyle = COLORS.ink;
    c.globalAlpha = 0.7;
    c.font = font("mono", 13);
    tracked(c, "PASSENGER", 18, 30, { tracking: 2.6 });
    c.globalAlpha = 1;
    c.fillStyle = COLORS.ink;
    fitted(c, fields.name.toUpperCase(), 18, 74, 324, (s) => font("condensed", s), 44, 22, {
      tracking: 0.6,
    });
  });

  stampBox(ctx, B, 432, 200, 78, COLORS.ink, 1.1, (c) => {
    c.fillStyle = COLORS.ink;
    c.globalAlpha = 0.7;
    c.font = font("mono", 12);
    tracked(c, "TEAM", 16, 26, { tracking: 2.4 });
    c.globalAlpha = 1;
    c.fillStyle = COLORS.ink;
    fitted(c, fields.team.toUpperCase(), 16, 60, 170, (s) => font("condensed", s), 28, 16, {
      tracking: 0.5,
    });
  });

  stampBox(ctx, B + 218, 432, 202, 78, COLORS.magenta, -0.8, (c) => {
    c.fillStyle = COLORS.magenta;
    c.globalAlpha = 0.75;
    c.font = font("mono", 12);
    tracked(c, "CLASS", 16, 26, { tracking: 2.4 });
    c.globalAlpha = 1;
    fitted(c, fields.role.toUpperCase(), 16, 60, 172, (s) => font("condensed", s), 28, 15, {
      tracking: 0.5,
    });
  });

  ctx.fillStyle = COLORS.ink;
  ctx.globalAlpha = 0.66;
  ctx.font = font("mono", 13);
  tracked(ctx, "BAGGAGE ID", B, 552, { tracking: 2.6 });
  tracked(ctx, "PNR", B + 230, 552, { tracking: 2.6 });
  ctx.globalAlpha = 1;

  ctx.fillStyle = COLORS.ink;
  ctx.font = font("mono", 25, 700);
  tracked(ctx, id.builderId, B, 584, { tracking: 0.6 });
  tracked(ctx, id.pnr, B + 230, 584, { tracking: 0.6 });
}

/** The four days, franked as date postmarks along the foot of the label. */
function stations(ctx: Ctx): void {
  const first = B + 34;
  const gap = 96;

  ctx.save();
  ctx.globalAlpha = 0.9;
  JOURNEY.forEach((stop, i) => {
    const cx = first + i * gap;
    const cy = 656;
    const ink = i % 2 ? COLORS.magenta : COLORS.ink;

    // Rings and the day number only. Arced text at this radius came out as an
    // illegible smudge, so the station name is set plainly underneath instead.
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(((i % 2 ? 5 : -6) * Math.PI) / 180);
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = font("condensed", 34);
    tracked(ctx, String(28 + i), 0, 12, { tracking: 1, align: "center" });
    ctx.restore();

    ctx.fillStyle = COLORS.ink;
    ctx.globalAlpha = 0.75;
    ctx.font = font("mono", 11, 700);
    tracked(ctx, stop.code, cx, cy + 60, { tracking: 1.6, align: "center" });
    ctx.globalAlpha = 0.9;
  });
  ctx.restore();
}

/** Column C — the photo pasted in, stamped over, and verified. */
function photoPanel(ctx: Ctx, input: PassInput): void {
  const px = C + 18;
  const py = 104;
  const pw = 272;
  const ph = 340;

  ctx.save();
  ctx.translate(px + pw / 2, py + ph / 2);
  ctx.rotate((2.4 * Math.PI) / 180);
  ctx.translate(-pw / 2, -ph / 2);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = "#FFFDF4";
  ctx.fillRect(-14, -14, pw + 28, ph + 44); // photo-paper border
  ctx.restore();

  guilloche(ctx, pw / 2, ph / 2, 210, STOCK_SHADE, { petals: 9, alpha: 0.35 });
  drawCropped(ctx, input.photo, input.crop, 0, 0, pw, ph);

  ctx.strokeStyle = COLORS.ink;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, pw, ph);
  ctx.globalAlpha = 1;

  ctx.fillStyle = COLORS.ink;
  ctx.globalAlpha = 0.6;
  ctx.font = font("mono", 12);
  tracked(ctx, "BUILDER · HH26", pw / 2, ph + 22, { tracking: 2.6, align: "center" });
  ctx.globalAlpha = 1;

  cornerMounts(ctx, -14, -14, pw + 28, ph + 28, 34, STOCK_SHADE);
  ctx.restore();

  // Postmark cancelling the photo's top corner — over it, not beside it.
  postmark(
    ctx,
    C + 10,
    126,
    58,
    COLORS.magenta,
    "HH GOA 2026",
    "VERIFIED",
    "26",
    { arc: font("mono", 11, 700), centre: font("condensed", 34) },
    -12,
  );

  verifiedOval(ctx, C + 110, 528);
  qrBlock(ctx, input.shareUrl);
}

/** An oval clearance stamp, overprinted at an angle. */
function verifiedOval(ctx: Ctx, cx: number, cy: number): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((-7 * Math.PI) / 180);
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = COLORS.jungle;
  ctx.fillStyle = COLORS.jungle;

  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 98, 48, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 90, 40, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.font = font("condensed", 26);
  tracked(ctx, "VERIFIED", 0, -1, { tracking: 2.4, align: "center" });
  ctx.font = font("mono", 12, 700);
  tracked(ctx, "BUILDER", 0, 21, { tracking: 3, align: "center" });

  asterisk(ctx, -74, 0, 7, COLORS.magenta);
  asterisk(ctx, 74, 0, 7, COLORS.magenta);
  ctx.restore();
}

function qrBlock(ctx: Ctx, shareUrl: string): void {
  // Held clear of the ruled border: the label is 1416 wide with a 34px inset,
  // so nothing may cross x 1382.
  const size = 104;
  const x = C + 226;
  const y = 474;

  ctx.save();
  ctx.rotate(0);
  drawQr(ctx, shareUrl, x, y, size, { dark: COLORS.ink, light: "#FFFDF4" });
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, size, size);

  ctx.fillStyle = COLORS.ink;
  ctx.globalAlpha = 0.7;
  ctx.font = font("mono", 11);
  tracked(ctx, "SCAN TO VERIFY", x + size / 2, y + size + 20, { tracking: 1.8, align: "center" });
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** A small plane riding the routing arc. */
function plane(ctx: Ctx, cx: number, cy: number, color: string): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(0.12);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(26, 0);
  ctx.lineTo(-6, 9);
  ctx.lineTo(-16, 9);
  ctx.lineTo(-8, 0);
  ctx.lineTo(-16, -9);
  ctx.lineTo(-6, -9);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

