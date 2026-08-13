import { JOURNEY } from "@/lib/brand";
import { cn } from "@/lib/cn";

/**
 * The four days, as boards hung from the rafters of the house — the event's own
 * device for this section.
 *
 * The reveal is CSS, and this is a server component. Gating the boards on a
 * scroll-triggered JS animation meant that if the observer was late (or never
 * fired at all) the section rendered as an empty gap where the schedule should
 * be. Load-time stagger costs nothing and cannot fail open.
 */
export function Journey() {
  return (
    <section className="relative px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto w-full max-w-6xl">
        <h2 className="mb-3 text-center font-display text-4xl font-bold text-lemon sm:text-5xl">
          The Journey
        </h2>
        <p className="label mb-16 text-center text-muted">Four days. One line to the launch.</p>

        {/* The rail the boards hang from, pinned to the top of the ropes rather
            than to the section — anchoring it by section offset put it through
            the heading. */}
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[-2rem] top-0 hidden h-1 bg-gold/35 md:block"
          />

          <ol className="grid gap-10 md:grid-cols-4 md:gap-6">
            {JOURNEY.map((day, i) => {
              const gold = i % 2 === 0;
              return (
                <li
                  key={day.day}
                  style={{ animationDelay: `${0.1 + i * 0.1}s` }}
                  className="animate-fade relative flex flex-col items-center"
                >
                  {/* Ropes. */}
                  <div aria-hidden className="flex w-full justify-between px-6">
                    {[0, 1].map((r) => (
                      <span key={r} className="h-10 w-0.5 bg-gold/60" />
                    ))}
                  </div>

                  <div
                    className={cn(
                      "w-full border-[3px] border-ink p-1.5 shadow-[6px_6px_0_rgba(0,0,0,0.35)] transition-transform duration-300 motion-safe:hover:rotate-0",
                      gold ? "bg-gold motion-safe:-rotate-1" : "bg-magenta motion-safe:rotate-1",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-full flex-col gap-3 border-2 px-4 py-6 text-center",
                        gold ? "border-jungle/45 text-jungle" : "border-lemon/45 text-lemon",
                      )}
                    >
                      <span className="font-mono text-[0.65rem] tracking-[0.28em] opacity-80">
                        DAY {day.day} · {day.date}
                      </span>
                      <span className="font-condensed text-xl leading-tight tracking-[0.06em] sm:text-2xl">
                        {day.name}
                      </span>
                      <span
                        className={cn(
                          "font-mono text-[0.7rem] leading-relaxed tracking-[0.1em]",
                          gold ? "text-jungle/80" : "text-lemon/80",
                        )}
                      >
                        {day.blurb}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
