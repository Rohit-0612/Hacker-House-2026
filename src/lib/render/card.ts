import "server-only";

import satori from "satori";
import { BRAND, COLORS } from "../brand";
import { OUTPUT_SIZES, type CardVariant, type GenerateFields } from "../types";
import { loadFonts } from "./fonts";
import { h, col, row, text, type SatoriNode } from "./h";
import { rasterize } from "./rasterize";
import { hashString, seededRandom } from "./svg";

/**
 * The Builder ID card.
 *
 * Satori (rather than hand-written SVG like the PFP frame) because names and
 * stacks are arbitrary user strings: this needs real text measurement, wrapping
 * and truncation, which is exactly what a flexbox engine gives for free.
 */

const DISPLAY = "Space Grotesk";
const BODY = "Inter";

/** Long names get stepped down so they stay on one line without shrinking short ones. */
function nameSize(name: string, variant: CardVariant): number {
  const base = variant === "landscape" ? 68 : 76;
  const len = name.length;
  if (len <= 12) return base;
  if (len <= 18) return base - 12;
  if (len <= 24) return base - 22;
  return base - 30;
}

/**
 * Decorative glyph block, seeded from the name so every card differs but any
 * given name is stable. It is a visual motif, not a scannable code — the card
 * labels it as such rather than implying it resolves somewhere.
 */
function glyphBlock(seed: string, cell: number): SatoriNode {
  const rand = seededRandom(hashString(seed));
  const N = 7;
  const rows: SatoriNode[] = [];

  for (let y = 0; y < N; y++) {
    const cells: SatoriNode[] = [];
    for (let x = 0; x < N; x++) {
      // Anchor squares in three corners, the way a real QR has finder patterns.
      const finder =
        (x < 2 && y < 2) || (x > N - 3 && y < 2) || (x < 2 && y > N - 3);
      const on = finder || rand() > 0.52;
      cells.push(
        h("div", {
          style: {
            width: cell,
            height: cell,
            borderRadius: Math.max(1, cell * 0.22),
            background: on ? COLORS.text : "transparent",
            opacity: finder ? 0.92 : 0.5,
          },
        }),
      );
    }
    rows.push(row({ gap: 2 }, ...cells));
  }
  return col({ gap: 2 }, ...rows);
}

/** Circular photo with the same sunset ring the PFP frame uses. */
function ringedPhoto(photoDataUri: string, size: number): SatoriNode {
  const ring = 10;
  return h(
    "div",
    {
      style: {
        display: "flex",
        width: size,
        height: size,
        borderRadius: 9999,
        padding: ring,
        // Gradient border, done as a padded gradient background — satori has no
        // border-image, and this composites more predictably anyway.
        backgroundImage: `linear-gradient(135deg, ${COLORS.violet} 0%, ${COLORS.coral} 42%, ${COLORS.amber} 100%)`,
        // Deliberately no boxShadow: satori compiles it to an feGaussianBlur,
        // and a large-radius blur over this area measured at ~350ms of resvg
        // time per card — roughly half the total rasterisation cost. The glow
        // behind the photo (see cardGlow) is a radial gradient instead, which
        // looks near-identical and costs almost nothing.
      },
    },
    h("img", {
      src: photoDataUri,
      width: size - ring * 2,
      height: size - ring * 2,
      style: {
        width: size - ring * 2,
        height: size - ring * 2,
        borderRadius: 9999,
        objectFit: "cover",
        border: `3px solid ${COLORS.night}`,
      },
    }),
  );
}

function eyebrow(): SatoriNode {
  return row(
    { alignItems: "center", gap: 12 },
    h("div", {
      style: {
        width: 34,
        height: 4,
        borderRadius: 9999,
        backgroundImage: `linear-gradient(90deg, ${COLORS.coral}, ${COLORS.amber})`,
      },
    }),
    text(
      {
        fontFamily: DISPLAY,
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: 4,
        color: COLORS.text,
      },
      BRAND.wordmark,
    ),
  );
}

function titlePill(title: string, fontSize: number): SatoriNode {
  return row(
    {
      alignItems: "center",
      gap: 12,
      paddingLeft: 22,
      paddingRight: 26,
      paddingTop: 12,
      paddingBottom: 12,
      borderRadius: 9999,
      backgroundImage: `linear-gradient(100deg, ${COLORS.coral}, ${COLORS.amber})`,
      // No boxShadow here either — same blur cost, and the pill already reads as
      // raised against the dark backdrop.
    },
    h("div", {
      style: { width: 9, height: 9, borderRadius: 9999, background: COLORS.night, opacity: 0.75 },
    }),
    text(
      {
        fontFamily: DISPLAY,
        fontSize,
        fontWeight: 700,
        color: "#2A0A12",
        letterSpacing: 0.4,
      },
      title,
    ),
  );
}

function metaLabel(label: string, value: string, size: number): SatoriNode {
  return col(
    { gap: 7 },
    text(
      {
        fontFamily: BODY,
        fontWeight: 600,
        fontSize: size - 6,
        letterSpacing: 2.6,
        color: COLORS.cyan,
        opacity: 0.85,
      },
      label,
    ),
    text({ fontFamily: BODY, fontWeight: 600, fontSize: size, color: COLORS.text }, value),
  );
}

/**
 * Shared backdrop: night base, colour blooms, and the horizon arc.
 *
 * `glow` sits behind the portrait and replaces the box-shadow that used to be
 * there. A radial gradient rasterises far cheaper than the equivalent Gaussian
 * blur while reading almost the same at this size.
 */
function backdrop(
  width: number,
  height: number,
  glow: { x: string; y: string },
): SatoriNode[] {
  return [
    h("div", {
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        backgroundImage: `radial-gradient(circle at ${glow.x} ${glow.y}, rgba(255,77,109,0.34) 0%, rgba(255,77,109,0) 34%), radial-gradient(circle at 12% 8%, rgba(123,92,255,0.42) 0%, rgba(123,92,255,0) 46%), radial-gradient(circle at 88% 96%, rgba(255,77,109,0.38) 0%, rgba(255,77,109,0) 52%), radial-gradient(circle at 96% 18%, rgba(34,211,238,0.18) 0%, rgba(34,211,238,0) 40%)`,
      },
    }),
    // The sunset arc — a wide, faint circle whose top edge reads as a horizon.
    h("div", {
      style: {
        position: "absolute",
        left: width * 0.5 - height * 1.15,
        top: height * 0.72,
        width: height * 2.3,
        height: height * 2.3,
        borderRadius: 9999,
        border: `2px solid rgba(255,158,74,0.30)`,
      },
    }),
  ];
}

function shell(
  width: number,
  height: number,
  glow: { x: string; y: string },
  children: SatoriNode[],
): SatoriNode {
  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        position: "relative",
        width,
        height,
        background: COLORS.night,
        overflow: "hidden",
        fontFamily: BODY,
      },
    },
    ...backdrop(width, height, glow),
    ...children,
  );
}

function footer(width: number, fontSize: number): SatoriNode {
  return row(
    {
      alignItems: "center",
      justifyContent: "space-between",
      width,
      borderTop: `1px solid rgba(248,250,252,0.12)`,
      paddingTop: 18,
    },
    text(
      {
        fontFamily: DISPLAY,
        fontWeight: 700,
        fontSize,
        letterSpacing: 1.2,
        backgroundImage: `linear-gradient(90deg, ${COLORS.coral}, ${COLORS.amber})`,
        backgroundClip: "text",
        color: "transparent",
      },
      BRAND.hashtag,
    ),
    text(
      { fontFamily: BODY, fontWeight: 400, fontSize: fontSize - 4, color: COLORS.muted, letterSpacing: 1.4 },
      BRAND.coords,
    ),
  );
}

function landscape(photoDataUri: string, fields: GenerateFields): SatoriNode {
  const { width, height } = OUTPUT_SIZES.landscape;
  const PAD = 62;

  return shell(width, height, { x: "19%", y: "50%" }, [
    row(
      {
        position: "relative",
        width,
        height,
        paddingLeft: PAD,
        paddingRight: PAD,
        paddingTop: 48,
        paddingBottom: 44,
        alignItems: "center",
        gap: 52,
      },
      ringedPhoto(photoDataUri, 336),
      col(
        { flexGrow: 1, height: "100%", justifyContent: "space-between", paddingTop: 6 },
        col(
          { gap: 20 },
          eyebrow(),
          text(
            {
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: nameSize(fields.name, "landscape"),
              color: COLORS.text,
              lineHeight: 1.05,
              letterSpacing: -1.4,
            },
            fields.name,
          ),
          row(
            { alignItems: "center", gap: 26 },
            metaLabel("STACK", fields.stack, 26),
          ),
          titlePill(fields.title, 27),
        ),
        footer(width - PAD * 2 - 336 - 52, 24),
      ),
      // Event lockup + glyph, pinned to the top-right corner.
      col(
        {
          position: "absolute",
          top: 44,
          right: PAD,
          alignItems: "flex-end",
          gap: 16,
        },
        text(
          {
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: 3.4,
            color: COLORS.text,
            opacity: 0.92,
          },
          BRAND.event,
        ),
        glyphBlock(fields.name + fields.title, 9),
      ),
    ),
  ]);
}

function square(photoDataUri: string, fields: GenerateFields): SatoriNode {
  const { width, height } = OUTPUT_SIZES.square;
  const PAD = 76;

  return shell(width, height, { x: "22%", y: "37%" }, [
    col(
      {
        position: "relative",
        width,
        height,
        paddingLeft: PAD,
        paddingRight: PAD,
        paddingTop: 66,
        paddingBottom: 58,
        alignItems: "flex-start",
        justifyContent: "space-between",
      },
      row(
        { width: width - PAD * 2, alignItems: "flex-start", justifyContent: "space-between" },
        eyebrow(),
        text(
          {
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: 3.4,
            color: COLORS.text,
            opacity: 0.92,
          },
          BRAND.event,
        ),
      ),
      row(
        { width: width - PAD * 2, alignItems: "center", gap: 44 },
        ringedPhoto(photoDataUri, 330),
        col({ flexGrow: 1 }, glyphBlock(fields.name + fields.title, 11)),
      ),
      col(
        { gap: 22, width: width - PAD * 2 },
        text(
          {
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: nameSize(fields.name, "square"),
            color: COLORS.text,
            lineHeight: 1.04,
            letterSpacing: -1.6,
          },
          fields.name,
        ),
        metaLabel("STACK", fields.stack, 28),
        row({}, titlePill(fields.title, 30)),
      ),
      footer(width - PAD * 2, 26),
    ),
  ]);
}

export async function renderCardSvg(
  photoDataUri: string,
  fields: GenerateFields,
  variant: CardVariant,
): Promise<string> {
  const { width, height } = OUTPUT_SIZES[variant];
  const node = variant === "landscape" ? landscape(photoDataUri, fields) : square(photoDataUri, fields);

  return satori(node as never, {
    width,
    height,
    fonts: loadFonts().map((f) => ({
      name: f.name,
      data: f.data,
      weight: f.weight,
      style: f.style,
    })),
  });
}

export async function renderCardPng(
  photoDataUri: string,
  fields: GenerateFields,
  variant: CardVariant,
): Promise<Buffer> {
  const svg = await renderCardSvg(photoDataUri, fields, variant);
  return rasterize(svg, { width: OUTPUT_SIZES[variant].width });
}
