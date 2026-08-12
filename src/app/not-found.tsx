import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center gap-5 px-5 text-center">
      <p className="font-display text-6xl font-bold text-sunset">404</p>
      <h1 className="font-display text-xl font-bold">We couldn&apos;t find that</h1>
      <p className="max-w-sm text-sm text-muted">
        The link may have expired, or the card was never generated.
      </p>
      <Link
        href="/create"
        className="mt-2 inline-flex min-h-12 items-center rounded-full bg-sunset px-7 font-display font-bold text-night"
      >
        Make your own
      </Link>
    </main>
  );
}
