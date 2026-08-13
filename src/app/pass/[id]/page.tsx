import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Asterisk } from "@/components/landing/Motifs";
import { BRAND } from "@/lib/brand";
import { absoluteUrl } from "@/lib/site";
import { getShareRecord } from "@/lib/store";
import type { ShareImage } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

// Share records are immutable once written, so the page can be cached hard.
export const revalidate = 3600;

/** Only the 1.91:1 share board is stored, and it is both what X unfurls and
 *  what this page displays. */
function ogImage(images: ShareImage[]): ShareImage | undefined {
  return images.find((i) => i.variant === "og") ?? images[0];
}

/**
 * OG images must be absolute — crawlers silently drop relative URLs, which is
 * exactly the blank-thumbnail failure this whole path exists to avoid. Blob
 * returns absolute CDN URLs already; the dev-only local store returns
 * app-relative ones.
 */
function toAbsolute(url: string): string {
  return url.startsWith("/") ? absoluteUrl(url) : url;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const record = await getShareRecord(id);

  if (!record) return { title: "Pass not found", robots: { index: false, follow: false } };

  const image = ogImage(record.images);
  const title = `${record.fields.name} — ${BRAND.event}`;
  const description = `${record.fields.role} · ${record.fields.city} → Goa · ${BRAND.hashtag}`;

  return {
    title,
    description,
    // Individual builder passes should not end up in search results.
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "website",
      url: absoluteUrl(`/pass/${id}`),
      images: image
        ? [{ url: toAbsolute(image.url), width: image.width, height: image.height, alt: title }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [toAbsolute(image.url)] : [],
    },
  };
}

export default async function PassPage({ params }: Props) {
  const { id } = await params;
  const record = await getShareRecord(id);
  if (!record) notFound();

  const image = ogImage(record.images);
  if (!image) notFound();

  const { fields, identity } = record;
  const rows: [string, string][] = [
    ["Ticket no.", identity.ticketNo],
    ["Builder ID", identity.builderId],
    ["PNR", identity.pnr],
    ["Seat", identity.seat],
  ];

  return (
    <main id="main" className="relative flex min-h-dvh flex-col items-center px-5 py-16">
      <div className="flex w-full max-w-4xl flex-col items-center gap-8">
        <p className="label text-lemon">
          {BRAND.event} · {BRAND.passName}
        </p>

        {/* Plain <img>: the source is a Blob CDN URL on an external host, and
            routing it through the image optimizer would add a hop for no gain. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          width={image.width}
          height={image.height}
          alt={`${fields.name}, ${fields.role}, travelling from ${fields.city}`}
          className="w-full rounded-xl border-2 border-jungle-line"
        />

        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="font-display text-3xl font-bold text-paper sm:text-4xl">
            {fields.name} is heading to <span className="text-lemon">Hacker House Goa</span>
          </h1>
          <p className="label flex items-center gap-2 text-muted">
            {fields.city} → Goa
            <Asterisk className="size-3 text-magenta" />
            {BRAND.dates}
          </p>
        </div>

        <dl className="grid w-full grid-cols-2 gap-x-6 gap-y-4 rounded-xl border-2 border-jungle-line bg-jungle-panel p-5 sm:grid-cols-4">
          {rows.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <dt className="label text-muted">{label}</dt>
              <dd className="truncate font-condensed text-base tracking-[0.08em] text-lemon uppercase">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <Link
          href="/#pass"
          className="inline-flex min-h-12 items-center rounded-lg border-2 border-ink bg-gold px-8 font-condensed tracking-[0.16em] text-ink uppercase shadow-[4px_4px_0_var(--color-ink)] transition-transform duration-150 motion-safe:active:translate-x-[2px] motion-safe:active:translate-y-[2px] motion-safe:active:shadow-none"
        >
          Make your own
        </Link>
      </div>
    </main>
  );
}
