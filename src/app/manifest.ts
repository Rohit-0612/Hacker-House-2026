import type { MetadataRoute } from "next";
import { BRAND, COLORS } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.eventFull} — ${BRAND.passName}`,
    short_name: BRAND.event,
    description: BRAND.tagline,
    start_url: "/#pass",
    display: "standalone",
    background_color: COLORS.jungleDeep,
    theme_color: COLORS.jungleDeep,
    orientation: "portrait",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
