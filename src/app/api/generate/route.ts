import { NextResponse } from "next/server";
import { getShareStore, newShareId, type ShareRecord } from "@/lib/store";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { renderCardPng } from "@/lib/render/card";
import { PhotoError, processPhoto } from "@/lib/render/photo";
import { renderPfpSvg } from "@/lib/render/pfp";
import { rasterize } from "@/lib/render/rasterize";
import {
  OUTPUT_SIZES,
  type ApiError,
  type GenerateFields,
  type GeneratedImage,
  type GenerateResult,
} from "@/lib/types";
import { MAX_FILE_BYTES, fieldsSchema, formatSchema, sanitizeText } from "@/lib/validate";

// sharp and resvg are native modules; neither runs on the edge runtime.
export const runtime = "nodejs";
// Declared here rather than in vercel.json: as segment config Vercel clamps it
// to whatever the account's plan allows, where a vercel.json `functions` entry
// exceeding the plan limit fails the deployment outright.
export const maxDuration = 30;

/** Photo is downscaled to roughly its on-canvas size before being inlined as a
 *  data URI. Inlining a full-resolution original is the difference between a
 *  ~1s render and an out-of-memory lambda. */
const PHOTO_SIZE = { pfp: 900, card: 560 } as const;

function fail(code: ApiError["code"], error: string, status = 400): NextResponse<ApiError> {
  return NextResponse.json({ error, code }, { status });
}

export async function POST(request: Request): Promise<NextResponse> {
  const started = Date.now();

  const limit = rateLimit(clientKey(request.headers));
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many generations. Give it a minute.", code: "render_failed" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("no_file", "That upload didn't come through. Try again.");
  }

  const file = form.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return fail("no_file", "Pick a photo to get started.");
  }
  if (file.size > MAX_FILE_BYTES) {
    return fail("too_large", "That photo is over the 10MB limit. Try a smaller one.");
  }

  const parsedFormat = formatSchema.safeParse(form.get("format"));
  if (!parsedFormat.success) {
    return fail("bad_fields", "Pick either the PFP frame or the ID card.");
  }
  const format = parsedFormat.data;

  // Fields are only meaningful for the ID card; the PFP carries no user text.
  let fields: GenerateFields | null = null;
  if (format === "card") {
    const parsed = fieldsSchema.safeParse({
      name: sanitizeText(String(form.get("name") ?? ""), 28),
      stack: sanitizeText(String(form.get("stack") ?? ""), 32),
      title: sanitizeText(String(form.get("title") ?? ""), 32),
    });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return fail("bad_fields", first?.message ?? "Check the details and try again.");
    }
    fields = parsed.data;
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  // Render
  let pngs: { variant: GeneratedImage["variant"]; png: Buffer }[];
  try {
    if (format === "pfp") {
      const photo = await processPhoto(bytes, PHOTO_SIZE.pfp);
      pngs = [
        {
          variant: "pfp",
          png: rasterize(renderPfpSvg(photo.dataUri), { width: OUTPUT_SIZES.pfp.width }),
        },
      ];
    } else {
      const photo = await processPhoto(bytes, PHOTO_SIZE.card);
      // Both aspect ratios come from one decode; landscape is what X unfurls,
      // square is offered as a second download.
      const [landscape, square] = await Promise.all([
        renderCardPng(photo.dataUri, fields as GenerateFields, "landscape"),
        renderCardPng(photo.dataUri, fields as GenerateFields, "square"),
      ]);
      pngs = [
        { variant: "landscape", png: landscape },
        { variant: "square", png: square },
      ];
    }
  } catch (err) {
    if (err instanceof PhotoError) return fail(err.code, err.message);
    console.error("[generate] render failed", err);
    return fail("render_failed", "Something broke while generating. Try again.", 500);
  }

  // Persist. A durable store is what makes the X link preview show the real
  // graphic; with nowhere to write we hand back inline data URLs so the tool
  // still works, just without the link-share path.
  const inlineImages = (): GeneratedImage[] =>
    pngs.map(({ variant, png }) => ({
      variant,
      url: `data:image/png;base64,${png.toString("base64")}`,
      ...OUTPUT_SIZES[variant],
    }));

  let images: GeneratedImage[];
  let shareId: string | null = null;
  let inline = true;

  const store = getShareStore();
  if (store) {
    try {
      const id = newShareId();
      images = await Promise.all(
        pngs.map(async ({ variant, png }) => ({
          variant,
          url: await store.putImage(id, variant, png),
          ...OUTPUT_SIZES[variant],
        })),
      );
      const record: ShareRecord = {
        id,
        format,
        fields,
        images,
        createdAt: new Date().toISOString(),
      };
      await store.putRecord(record);
      shareId = id;
      inline = false;
    } catch (err) {
      // Storage is a share enhancement, never a reason to lose the user's image.
      console.error(`[generate] ${store.kind} store failed, falling back to inline`, err);
      images = inlineImages();
    }
  } else {
    images = inlineImages();
  }

  const result: GenerateResult = {
    format,
    images,
    fields,
    shareId,
    inline,
    elapsedMs: Date.now() - started,
  };

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store", "Server-Timing": `generate;dur=${result.elapsedMs}` },
  });
}
