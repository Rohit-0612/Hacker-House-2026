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
      <Palms
        side="left"
        className="absolute -left-[12vw] bottom-0 h-[88%] w-auto max-w-none opacity-55 sm:-left-[6vw]"
      />
      <Palms
        side="right"
        className="absolute -right-[12vw] bottom-0 h-[88%] w-auto max-w-none opacity-55 sm:-right-[6vw]"
      />

      {/* Depth: a warm glow behind the fold, and a darkening toward the foot so
          long pages don't read as one flat field of green. */}
      <div className="absolute inset-0 bg-[radial-gradient(70%_45%_at_50%_18%,rgba(247,224,23,0.10),transparent_70%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_55%,rgba(8,42,17,0.45))]" />

      {/* Print texture, now covering the whole document rather than one band. */}
      <div className="scanlines absolute inset-0" />
      <div className="grain absolute inset-0" />
    </div>
  );
}
