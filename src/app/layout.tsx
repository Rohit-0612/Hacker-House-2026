import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { BRAND } from "@/lib/brand";
import { absoluteUrl, siteUrl } from "@/lib/site";
import "./globals.css";

// Self-hosted by Next at build time — no runtime request to Google, and no
// layout shift from a late-arriving webfont.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `Frame In Goa — ${BRAND.event}`,
    template: `%s — Frame In Goa`,
  },
  description: BRAND.tagline,
  applicationName: "Frame In Goa",
  openGraph: {
    title: `Frame In Goa — ${BRAND.event}`,
    description: BRAND.tagline,
    url: siteUrl(),
    siteName: "Frame In Goa",
    images: [{ url: absoluteUrl("/api/og"), width: 1200, height: 630, alt: BRAND.tagline }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Frame In Goa — ${BRAND.event}`,
    description: BRAND.tagline,
    images: [absoluteUrl("/api/og")],
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, title: "Frame In Goa", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#070B1F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:font-semibold focus:text-night"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
