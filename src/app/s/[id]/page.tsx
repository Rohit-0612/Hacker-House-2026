import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getShareRecord } from "@/lib/blob";
import { BRAND } from "@/lib/brand";
import { absoluteUrl } from "@/lib/site";
import type { OutputVariant } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

// Share records are immutable once written, so the page can be cached hard.
export const revalidate = 3600;

/** The variant X should unfurl: landscape matches summary_large_image. */
function primary(images: { variant: OutputVariant; url: string; width: number; height: number }[]) {
  return images.find((i) => i.variant === "landscape") ?? images[0];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const record = await getShareRecord(id);

  if (!record) {
    return { title: "Not found", robots: { index: false, follow: false } };
  }

  const image = primary(record.images);
  const who = record.fields?.name ? `${record.fields.name}` : "A builder";
  const title = `${who} — ${BRAND.event}`;
  const description = record.fields
    ? `${record.fields.title} · ${record.fields.stack} · ${BRAND.hashtag}`
    : BRAND.tagline;

  return {
    title,
    description,
    // Individual builder cards should not end up in search results.
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "website",
      url: absoluteUrl(`/s/${id}`),
      images: image
        ? [{ url: image.url, width: image.width, height: image.height, alt: title }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image.url] : [],
    },
  };
}

export default async function SharePage({ params }: Props) {
  const { id } = await params;
  const record = await getShareRecord(id);
  if (!record) notFound();

  const image = primary(record.images);
  if (!image) notFound();

  return (
    <main id="main" className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(123,92,255,0.28),transparent_70%)]"
      />

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-8">
        <p className="font-display text-xs font-bold tracking-[0.32em] text-muted">
          {BRAND.event}
        </p>

        {/* Plain <img>: the source is a Vercel Blob URL on an external host, and
            routing it through the image optimizer would add a hop for no gain. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          width={image.width}
          height={image.height}
          alt={
            record.fields
              ? `${record.fields.name}, ${record.fields.title}, ${record.fields.stack}`
              : "HH Goa 2026 builder identity"
          }
          className="w-full rounded-2xl border border-white/10 shadow-[0_40px_120px_-30px_rgba(255,77,109,0.45)]"
        />

        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            {record.fields?.name ?? "A builder"} is heading to{" "}
            <span className="text-sunset">HH Goa 2026</span>
          </h1>
          <p className="text-sm text-muted">{BRAND.hashtag}</p>
        </div>

        <Link
          href="/create"
          className="min-h-12 rounded-full bg-sunset px-7 py-3.5 font-display font-bold text-night transition-transform duration-200 hover:scale-[1.03] active:scale-95"
        >
          Make your own
        </Link>
      </div>
    </main>
  );
}
