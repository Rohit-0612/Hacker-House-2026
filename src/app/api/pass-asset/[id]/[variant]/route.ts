import { readLocalImage } from "@/lib/store/local";

export const runtime = "nodejs";

/**
 * Serves PNGs held by the dev-only local share store, so `og:image` resolves
 * without a Blob token. Both path segments are validated inside readLocalImage
 * before any filesystem access — they arrive straight from the URL.
 *
 * In production the Blob store returns absolute CDN URLs and this route is
 * never reached.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; variant: string }> },
): Promise<Response> {
  const { id, variant } = await params;
  const image = await readLocalImage(id, variant);

  if (!image) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(image.bytes), {
    headers: {
      "Content-Type": image.contentType,
      "Content-Length": String(image.bytes.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
