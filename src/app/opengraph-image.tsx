import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { BRAND, COLORS } from "@/lib/brand";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${BRAND.eventFull} — ${BRAND.dates}`;

/**
 * The landing page's share card.
 *
 * Fonts are read off disk as buffers rather than fetched: `/` is static, so this
 * runs at build time, but a network call in an image route is the kind of thing
 * that works locally and times out in a lambda. `next.config.ts` declares the
 * directory in `outputFileTracingIncludes` — Next's tracer cannot see through
 * `fs.readFileSync`, and without it every glyph renders blank in production.
 *
 * Playfair Display now ships from Google as a *variable* font only, and satori's
 * parser throws on its `fvar` table mid-build. Playfair Display SC is the same
 * design with static instances, and its uppercase is identical to Playfair
 * Display's — which is all this all-caps wordmark uses.
 */
const fontsDir = path.join(process.cwd(), "src", "assets", "fonts");
const anton = fs.readFileSync(path.join(fontsDir, "Anton-Regular.ttf"));
const playfair = fs.readFileSync(path.join(fontsDir, "PlayfairDisplaySC-Bold.ttf"));

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: COLORS.jungle,
          position: "relative",
        }}
      >
        {/* Sun disc behind the wordmark. */}
        <div
          style={{
            position: "absolute",
            top: 150,
            width: 380,
            height: 380,
            borderRadius: 190,
            backgroundColor: COLORS.lemon,
            opacity: 0.16,
            display: "flex",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              fontFamily: "Playfair",
              fontSize: 128,
              color: COLORS.lemon,
              lineHeight: 0.86,
              letterSpacing: "-0.02em",
              display: "flex",
            }}
          >
            HACKER
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 4 }}>
            <div
              style={{
                fontFamily: "Playfair",
                fontSize: 128,
                color: COLORS.lemon,
                lineHeight: 0.86,
                letterSpacing: "-0.02em",
                display: "flex",
              }}
            >
              HOUSE
            </div>
            <div
              style={{
                fontFamily: "Anton",
                fontSize: 34,
                letterSpacing: "0.14em",
                color: COLORS.paper,
                backgroundColor: COLORS.magenta,
                padding: "12px 22px",
                borderRadius: 30,
                display: "flex",
              }}
            >
              GOA
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 46,
            fontFamily: "Anton",
            fontSize: 30,
            letterSpacing: "0.24em",
            color: COLORS.paper,
            display: "flex",
          }}
        >
          {BRAND.location} · {BRAND.dates}
        </div>

        <div
          style={{
            marginTop: 20,
            fontFamily: "Anton",
            fontSize: 22,
            letterSpacing: "0.2em",
            color: COLORS.gold,
            display: "flex",
          }}
        >
          {BRAND.passName} GENERATOR
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 20,
            backgroundColor: COLORS.magenta,
            display: "flex",
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Anton", data: anton, style: "normal", weight: 400 },
        { name: "Playfair", data: playfair, style: "normal", weight: 400 },
      ],
    },
  );
}
