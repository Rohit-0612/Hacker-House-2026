import { Palms } from "@/components/landing/Motifs";

/**
 * The page's decoration, in one fixed layer.
 *
 * Decoration used to live inside each section, which cannot blend: an image
 * ends where the image ends, drawing a hard horizontal line mid-scroll, and a
 * texture applied to one section stops dead at its boundary. Both were visible.
 *
 * Pinning it to the viewport instead means the palms' feathered top and bottom
 * edges sit permanently at the screen edges, and no section boundary can cut
 * anything. The page scrolls over a single continuous ground.
 */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Anchored to the foot of the viewport and held to a share of its width,
          so they frame the page rather than crowding the wordmark. */}
      {/* On phones the palms are *cropped* to a tall narrow column rather than
          scaled down. Scaling by width capped their height too — they ended up
          squashed into the bottom third with dead green above — while scaling by
          height made each one wider than half the viewport, so the pair tangled
          in the middle. object-cover decouples the two: full height, narrow
          footprint. `object-bottom` keeps the trunks anchored to the foot. */}
      <Palms
        side="left"
        className="absolute -left-[9vw] top-0 w-[52vw] max-w-none opacity-70 sm:-left-[6vw] sm:top-auto sm:bottom-0 sm:h-[88%] sm:w-auto sm:opacity-55"
      />
      <Palms
        side="right"
        className="absolute -right-[9vw] top-0 w-[52vw] max-w-none opacity-70 sm:-right-[6vw] sm:top-auto sm:bottom-0 sm:h-[88%] sm:w-auto sm:opacity-55"
      />

      {/* Depth. Without these the areas the palms don't reach read as one flat
          field of green — most obvious on a phone, where the trees only cover
          the top third. A warm glow behind the wordmark, a horizon lift through
          the middle, and a vignette into the foot. */}
      <div className="absolute inset-0 bg-[radial-gradient(65%_42%_at_50%_22%,rgba(247,224,23,0.14),transparent_72%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_55%_at_50%_78%,rgba(247,224,23,0.07),transparent_70%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(8,42,17,0.28),transparent_28%,transparent_58%,rgba(8,42,17,0.55))]" />

      {/* Print texture, now covering the whole document rather than one band. */}
      <div className="scanlines absolute inset-0" />
      <div className="grain absolute inset-0" />
    </div>
  );
}
