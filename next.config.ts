import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Without this, Turbopack walks up to the home directory looking for a
  // workspace root and warns about pulling in unrelated files.
  turbopack: { root: path.resolve() },

  // The OG image reads .ttf files off disk. Next's tracer cannot see through
  // fs.readFileSync, so they are declared explicitly — without this they are
  // missing from the bundle and every glyph renders blank in production while
  // working perfectly in local dev.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./src/assets/fonts/**/*.ttf"],
  },

  // The previous deploy shipped /create and /s/[id]; anything already posted
  // should land somewhere useful rather than on a 404.
  async redirects() {
    return [
      { source: "/create", destination: "/#pass", permanent: false },
      { source: "/s/:id", destination: "/pass/:id", permanent: false },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
