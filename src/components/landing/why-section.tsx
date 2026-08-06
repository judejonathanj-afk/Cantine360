import { Download, Trash2, Wallet, Utensils, Scale, Recycle } from "lucide-react";
import { Reveal } from "./reveal";

const actions = [
  {
    icon: Utensils,
    label: "Se servir de plus petites portions et se resservir si besoin",
  },
  {
    icon: Scale,
    label: "Peser les déchets pour sensibiliser toute l’école",
  },
  {
    icon: Recycle,
    label: "Donner les invendus à des associations ou au compost",
  },
];

export function WhySection() {
  return (
    <section id="pourquoi" className="mx-auto max-w-6xl px-5 py-16">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <Reveal direction="left" className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-balance md:text-4xl">
            Pourquoi agir contre le gaspillage ?
          </h2>
          <p className="mt-3 text-lg text-muted-foreground text-pretty">
            Une fiche claire pour sensibiliser l&apos;équipe et la commission —
            à consulter ici ou à télécharger.
          </p>
        </Reveal>
        <Reveal direction="right">
          <a
            href="/gaspillage-alimentaire-scolaire.zip"
            download
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-5 py-2.5 text-sm font-bold text-primary transition-all hover:-translate-y-0.5 hover:bg-primary/10"
          >
            <Download className="size-4" /> Télécharger la fiche (ZIP)
          </a>
        </Reveal>
      </div>

      <Reveal direction="scale" delay={80} className="mt-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-grape to-grape/80 p-8 text-grape-foreground shadow-2xl md:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <h3 className="font-display text-4xl font-bold tracking-tight text-balance md:text-5xl">
              Le gaspillage à la cantine
            </h3>
            <p className="mt-5 text-lg leading-relaxed text-grape-foreground/90 text-pretty">
              Chaque jour, la restauration scolaire sert des millions de repas.
              Mais une part importante finit à la poubelle :{" "}
              <strong className="font-bold text-grape-foreground">
                près de 120 g de nourriture gaspillés par élève et par repas
              </strong>{" "}
              — entrées à peine touchées, pain, restes de plat.
            </p>
          </div>

          <div className="my-9 h-px w-full bg-grape-foreground/25" />

          <div className="grid gap-8 md:grid-cols-2">
            <div className="text-center">
              <p className="font-display text-2xl font-bold">Un élève jette</p>
              <div className="mt-4 flex items-center justify-center gap-6">
                <p className="font-display text-7xl font-bold leading-none">
                  30<span className="text-4xl">kg</span>
                </p>
                <div className="flex flex-col items-center rounded-2xl bg-grape-foreground/15 px-5 py-4">
                  <Trash2 className="size-9" />
                  <p className="mt-2 font-display text-3xl font-bold leading-none">
                    120g
                  </p>
                  <p className="mt-1 text-xs font-semibold">
                    jetés à chaque repas
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold text-grape-foreground/85">
                de nourriture par an
              </p>
            </div>

            <div className="text-center">
              <p className="font-display text-2xl font-bold">
                Le coût de ce gaspillage atteint
              </p>
              <div className="mt-4 flex items-center justify-center gap-4">
                <Wallet className="size-12" />
                <div>
                  <p className="font-display text-7xl font-bold leading-none">
                    200€
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    par élève et par an
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-grape-foreground/85">
                Soit des millions d&apos;euros de repas jetés chaque année en
                France, alors que ces aliments étaient parfaitement
                consommables.
              </p>
            </div>
          </div>

          <div className="my-9 h-px w-full bg-grape-foreground/25" />

          <div>
            <h4 className="text-center font-display text-2xl font-bold">
              Comment agir à la cantine ?
            </h4>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {actions.map((a, i) => (
                <Reveal key={a.label} direction="up" delay={120 + i * 100}>
                  <div className="flex h-full items-center gap-3 rounded-2xl bg-grape-foreground/15 p-4 text-left transition-all hover:-translate-y-1 hover:bg-grape-foreground/25">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-grape-foreground/20">
                      <a.icon className="size-5" />
                    </span>
                    <span className="text-sm font-semibold leading-snug">
                      {a.label}
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
