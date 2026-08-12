# Frame In Goa

**Live: https://hh-goa-2026-seven-iota.vercel.app**

Upload one photo, get a branded **HH Goa 2026** graphic that's ready to download and post on X.

Built for the HH Goa 2026 shortlisting task. Both formats from the brief are implemented:

| Format | Output | Purpose |
| --- | --- | --- |
| **PFP Frame** | 1000×1000 PNG | Circular frame for an X profile picture |
| **Builder ID Card** | 1200×630 + 1080×1080 PNG | Event badge built to be posted as an image |

No login, no signup, no watermark queue. Upload → preview → generate → download or share.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

No environment variables are needed to run it. See [Environment variables](#environment-variables)
for what unlocks the link-share path.

```bash
npm run build && npm run start   # production build
npm run typecheck                # tsc --noEmit
npm run lint                     # eslint
```

**Requires Node 20.9+** (`sharp` and `@resvg/resvg-js` ship prebuilt native binaries).

---

## Architecture

### Why the render pipeline is split in two

The obvious approach — compose everything in `sharp` by overlaying an SVG containing text —
**fails in serverless production**. `sharp`'s SVG text rendering depends on system
fontconfig/pango, which isn't present on Vercel. Text silently renders blank or in a fallback
face, and it works perfectly on your laptop the whole time.

So responsibilities are split by what each tool is actually good at:

```
upload
  │
  ├─ [browser]  HEIC? ──lazy import──> heic-to (WASM) ──> JPEG
  │
  └─ POST /api/generate  (multipart)
       │
       ├─ [sharp]   decode · EXIF auto-rotate · smart crop · downscale · re-encode
       │              position: sharp.strategy.attention
       │              → compact base64 data URI
       │
       ├─ compose
       │    ├─ PFP  → hand-authored SVG        (src/lib/render/pfp.ts)
       │    └─ card → satori flexbox layout    (src/lib/render/card.ts)
       │
       ├─ [resvg]   SVG → PNG, fonts supplied as buffers
       │
       └─ [blob]    store PNG + share record → /s/[id]
```

- **`sharp` never touches text.** It does EXIF rotation, saliency-based cropping and scaling.
- **`satori`** lays out the ID card. Names and stacks are arbitrary user strings, so the card
  needs real text measurement, wrapping and truncation — that's a flexbox engine's job.
- **The PFP frame is hand-written SVG**, not satori, because its defining detail — `HH GOA 2026`
  curved along the ring — needs `<textPath>`, which a flexbox engine cannot express.
- **`resvg`** rasterizes with `loadSystemFonts: false` and explicit font buffers, so local output
  is byte-comparable to production instead of accidentally borrowing an installed font.

The photo is downscaled to roughly its on-canvas size *before* being inlined as a data URI.
Inlining a 12MP original is the difference between a ~1s render and an out-of-memory function.

### Handling real photos

The brief is explicit that users won't crop first. Concretely:

- **`.rotate()`** applies EXIF orientation. iPhone photos store pixels sideways with an
  orientation flag; skipping this is the classic "why is everyone sideways" bug.
- **`fit: "cover"`** scales and crops rather than squashing — nothing distorts.
- **`sharp.strategy.attention`** picks the crop window by saliency instead of blindly taking the
  centre. On a landscape shot with the subject off to one side, a centre crop cuts their head in
  half. This gets the subject without shipping a face-detection model.

### Share to X

X's web intent **cannot attach an image**, so there are two paths and the app ships both:

1. **Mobile (primary)** — `navigator.share({ files: [png] })` attaches the *real PNG* to the X
   app. Feature-detected via `navigator.canShare({ files })`.
2. **Desktop (fallback)** — the PNG is stored in Vercel Blob and `/s/[id]` is a page whose
   `generateMetadata()` emits `og:image` + `twitter:card=summary_large_image` pointing at it.
   The intent URL carries that link, so X unfurls a card showing the actual graphic — which is
   the specific "not a blank thumbnail" requirement in the brief.

Storage backend is chosen at runtime in `src/lib/store/index.ts`:

| Situation | Backend | Share links |
| --- | --- | --- |
| `BLOB_READ_WRITE_TOKEN` set (production) | Vercel Blob | Yes — absolute CDN URLs |
| Local dev, no token | Filesystem under `.next/cache/shares/` | Yes — served by `/api/share-asset/[id]/[variant]` |
| On Vercel, no token | none | No — inline `data:` URLs |

The local store exists so `/s/[id]` and its OG tags are testable with **zero environment
variables**; otherwise the brief's headline requirement is unverifiable until after a deploy. It is
deliberately gated on `!process.env.VERCEL`: serverless filesystems are per-instance and ephemeral,
so a share link would resolve on the instance that wrote it and 404 on every other one, and
intermittently broken links are worse than no links.

**The app never hard-fails on a missing env var** — download and mobile Web Share work in all three
rows above.

### Fonts

Vendored as static TTFs in `src/assets/fonts/` and committed — a network fetch in the hot path
would blow the latency budget, and *variable* fonts render at their default instance under
satori's parser (Space Grotesk would come out Light).

`next.config.ts` declares them in `outputFileTracingIncludes`, because Next's tracer cannot see
through `fs.readFileSync`. **Without that, text renders blank in production while working fine
locally** — the single most likely deploy-only failure in this project.

---

## Project structure

```
src/
  app/
    page.tsx                landing (server component; animation in client islands)
    create/page.tsx         the generator flow
    s/[id]/page.tsx         share page — generateMetadata() → og:image
    api/generate/route.ts   the pipeline (runtime = nodejs)
    api/og/route.ts         landing-page OG image
  components/
    landing/                Hero, LivePreview, FeatureCards
    create/                 CreateFlow, Dropzone, FormatPicker, DetailsForm, ResultPanel
    ui/                     Button, Spinner
  lib/
    render/                 photo · pfp · card · og · fonts · rasterize · h (satori hyperscript)
    brand.ts                Sunset Coast palette — shared by the site and the PNGs
    builder-titles.ts       40 curated titles
    blob.ts  share.ts  validate.ts  rate-limit.ts  site.ts
  assets/fonts/             Inter 400/600, Space Grotesk 700
scripts/
  make-fixtures.mjs         synthetic test photos (portrait/landscape/off-centre/EXIF)
  preview.mjs               render the pipeline straight to PNG, no server needed
```

---

## Environment variables

Both are **optional**.

| Variable | Required | Effect |
| --- | --- | --- |
| `BLOB_READ_WRITE_TOKEN` | No | Enables `/s/[id]` share pages with real OG previews. Injected automatically on Vercel once a Blob store is connected. Without it, images come back as inline `data:` URLs. |
| `NEXT_PUBLIC_SITE_URL` | No | Absolute origin for OG tags and share links. Derived from `VERCEL_PROJECT_PRODUCTION_URL` on Vercel; set it only for a custom domain. |

Copy `.env.example` to `.env.local` to set them locally.

---

## Deploying to Vercel

```bash
npm i -g vercel     # or use npx
vercel              # preview deploy
vercel --prod       # production
```

Or import the repo at [vercel.com/new](https://vercel.com/new) — the framework preset is detected
automatically and `vercel.json` supplies the rest.

**To make X link previews work** (recommended — it's an explicit requirement of the brief):

1. In the Vercel dashboard: **Storage → Create → Blob**.
2. Connect the store to this project.
3. Redeploy. `BLOB_READ_WRITE_TOKEN` is injected automatically.

Verify a deploy with:

```bash
curl -I https://<your-deploy>/api/og                     # expect 200 image/png
curl -s https://<your-deploy>/ | grep 'og:image'         # expect an absolute URL
```

If `/api/og` returns an image but text is missing, the fonts didn't make it into the bundle —
check `outputFileTracingIncludes` in `next.config.ts`.

### Notes

- `/api/generate` runs on the **Node.js runtime** (native modules; the edge runtime won't work)
  with 2048MB / 30s configured in `vercel.json`. Typical generation is ~0.5s for a PFP and ~2s
  for a card, which produces both card sizes.
- Blob objects are served from **public URLs**. Share pages are `noindex`, but a generated image
  is reachable by anyone holding its link — worth knowing before sharing a photo of yourself.
- `/api/generate` has a small per-instance rate limit (20/min/IP). It's a hammering guard, not a
  distributed quota.

---

## Local verification

```bash
node scripts/make-fixtures.mjs      # writes fixtures/ — portrait, landscape,
                                    # off-centre, EXIF-rotated, undersized, non-image

node --experimental-strip-types --conditions=react-server \
     --import ./scripts/register.mjs scripts/preview.mjs
                                    # renders real PNGs to preview-out/
```

`preview.mjs` calls the same modules the API route does, so it's the fastest way to iterate on the
artwork without booting Next or clicking through the UI.

### What was verified

- Real PNGs at exactly 1000×1000, 1200×630 and 1080×1080, confirmed by PNG magic bytes and IHDR.
- Text renders from the vendored fonts in a **production build**, not just dev.
- EXIF-rotated (iPhone-style) photos come out upright; off-centre subjects stay uncut.
- Full browser journey on a 390px mobile viewport, both formats, 0px horizontal overflow.
- Real HEVC `.heic` → JPEG in-browser via `heic-to` (~470ms for a 1200×1800 photo).
- Every error path returns a 4xx with a human-readable message: oversized, undersized, non-image,
  missing file, empty fields, bad format, and undecodable HEIC.
- **Share chain proven end to end**: generate → `/s/[id]` → `og:image` → fetch that URL → a real
  1200×630 PNG of the actual card, with `twitter:card=summary_large_image`.
- **0 axe-core violations** (WCAG 2.1 A/AA + best-practice) across `/`, `/create`, both result
  states and `/s/[id]`; focus verifiably lands on the result heading after Generate.
- **Load: 1.66s on emulated Fast-3G with 4× CPU throttling** (FCP 680ms), 348KB transferred. The
  2.9MB libheif decoder is confirmed absent from initial load.
- Path traversal on `/api/share-asset` rejected (`../`, encoded `%2f`, unknown variants → 404).
- Storage selection verified in all three branches, including that the local store never engages
  when `VERCEL` is set.

### Known limitation

**Server-side HEIC decoding is not supported.** `sharp`'s prebuilt binary parses HEIC container
metadata but has no HEVC decoder, so a full decode fails. HEIC is therefore converted to JPEG in
the browser before upload (`src/lib/heic.ts`), which is the path real users take. If a HEIC
somehow reaches the API directly, it returns a clear 400 rather than a 500.

---

## Accessibility

Keyboard-navigable throughout (the dropzone is a real `<button>`, not a click-handled `div`),
visible focus rings, labelled fields with `aria-describedby` errors, `aria-live` status updates,
`prefers-reduced-motion` honoured across all animation, AA contrast on the dark palette, and
≥44px touch targets.

---

## Licence

Fonts: [Inter](https://github.com/rsms/inter) and
[Space Grotesk](https://github.com/floriankarsten/space-grotesk), both SIL Open Font License 1.1.
