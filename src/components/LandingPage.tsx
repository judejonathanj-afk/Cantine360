import { Leaf } from "lucide-react";
import { AnimatedBackground } from "@/components/landing/animated-background";
import { SiteHeader } from "@/components/landing/site-header";
import { Hero } from "@/components/landing/hero";
import { WhySection } from "@/components/landing/why-section";

/** Accueil public — design landing (Fredoka / Nunito + animations). */
export function LandingPage() {
  return (
    <div className="landing-root relative min-h-full font-[family-name:var(--font-nunito)]">
      <AnimatedBackground />
      <SiteHeader />
      <main className="relative">
        <Hero />
        <WhySection />
      </main>
      <footer className="relative mx-auto flex max-w-6xl flex-col items-center gap-2 px-5 py-10 text-center text-sm text-muted-foreground">
        <span className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <Leaf className="size-5 text-primary" /> Cantine360
        </span>
        <p>
          Moins de gaspillage, un service mieux piloté — chaque jour, dans
          chaque école.
        </p>
      </footer>
    </div>
  );
}
