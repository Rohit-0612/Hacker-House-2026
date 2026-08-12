/**
 * Absolute origin for the app.
 *
 * OG tags must carry absolute URLs — relative ones are silently dropped by
 * crawlers, which is exactly the "blank thumbnail" failure the brief warns
 * about. VERCEL_PROJECT_PRODUCTION_URL is stable across deploys; VERCEL_URL is
 * the per-deployment hostname and is the sensible preview fallback.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prod) return `https://${prod}`;

  const deployment = process.env.VERCEL_URL;
  if (deployment) return `https://${deployment}`;

  return "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
