import { Generator } from "@/components/generator/Generator";
import { Hero } from "@/components/landing/Hero";
import { Journey } from "@/components/landing/Journey";
import { Footer } from "@/components/site/Footer";
import { Nav } from "@/components/site/Nav";

/**
 * The whole site.
 *
 * A server component: the animated pieces are client islands, so the initial
 * HTML is fully rendered and the page paints without waiting on hydration.
 */
export default function HomePage() {
  return (
    <>
      <Nav />
      <main id="main" className="relative">
        <Hero />
        <Generator />
        <Journey />
      </main>
      <Footer />
    </>
  );
}
