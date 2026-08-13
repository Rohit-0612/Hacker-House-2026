import { BRAND, LINKS } from "@/lib/brand";
import { StudioMark } from "@/components/landing/Motifs";

export function Nav() {
  return (
    <header className="absolute inset-x-0 top-0 z-30 px-5 py-5 sm:px-8">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <a href="#main" className="flex items-center gap-3 text-lemon">
          <StudioMark />
          <span className="sr-only">{BRAND.studio}</span>
        </a>

        <div className="flex items-center gap-3 sm:gap-5">
          <a
            href={LINKS.x}
            target="_blank"
            rel="noopener noreferrer"
            className="label hidden text-paper transition-colors hover:text-lemon sm:block"
          >
            Check hype
          </a>
          <a
            href="#pass"
            className="inline-flex min-h-11 items-center rounded-md border-2 border-ink bg-gold px-5 font-condensed text-sm tracking-[0.16em] text-ink uppercase shadow-[3px_3px_0_var(--color-ink)] transition-transform duration-150 motion-safe:active:translate-x-[2px] motion-safe:active:translate-y-[2px] motion-safe:active:shadow-none"
          >
            Get pass
          </a>
        </div>
      </nav>
    </header>
  );
}
