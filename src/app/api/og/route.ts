import { renderBrandOgPng } from "@/lib/render/og";

export const runtime = "nodejs";
// Static across deploys — let the CDN keep it.
export const revalidate = 86400;

export async function GET(): Promise<Response> {
  const png = await renderBrandOgPng();

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
    },
  });
}
