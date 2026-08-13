import { BRAND, LINKS } from "@/lib/brand";
import { GoaBadge } from "@/components/landing/Motifs";

export function Footer() {
  return (
    <footer className="relative px-5 pt-20 pb-10 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <p className="text-center leading-[0.85] text-lemon">
          <span className="relative block font-display text-[clamp(2.6rem,11vw,6rem)] font-bold">
            HACKER
            <GoaBadge className="absolute left-1/2 top-full z-10 -translate-x-1/2 -translate-y-1/2 text-[clamp(1.15rem,4.4vw,2.5rem)]" />
          </span>
          <span className="block font-display text-[clamp(2.6rem,11vw,6rem)] font-bold">HOUSE</span>
        </p>

        <p className="label mt-6 text-center text-lemon">
          {BRAND.location} · {BRAND.dates}
        </p>
        <p className="label mt-1 text-center text-lemon/70">{BRAND.studio}</p>

        <div className="mt-14 flex flex-col items-center justify-between gap-6 border-t border-lemon/20 pt-8 sm:flex-row sm:items-start">
          <ul className="flex flex-col items-center gap-2 sm:items-start">
            <li>
              <a
                href={LINKS.x}
                target="_blank"
                rel="noopener noreferrer"
                className="label text-paper transition-colors hover:text-lemon"
              >
                @247pmstudio
              </a>
            </li>
            <li>
              <a
                href={LINKS.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="label text-paper transition-colors hover:text-lemon"
              >
                @twofourtysevenpm
              </a>
            </li>
          </ul>

          <p className="label text-center text-lemon/70 sm:text-right">
            {BRAND.hashtag} · {BRAND.coords}
            <br />
            <span className="text-paper/50">© 2026 HH-GOA. ALL RIGHTS RESERVED.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
