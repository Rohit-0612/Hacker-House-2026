import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/** One public page; individual passes are per-user and noindex. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: absoluteUrl("/"), changeFrequency: "monthly", priority: 1 }];
}
