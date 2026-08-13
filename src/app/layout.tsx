import type { Metadata, Viewport } from "next";
import { Backdrop } from "@/components/site/Backdrop";
import { Motion } from "@/components/site/Motion";
import { BRAND, COLORS } from "@/lib/brand";
import { fontVariables } from "@/lib/fonts";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const title = `${BRAND.eventFull} — ${BRAND.passName}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: title, template: `%s — ${BRAND.event}` },
  description: BRAND.tagline,
  applicationName: BRAND.eventFull,
  keywords: ["Hacker House Goa", "HH Goa 2026", "hackathon", "Goa", "builder pass"],
  openGraph: {
    title,
    description: BRAND.tagline,
    url: siteUrl(),
    siteName: BRAND.eventFull,
    type: "website",
  },
  twitter: { card: "summary_large_image", title, description: BRAND.tagline },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, title: BRAND.event, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: COLORS.jungleDeep,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-lemon focus:px-4 focus:py-2 focus:font-condensed focus:text-ink"
        >
          Skip to content
        </a>
        <Backdrop />
        <Motion>{children}</Motion>
      </body>
    </html>
  );
}
