/**
 * Flat line-art motifs from the event's illustration set.
 *
 * Inline SVG rather than images: they are recoloured per section via
 * `currentColor`, they scale to any viewport without a second asset, and they
 * cost nothing on the network.
 */

/**
 * The event's own palm artwork, cropped out of the supplied illustration.
 *
 * These are opaque rectangles, not cut-outs: the fronds are filled with the same
 * green as their background, so keying them transparent would punch holes
 * through every leaf. Instead the crops sit on a matching page ground and their
 * inner edges are feathered to alpha (see scripts/prepare-assets.py), which
 * makes the rectangle boundary disappear.
 */
export function Palms({ side, className }: { side: "left" | "right"; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/palms-${side}.webp`}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      className={className}
    />
  );
}

export function Sun({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 140" fill="none" aria-hidden className={className}>
      <path d="M40 132a80 80 0 0 1 160 0Z" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="5" strokeLinecap="round">
        <path d="M120 4v22M64 20l10 20M176 20l-10 20M20 60l20 10M220 60l-20 10M6 108h22M212 108h22" />
      </g>
    </svg>
  );
}

export function Waves({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 80" fill="none" aria-hidden className={className} preserveAspectRatio="none">
      <g stroke="currentColor" strokeWidth="4" strokeLinecap="round">
        <path d="M0 20q25-18 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0 50 0 50 0 50 0" />
        <path d="M0 46q25-18 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0 50 0 50 0 50 0" />
        <path d="M0 72q25-18 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0 50 0 50 0 50 0" />
      </g>
    </svg>
  );
}

/** The magenta asterisk-flower that punctuates the brand's artwork. */
export function Asterisk({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="currentColor" aria-hidden className={className}>
      {Array.from({ length: 8 }, (_, i) => (
        <ellipse key={i} cx="20" cy="8" rx="4.4" ry="9" transform={`rotate(${i * 45} 20 20)`} />
      ))}
      <circle cx="20" cy="20" r="4.4" />
    </svg>
  );
}

/** The 2:47 PM Studio mark that sits top-left on the event site. */
export function StudioMark({ className }: { className?: string }) {
  return (
    <span className={className}>
      <span className="block font-condensed text-xl leading-none tracking-tight">2:47</span>
      <span className="block font-mono text-[0.55rem] leading-none tracking-[0.3em]">STUDIO</span>
    </span>
  );
}

/**
 * The magenta गोवा badge dropped into the wordmark.
 *
 * The line-height is explicit and generous on purpose. Devanagari ink sits well
 * above the em box — the शिरोरेखा headline and the ो matra both do — so
 * `leading-none` let the glyphs overflow the pill and get sliced by its top
 * edge. Padding alone doesn't fix it; the line box has to be tall enough first.
 */
export function GoaBadge({ className, ...rest }: React.ComponentPropsWithoutRef<"span">) {
  return (
    <span
      {...rest}
      className={`inline-grid -rotate-6 place-items-center rounded-[0.62em] border-[0.07em] border-ink bg-magenta px-[0.42em] pt-[0.1em] pb-[0.16em] font-deva text-lemon leading-[1.32] shadow-[0.06em_0.07em_0_var(--color-ink)] ${className ?? ""}`}
    >
      गोवा
    </span>
  );
}
