import "server-only";

import satori from "satori";
import { BRAND, COLORS } from "../brand";
import { OUTPUT_SIZES } from "../types";
import { loadFonts } from "./fonts";
import { col, h, row, text } from "./h";
import { rasterize } from "./rasterize";

/** Marketing OG card for the landing page — no user photo, just the identity. */
export async function renderBrandOgPng(): Promise<Buffer> {
  const { width, height } = OUTPUT_SIZES.landscape;

  const node = h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        width,
        height,
        padding: 72,
        background: COLORS.night,
        fontFamily: "Inter",
      },
    },
    h("div", {
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        backgroundImage: `radial-gradient(circle at 14% 6%, rgba(123,92,255,0.45) 0%, rgba(123,92,255,0) 48%), radial-gradient(circle at 86% 94%, rgba(255,77,109,0.42) 0%, rgba(255,77,109,0) 55%)`,
      },
    }),
    row(
      { alignItems: "center", gap: 14 },
      h("div", {
        style: {
          width: 40,
          height: 5,
          borderRadius: 9999,
          backgroundImage: `linear-gradient(90deg, ${COLORS.coral}, ${COLORS.amber})`,
        },
      }),
      text(
        {
          fontFamily: "Space Grotesk",
          fontWeight: 700,
          fontSize: 24,
          letterSpacing: 5,
          color: COLORS.text,
        },
        BRAND.event,
      ),
    ),
    col(
      { gap: 22 },
      text(
        {
          fontFamily: "Space Grotesk",
          fontWeight: 700,
          fontSize: 106,
          letterSpacing: -3,
          lineHeight: 1,
          color: COLORS.text,
        },
        "Frame In Goa",
      ),
      text({ fontFamily: "Inter", fontWeight: 400, fontSize: 32, color: COLORS.muted }, BRAND.tagline),
    ),
    row(
      {
        alignItems: "center",
        justifyContent: "space-between",
        borderTop: `1px solid rgba(248,250,252,0.14)`,
        paddingTop: 24,
      },
      text(
        {
          fontFamily: "Space Grotesk",
          fontWeight: 700,
          fontSize: 28,
          backgroundImage: `linear-gradient(90deg, ${COLORS.coral}, ${COLORS.amber})`,
          backgroundClip: "text",
          color: "transparent",
        },
        BRAND.hashtag,
      ),
      text({ fontFamily: "Inter", fontSize: 22, color: COLORS.muted, letterSpacing: 1.4 }, BRAND.coords),
    ),
  );

  const svg = await satori(node as never, {
    width,
    height,
    fonts: loadFonts().map((f) => ({
      name: f.name,
      data: f.data,
      weight: f.weight,
      style: f.style,
    })),
  });

  return rasterize(svg, { width });
}
