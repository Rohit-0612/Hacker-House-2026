import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Individual builder cards are unlisted, not secret — they should be
      // fetchable by X's unfurler but never indexed. The pages also carry
      // robots: noindex in their own metadata.
      disallow: ["/s/", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
