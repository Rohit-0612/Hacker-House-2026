import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Without this, Turbopack walks up to the home directory looking for a
  // workspace root and warns about pulling in unrelated files.
  turbopack: { root: path.resolve() },

  // sharp and resvg ship prebuilt native binaries. Webpack must not try to bundle
  // them or the .node files get mangled and the route 500s at runtime.
  serverExternalPackages: ["sharp", "@resvg/resvg-js"],

  // The generator reads .ttf files off disk at request time. Next's tracer cannot
  // see through fs.readFileSync, so the fonts are declared explicitly — without
  // this they are missing from the serverless bundle and every glyph renders
  // blank in production while working perfectly in local dev.
  outputFileTracingIncludes: {
    "/api/generate": ["./src/assets/fonts/**/*.ttf"],
    "/api/og": ["./src/assets/fonts/**/*.ttf"],
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
