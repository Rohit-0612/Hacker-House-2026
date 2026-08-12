import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/** Only the two public pages; share pages are per-user and noindex. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), changeFrequency: "monthly", priority: 1 },
    { url: absoluteUrl("/create"), changeFrequency: "monthly", priority: 0.8 },
  ];
}
