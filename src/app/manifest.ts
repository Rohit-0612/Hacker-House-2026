import type { MetadataRoute } from "next";
import { BRAND, COLORS } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `Frame In Goa — ${BRAND.event}`,
    short_name: "Frame In Goa",
    description: BRAND.tagline,
    start_url: "/create",
    display: "standalone",
    background_color: COLORS.night,
    theme_color: COLORS.night,
    orientation: "portrait",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
