import Image from "next/image";
import { WifiOff, Scale, LayoutDashboard, Sparkles, ChefHat } from "lucide-react";
import { Reveal } from "./reveal";

const features = [
  { icon: WifiOff, label: "Service terrain, y compris hors ligne" },
  { icon: Scale, label: "Déchets mat. / prim. + g / 100 assiettes" },
  { icon: LayoutDashboard, label: "Dashboard cuisine et admin" },
  { icon: Sparkles, label: "Mode Antigaspillage (admin)" },
];

export function Hero() {
  return (
    <section id="top" className="relative mx-auto max-w-6xl px-5 pb-16 pt-10 md:pt-16">
      <div aria-hidden className="relative mb-2 select-none overflow-hidden">
        <p className="font-display text-[18vw] font-bold leading-none tracking-tight md:text-[10rem]">
          <span className="text-primary/25">Can</span>
          <span className="text-grape/25">ti</span>
          <span className="text-sun/50">ne</span>
          <span className="text-sky/60">3</span>
          <span className="text-primary/25">6</span>
          <span className="text-grape/25">0</span>
        </p>
      </div>

      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-12">
        <div>
          <Reveal direction="left">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <ChefHat className="size-4" /> Cantine scolaire
            </p>
          </Reveal>

          <Reveal direction="left" delay={80}>
            <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight text-balance md:text-6xl">
              Moins de gaspillage.{" "}
              <span className="bg-gradient-to-r from-primary via-primary to-grape bg-clip-text text-transparent">
                Un service mieux piloté, chaque jour.
              </span>
            </h1>
          </Reveal>

          <Reveal direction="left" delay={160}>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
              Cantine360 relie la cuisine et l&apos;administration : saisie du
              déjeuner, pesées des déchets (maternelle / primaire), menus et
              allergènes, tableaux de bord sur 7 ou 30 jours — pour produire et
              servir juste ce qu&apos;il faut.
            </p>
          </Reveal>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {features.map((f, i) => (
              <Reveal key={f.label} direction="up" delay={200 + i * 90}>
                <div className="group flex h-full items-center gap-3 rounded-2xl border border-border bg-card/70 p-4 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <f.icon className="size-5" />
                  </span>
                  <span className="text-sm font-semibold leading-snug">
                    {f.label}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal direction="up" delay={560}>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Le mode Antigaspillage, activé par l&apos;admin, regroupe
              objectif, alertes et tendances pour décider plus vite — et
              ajuster demain la production.
            </p>
          </Reveal>
        </div>

        <Reveal direction="right" delay={120}>
          <figure className="relative">
            <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-tr from-primary/25 via-sky/25 to-grape/25 blur-xl" />
            <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-xl">
              <Image
                src="/cantine-hero.png"
                alt="Enfants de primaire déjeunant à la cantine scolaire"
                width={1536}
                height={1024}
                className="aspect-[4/3] h-full w-full object-cover object-center"
                priority
              />
            </div>
            <figcaption className="mt-3 text-center text-sm text-muted-foreground">
              La cantine primaire : produire juste, servir juste, jeter moins.
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
