import Image from "next/image";
import Link from "next/link";
import { Leaf, ArrowRight } from "lucide-react";
import { groupCardColorForIndex } from "@/lib/groupCardColors";
import { Button } from "@/components/ui/button";

function LandscapeTree({
  x,
  baseY = 218,
  scale = 1,
  faint = false,
}: {
  x: number;
  baseY?: number;
  scale?: number;
  faint?: boolean;
}) {
  const canopy = faint ? "fill-primary/14" : "fill-primary/26";
  const canopyMid = faint ? "fill-primary/10" : "fill-primary/20";
  const trunk = faint ? "fill-primary/22" : "fill-primary/38";

  return (
    <g transform={`translate(${x} ${baseY}) scale(${scale})`}>
      <rect x="-1.5" y="-11" width="3" height="11" className={trunk} rx="0.6" />
      <ellipse cx="0" cy="-17" rx="9" ry="11" className={canopy} />
      <ellipse cx="-5.5" cy="-13" rx="6.5" ry="8" className={canopyMid} />
      <ellipse cx="5.5" cy="-13" rx="6.5" ry="8" className={canopyMid} />
    </g>
  );
}

function LandscapeBush({ x, baseY = 219, w = 14 }: { x: number; baseY?: number; w?: number }) {
  return (
    <g transform={`translate(${x} ${baseY})`}>
      <ellipse cx="0" cy="-3" rx={w / 2} ry="4" className="fill-primary/18" />
      <ellipse cx={-w / 3} cy="-1" rx={w / 3} ry="3" className="fill-primary/14" />
      <ellipse cx={w / 3} cy="-1" rx={w / 3} ry="3" className="fill-primary/14" />
    </g>
  );
}

function LandingMountains() {
  return (
    <svg
      viewBox="0 0 1440 240"
      preserveAspectRatio="none"
      className="h-[clamp(7rem,18vh,12rem)] w-full sm:h-[clamp(8rem,20vh,14rem)]"
      aria-hidden
    >
      <path
        className="fill-primary/8"
        d="M0 240V150l120-50 200 70 280-90 360 60 420-40 520 80 640-70 760 50 880-60 1000 40 1120-30 1280 55 1440 25V240z"
      />
      <path
        className="fill-primary/12"
        d="M0 240V175l160-35 320 55 480-45 640 35 800-55 960 40 1120-25 1280 45 1440 15V240z"
      />
      <path
        className="fill-primary/10"
        d="M0 240V208c120-6 240 4 360-2s240-8 360-4 240 6 360 2 240-10 360-6v42H0z"
      />
      <path
        className="fill-primary/18"
        d="M0 240V198l240-28 480 22 720-18 960 28 1200-12 1440 8V240z"
      />

      <LandscapeTree x={180} baseY={212} scale={0.65} faint />
      <LandscapeTree x={520} baseY={210} scale={0.55} faint />
      <LandscapeTree x={880} baseY={211} scale={0.6} faint />
      <LandscapeTree x={1180} baseY={209} scale={0.58} faint />

      <LandscapeTree x={70} scale={1.05} />
      <LandscapeTree x={260} scale={0.92} />
      <LandscapeTree x={410} scale={1.15} />
      <LandscapeTree x={590} scale={0.88} />
      <LandscapeTree x={750} scale={1.08} />
      <LandscapeTree x={930} scale={0.95} />
      <LandscapeTree x={1090} scale={1.12} />
      <LandscapeTree x={1260} scale={0.9} />
      <LandscapeTree x={1385} scale={0.82} />

      <LandscapeBush x={155} />
      <LandscapeBush x={340} w={12} />
      <LandscapeBush x={500} w={16} />
      <LandscapeBush x={680} />
      <LandscapeBush x={820} w={13} />
      <LandscapeBush x={1010} w={15} />
      <LandscapeBush x={1175} />
      <LandscapeBush x={1330} w={12} />
    </svg>
  );
}

function LandingHeroWatermark() {
  const text = "Cantine360";
  let colorIndex = 0;

  return (
    <p className="w-full text-center font-extrabold leading-[0.95] tracking-[-0.03em] text-[clamp(2.75rem,13vw,9rem)]">
      {[...text].map((char, i) => {
        const color = groupCardColorForIndex(colorIndex++);
        return (
          <span key={`${char}-${i}`} style={{ color }} className="inline-block opacity-40">
            {char}
          </span>
        );
      })}
    </p>
  );
}

export function LandingPage() {
  return (
    <div className="flex min-h-full w-full flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Cantine360
            </span>
          </Link>
          <Button asChild>
            <Link href="/login">Connexion établissement</Link>
          </Button>
        </div>
      </header>

      <main className="w-full flex-1">
        <section className="relative w-full overflow-x-hidden border-b border-border/40">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/12 via-transparent to-accent/10" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-0 flex justify-center px-4 pt-1 select-none sm:pt-2"
          >
            <LandingHeroWatermark />
          </div>
          <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-10 pt-24 sm:px-6 sm:pb-12 sm:pt-28 lg:px-8 lg:pb-14 lg:pt-32">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12 xl:gap-16">
              <div className="min-w-0">
                <h1 className="text-pretty text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-[1.85rem] lg:leading-snug xl:text-4xl xl:leading-snug">
                  Cantine360 soutient une cantine scolaire plus écologique :
                  réduire le gaspillage, préserver les ressources et piloter les
                  repas au quotidien.
                </h1>
                <div className="mt-5 max-w-xl space-y-4 text-pretty text-xl leading-relaxed text-foreground sm:text-[1.2rem]">
                  <p>
                    Cantine360 ne se limite pas au comptage des restes : il aide à
                    produire et servir juste ce qu&apos;il faut, repas après repas.
                    Sur la durée, moins de surproduction limite le gaspillage
                    alimentaire, la charge des déchets organiques et la pression sur
                    les ressources (agriculture, eau, énergie, logistique).
                  </p>
                  <p>
                    C&apos;est une démarche mesurable, progressive et réplicable dans
                    chaque établissement — au service d&apos;une cantine plus sobre et
                    plus responsable.
                  </p>
                </div>
                <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                  <Button
                    asChild
                    size="lg"
                    className="gap-2 shadow-lg shadow-primary/20 sm:w-auto"
                  >
                    <Link href="/login">
                      Se connecter
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <p className="text-sm text-muted-foreground sm:max-w-[14rem]">
                    Code établissement et code accès (cuisine ou admin), fournis
                    par votre administration.
                  </p>
                </div>
              </div>

              <div className="relative w-full lg:max-w-none">
                <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl border border-border/40 bg-muted shadow-xl shadow-primary/10 ring-1 ring-black/5 sm:aspect-[4/3] lg:aspect-[4/5] lg:max-h-[min(72vh,42rem)]">
                  <Image
                    src="/hero-cantine.png"
                    alt="Préparation en cuisine de cantine : légumes frais et bacs de service"
                    fill
                    className="object-cover object-[center_42%]"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            aria-hidden
            className="pointer-events-none relative z-[1] -mt-12 w-full select-none sm:-mt-16 lg:-mt-20"
          >
            <div className="w-full bg-gradient-to-t from-primary/6 via-primary/3 to-transparent">
              <LandingMountains />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        <p>
          Cantine360 — pilotage de cantine scolaire et réduction du gaspillage
        </p>
      </footer>
    </div>
  );
}
