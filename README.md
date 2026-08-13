# Hacker House Goa 2026

A single-page site for **HH Goa 2026** with a **Builder Baggage Label** generator: upload one photo,
crop it, get a share-ready event pass drawn entirely in your browser.

| Output | Size | Purpose |
| --- | --- | --- |
| **Builder Baggage Label** | 3200×1800 PNG | A vintage luggage tag, built to be posted as an image |
| **PFP Frame** | 1022×1024 PNG | The event's circular frame, composited around your photo |
| **Share board** | 2400×1260 JPEG | The 1.91:1 mount `og:image` points at |

No login, no signup, no queue. Upload → crop → generate → download or share.

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

---

## Architecture

### The pass is drawn on the client

```
photo file
  │
  ├─ [browser]  HEIC? ──lazy import──> heic-to (WASM) ──> JPEG
  ├─ <img> decode          EXIF orientation applied by the browser
  ├─ halving downscale     capped at 2000px on the long edge
  ├─ react-image-crop      selection kept as percentages
  │
  └─ paint  →  offscreen <canvas> at export resolution
       ├─ PNG  toBlob()     → download · navigator.share({ files })
       └─ JPEG share board  → POST /api/pass → Vercel Blob → /pass/[id] → og:image
```

**The user's photo never reaches the server** unless they explicitly ask for a share link. There is
no render endpoint, no native module, and no cold start between clicking Generate and seeing a pass —
the paint takes ~50ms, and the boarding overlay exists to slow it *down*.

The painters (`src/lib/pass/draw-*.ts`) work in a fixed logical space — 1600×900 for the label, and
the supplied frame's own size for the PFP — and the caller pre-scales the context. One function therefore produces both
the on-screen preview and the 3200px export, and the preview is literally the same pixels as the
download, shown through an object URL.

### Three things that bite when you draw on a canvas

- **Fonts must be loaded before the first `fillText`.** Canvas2D has no fallback story: hand it a
  family the document hasn't finished loading and it silently substitutes a system face, with no
  error anywhere. `src/lib/pass/fonts.ts` awaits every family/weight up front. The Devanagari face is
  probed with the actual string `गोवा`, because `document.fonts.load` only tests Latin sample text by
  default and would otherwise report a font that can't draw the glyphs as ready.
- **EXIF is handled by `<img>`, not a metadata parser.** Browsers apply EXIF orientation to `<img>`
  automatically, so iPhone photos come out upright for free. `createImageBitmap` can do the same, but
  its `imageOrientation` option is *silently ignored* where unsupported — which fails as sideways
  photos rather than as an error.
- **Downscaling happens in halving passes.** One `drawImage` from 4000px to 500px samples far too
  sparsely and comes out crunchy.

### Assets

Two pieces of supplied artwork drive the look, both derived by
`scripts/prepare-assets.py` from `pfp1/`:

- **`public/pfp-frame.webp`** — the circular PFP frame, cropped to its alpha bounding box. The photo
  is registered into the opening at a centre of (0.5024, 0.5244) and radius 0.2874 of the frame's
  width, measured from the asset rather than guessed; the opening is slightly *below* centre, which
  is not something you would eyeball. It is drawn at 1:1 so the line work stays crisp, and the export
  size follows the asset.
- **`public/palms-{left,right}.webp`** — palm clusters cropped from the event artwork.

The palms are **opaque rectangles, not cut-outs**, and deliberately so: the fronds are filled with
the same green as the background (measured colour distance: **2**), so chroma-keying would punch
holes through every leaf. Instead the crops sit on a matching page ground and their inner edges are
feathered to alpha, which hides the rectangle without needing an exact colour match. The crop windows
also stop at row 1145 and column 2640 — the source is a screenshot of the whole footer, and a wider
cut catches the copyright line and a UI widget.

### Share to X

X's web intent **cannot attach an image**, so there are two paths and the app ships both:

1. **Mobile (primary)** — `navigator.share({ files: [png] })` attaches the *real PNG* to the X app.
   Feature-detected via `navigator.canShare({ files })`.
2. **Desktop (fallback)** — the PNG is stored in Vercel Blob and `/pass/[id]` is a page whose
   `generateMetadata()` emits `og:image` + `twitter:card=summary_large_image` pointing at it. The
   intent URL carries that link, so X unfurls a card showing the actual pass.

Three details that are easy to get wrong:

- **The share id is minted in the browser, before painting.** That's what lets the QR code on the
  pass encode the pass's own share URL — scanning a printed ticket lands on the page that shows it.
  `/api/pass` validates the id against `SHARE_ID_PATTERN` and refuses to overwrite an existing
  record, so a client-supplied id can't reach a blob key unchecked or clobber someone else's pass.
- **Share on X is a real link, not a scripted popup.** The publish is prefetched on hover/focus, so
  by click time the `<a href>` already carries the intent URL and the browser performs an ordinary
  navigation — nothing for a popup blocker to weigh up. Only when the link isn't ready yet does it
  fall back to claiming a tab synchronously on click, because `window.open()` after an `await` is
  swallowed by iOS Safari.
- **Nothing downloads unannounced.** A failed publish says so; the download stays on the user's own
  button. Silently handing someone a file when they asked to share is what made this look broken.
  For the same reason `Share pass` is feature-gated on `navigator.canShare({files})` and renders as
  `Download pass` where there is no share sheet.

Storage backend is chosen at runtime in `src/lib/store/index.ts`:

| Situation | Backend | Share links |
| --- | --- | --- |
| `BLOB_READ_WRITE_TOKEN` set (production) | Vercel Blob | Yes — absolute CDN URLs |
| Local dev, no token | Filesystem under `.next/cache/shares/` | Yes — served by `/api/pass-asset/[id]/[variant]` |
| On Vercel, no token | none | No — the UI says so instead of downloading |

**Only one object is stored per share** — the JPEG board, ~250KB. The full-resolution PNG is the
user's download and never needed uploading, and JPEG over PNG is another ~65%. Together that is
roughly 1.5MB → 250KB per share, which is what keeps this inside the Blob free tier.

> A share link can only be *verified* on a public URL: X cannot fetch `http://localhost:3000/pass/…`
> to read its `og:image`. The result panel says as much when the origin is local.

The local store exists so `/pass/[id]` and its OG tags are testable with **zero environment
variables**. It is deliberately gated on `!process.env.VERCEL`: serverless filesystems are
per-instance and ephemeral, so a share link would resolve on the instance that wrote it and 404 on
every other one, and intermittently broken links are worse than no links.

**The app never hard-fails on a missing env var** — download and mobile Web Share work in all three
rows above.

### One backdrop, so the scroll has nothing to seam on

Decoration used to live inside each section, which cannot blend: an image ends where the image ends,
drawing a hard horizontal line mid-scroll, and a texture applied to one section stops dead at its
boundary. Both were visible. `src/components/site/Backdrop.tsx` pins the palms and the print textures
to the viewport instead, so their feathered edges sit permanently at the screen edges and no section
boundary can cut anything. Sections paint no background of their own.

### Animation is not allowed to hide content

Entrance reveals are **CSS animations, not JS**. Framer Motion serialises an `initial` state into the
SSR'd HTML, so `initial={{ y: "110%" }}` on the hero ships an invisible `<h1>` that only appears once
hydration finishes — and the Journey boards, gated on `whileInView`, could render as an empty gap if
the observer was late. CSS reveals fire on paint, cannot fail open, and get `prefers-reduced-motion`
free from the media query in `globals.css`.

For the same reason **no component branches on `useReducedMotion()` in what it renders**: the hook
reads a media query, so it is always `false` during SSR and can be `true` on the client, which is a
hydration mismatch that re-renders the whole tree. `<MotionConfig reducedMotion="user">` in the root
layout handles it downstream of render instead. Framer is used only for scroll parallax and
interaction — things that are additive if they never run.

---

## Project structure

```
src/
  app/
    page.tsx                 the whole site — hero → stats → journey → generator
    pass/[id]/page.tsx       share page — generateMetadata() → og:image
    opengraph-image.tsx      landing share card (next/og, prerendered at build)
    api/pass/route.ts        publishes a finished pass to storage
    api/pass-asset/…         serves the dev-only local store
  components/
    landing/                 Hero · Stats · Journey · Motifs
    generator/               Generator · PhotoStep · BoardingOverlay · PassResult
    site/                    Nav · Footer · Motion
    ui/                      Button · Field · Spinner
  lib/
    pass/                    the canvas engine
      draw-pass · draw-pfp · draw-og      the three painters
      primitives                          roundRect · tracking · arc text · guilloché · halftone
      identity                            deterministic ticket no / PNR / seat / coach
      photo · qr · fonts
    brand.ts                 palette + event copy — shared by the site and the PNGs
    share.ts  upload.ts  store/  site.ts  validate.ts  rate-limit.ts
  assets/fonts/              Anton + Playfair Display SC, for the OG image only
fixtures/                    sample photos: portrait, landscape, off-centre, EXIF-rotated, undersized
```

### Fonts

The site and the canvas both use `next/font/google` (Playfair Display, Anton, JetBrains Mono,
Baloo 2), self-hosted at build time. Canvas code asks for them via `font.style.fontFamily`, because
`next/font` rewrites every family to a hashed name.

Two TTFs are vendored in `src/assets/fonts/` for the **OG image only**, which runs through satori and
needs font buffers. Note that Playfair Display now ships from Google as a *variable* font, and
satori's parser throws on its `fvar` table mid-build — Playfair Display SC is the same design with
static instances, and its uppercase is identical, which is all the all-caps wordmark uses.
`next.config.ts` declares the directory in `outputFileTracingIncludes`; Next's tracer cannot see
through `fs.readFileSync`, and without it every glyph renders blank in production.

> Baloo **2** is the Devanagari cut of that family. Baloo Bhai 2 / Paaji 2 / Da 2 are Gujarati,
> Gurmukhi and Bengali, and render `गोवा` as tofu.

---

## Environment variables

Both are **optional**.

| Variable | Required | Effect |
| --- | --- | --- |
| `BLOB_READ_WRITE_TOKEN` | No | Enables `/pass/[id]` share pages with real OG previews. Injected automatically on Vercel once a Blob store is connected. |
| `NEXT_PUBLIC_SITE_URL` | No | Absolute origin for OG tags and share links. Derived from `VERCEL_PROJECT_PRODUCTION_URL` on Vercel; set it only for a custom domain. |

Copy `.env.example` to `.env.local` to set them locally.

---

## Deploying to Vercel

```bash
vercel          # preview deploy
vercel --prod   # production
```

**To make X link previews work:**

1. In the Vercel dashboard: **Storage → Create → Blob**.
2. Connect the store to this project.
3. Redeploy. `BLOB_READ_WRITE_TOKEN` is injected automatically.

Verify a deploy with:

```bash
curl -I https://<your-deploy>/opengraph-image          # expect 200 image/png
curl -s https://<your-deploy>/ | grep 'og:image'       # expect an absolute URL
```

`/create` and `/s/:id` from the previous version redirect to `/#pass` and `/pass/:id`.

### Notes

- `/api/pass` runs on the **Node.js runtime** and only moves bytes into storage — it never renders.
- Blob objects are served from **public URLs**. Share pages are `noindex`, but a published pass is
  reachable by anyone holding its link — worth knowing before sharing a photo of yourself.
- `/api/pass` has a small per-instance rate limit (20/min/IP). It's a hammering guard, not a quota.

---

## What was verified

Driven in a real Chrome over the DevTools protocol, at 1440px and at 390px:

- Full journey — pick a photo, crop, fill the form, generate, result — for **both** formats, with
  **zero console errors** and **0px horizontal overflow** at 390px.
- Real images at exactly 3200×1800, 1022×1024 and 2400×1260; the preview is byte-identical to the
  download by construction.
- **Share on X publishes and opens an intent carrying `url=`, with no download triggered** — asserted
  over CDP with `Browser.setDownloadBehavior: deny` and a download listener.
- The stored object is `og.jpg` at ~290KB, down from ~1.5MB of PNGs per share.
- Text renders from the intended faces, including `गोवा`, rather than a system fallback.
- EXIF-rotated (iPhone-style) photos come out upright; portrait, landscape and off-centre fixtures
  crop without distortion; undersized and non-image files are refused with a readable message.
- **Share chain proven end to end** against a live Vercel Blob store: generate → `POST /api/pass` →
  `/pass/[id]` → `og:image` → fetching that URL returns a real PNG, with
  `twitter:card=summary_large_image` and an absolute image URL.
- `/api/pass` rejects a duplicate id (409) and a path-traversal id (400).
- No hydration mismatches; the hero and the schedule render with JS animation disabled entirely.

### Known limitation

**Server-side HEIC decoding does not exist here at all** — there is no server-side image pipeline.
HEIC is converted to JPEG in the browser before anything else touches it (`src/lib/heic.ts`), which
is the path real users take.

---

## Accessibility

Keyboard-navigable throughout (the dropzone is a real `<button>`), visible focus rings, labelled
fields with `aria-describedby` errors, `aria-live` status updates, focus moved to the result heading
after generating, `prefers-reduced-motion` honoured across all animation, and ≥44px touch targets
(including enlarged crop handles on coarse pointers).

---

## Licence

Fonts: [Anton](https://github.com/googlefonts/AntonFont),
[Playfair Display](https://github.com/clauseggers/Playfair-Display),
[JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) and
[Baloo 2](https://github.com/EkType/Baloo2), all SIL Open Font License 1.1.
