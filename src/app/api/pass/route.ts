import { NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { absoluteUrl } from "@/lib/site";
import { getShareStore, isValidShareId, storeUsesRelativeUrls, type ShareRecord } from "@/lib/store";
import { extensionFor, type ImageContentType } from "@/lib/store/types";
import { OUTPUT_SIZES, type ApiError, type PassFields, type PassIdentity, type ShareImage } from "@/lib/types";
import { fieldsSchema, formatSchema, MAX_UPLOAD_BYTES, sanitizeText } from "@/lib/validate";

// Buffer and the Blob SDK are Node APIs; the edge runtime won't do.
export const runtime = "nodejs";
export const maxDuration = 30;

function fail(code: ApiError["code"], error: string, status = 400): NextResponse<ApiError> {
  return NextResponse.json({ error, code }, { status });
}

/**
 * Publishes an already-drawn pass so `/pass/[id]` has something for `og:image`.
 *
 * The artwork arrives finished — this route never renders. That is the whole
 * point of drawing on the client: no native modules, no cold start, and the
 * user's photo only crosses the network when they ask to share a link.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const limit = rateLimit(clientKey(request.headers));
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many shares. Give it a minute.", code: "failed" } satisfies ApiError,
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("no_image", "That upload didn't come through. Try again.");
  }

  // The id is minted in the browser before painting, so the QR on the pass can
  // encode this very URL. It still has to be validated before it reaches a blob
  // key or a filesystem path.
  const id = String(form.get("id") ?? "");
  if (!isValidShareId(id)) return fail("bad_id", "That pass id isn't valid.");

  const parsedFormat = formatSchema.safeParse(form.get("format"));
  if (!parsedFormat.success) return fail("bad_fields", "Unknown pass format.");
  const format = parsedFormat.data;

  // One image only: the 1.91:1 share board. The full-resolution artwork stays in
  // the user's browser as their download.
  const share = form.get("share");
  if (!(share instanceof File) || share.size === 0) {
    return fail("no_image", "The pass image was missing from that upload.");
  }
  if (share.size > MAX_UPLOAD_BYTES) {
    return fail("too_large", "That pass image is larger than we accept.");
  }

  const contentType = extensionFor(share.type) ? (share.type as ImageContentType) : null;
  if (!contentType) {
    return fail("bad_fields", "That image format isn't supported.");
  }

  const fields = parseFields(form.get("fields"));
  if (!fields) return fail("bad_fields", "The pass details didn't come through.");

  const identity = parseIdentity(form.get("identity"));
  if (!identity) return fail("bad_fields", "The ticket data didn't come through.");

  const store = getShareStore();
  if (!store) {
    return fail(
      "no_store",
      "Link sharing isn't configured on this deployment. Download the pass and post it directly.",
      503,
    );
  }

  // Ids are client-minted, so refuse to overwrite one that already exists rather
  // than letting a collision (or a replay) clobber someone else's pass.
  if (await store.getRecord(id)) {
    return fail("exists", "That pass has already been published.", 409);
  }

  try {
    const ogUrl = await store.putImage(
      id,
      "og",
      Buffer.from(await share.arrayBuffer()),
      contentType,
    );

    const images: ShareImage[] = [{ variant: "og", url: ogUrl, ...OUTPUT_SIZES.og }];

    const record: ShareRecord = {
      id,
      format,
      fields,
      identity,
      images,
      createdAt: new Date().toISOString(),
    };
    await store.putRecord(record);

    // The dev-only local store hands back app-relative URLs; the client needs
    // absolute ones to put in a tweet.
    const relative = storeUsesRelativeUrls(store);
    return NextResponse.json(
      {
        shareUrl: absoluteUrl(`/pass/${id}`),
        imageUrl: relative ? absoluteUrl(ogUrl) : ogUrl,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[pass] store failed", err);
    return fail("failed", "We couldn't publish that pass. Download it and post it directly.", 500);
  }
}

function parseFields(raw: FormDataEntryValue | null): PassFields | null {
  try {
    const value = JSON.parse(String(raw ?? "")) as Record<string, unknown>;
    const parsed = fieldsSchema.safeParse({
      name: sanitizeText(String(value.name ?? ""), 24),
      team: sanitizeText(String(value.team ?? ""), 24),
      role: sanitizeText(String(value.role ?? ""), 26),
      city: sanitizeText(String(value.city ?? ""), 20),
    });
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Echoed back on the share page, so it gets the same scrubbing as the fields. */
function parseIdentity(raw: FormDataEntryValue | null): PassIdentity | null {
  try {
    const value = JSON.parse(String(raw ?? "")) as Record<string, unknown>;
    const keys = ["ticketNo", "builderId", "pnr", "seat", "coach", "platform"] as const;
    const out = {} as PassIdentity;

    for (const key of keys) {
      const clean = sanitizeText(String(value[key] ?? ""), 24);
      if (!clean) return null;
      out[key] = clean;
    }
    return out;
  } catch {
    return null;
  }
}
