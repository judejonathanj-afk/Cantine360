import {
  ArrowRight,
  CalendarDays,
  Check,
  Leaf,
  Target,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AntiWasteGauge } from "./AntiWasteGauge";
import {
  formatPeriodEstimateFr,
  type GaugeStatus,
} from "./antiWasteFormat";

const OBJECTIVE_COPY: Record<
  GaugeStatus,
  { label: string; detail: string; className: string }
> = {
  green: {
    label: "Objectif atteint",
    detail: "Les déchets restent sous le plafond visé.",
    className: "text-[#0d7a45]",
  },
  amber: {
    label: "À surveiller",
    detail: "On se rapproche de l’objectif — à garder à l’œil.",
    className: "text-amber-700",
  },
  red: {
    label: "Objectif dépassé",
    detail: "Les déchets dépassent le plafond visé.",
    className: "text-[color:var(--aw-coral)]",
  },
  none: {
    label: "Sans objectif",
    detail: "Aucun objectif défini pour le moment.",
    className: "text-[#0d3b2e]",
  },
};

export function AntiWasteHeroBanner({
  days,
  gramsPer100,
  gaugeStatus,
  targetGPer100,
}: {
  days: 7 | 30;
  gramsPer100: number | null;
  gaugeStatus: GaugeStatus;
  targetGPer100: number | null;
}) {
  const hasWeighing = gramsPer100 != null && gramsPer100 > 0;
  const objective = hasWeighing
    ? OBJECTIVE_COPY[gaugeStatus]
    : {
        label: "Pas encore de pesée",
        detail: "Le g / 100 apparaîtra dès qu’un service sera pesé.",
        className: "text-zinc-600",
      };
  const kg =
    hasWeighing && gramsPer100 != null
      ? (gramsPer100 / 1000).toLocaleString("fr-FR", {
          maximumFractionDigits: 2,
        })
      : null;

  return (
    <section className="ecologie-banner shadow-[0_18px_44px_-24px_rgba(13,59,46,0.35)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/terre-ecologie.png"
        alt=""
        width={952}
        height={429}
        decoding="async"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.96)_0%,rgba(236,250,241,0.82)_34%,rgba(255,255,255,0.12)_62%,transparent_78%)]"
        aria-hidden
      />
      <div className="relative flex min-h-[300px] flex-col justify-between px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 max-w-2xl items-center gap-3 sm:gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white text-[#1f8a4d] shadow-[0_8px_24px_-10px_rgba(13,59,46,0.45)] sm:size-16">
              <Leaf className="size-7 sm:size-8" strokeWidth={2.1} fill="currentColor" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-[1.55rem] font-extrabold leading-tight tracking-tight text-[#14352a] sm:text-[2rem]">
                Lutte contre le gaspillage alimentaire
              </h1>
              <p className="mt-1 text-sm font-medium text-[#4d6b5d] sm:text-base">
                Ensemble, réduisons le gaspillage et préservons notre
                environnement.
              </p>
              <span className="mt-2 block h-1 w-16 rounded-full bg-[#2f9a5f]" aria-hidden />
            </div>
          </div>

          <div className="hidden shrink-0 md:block">
            <div className="flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-2.5 shadow-sm ring-1 ring-white/70 backdrop-blur-sm">
              <Leaf className="size-4 text-[#1f8a4d]" fill="currentColor" aria-hidden />
              <span className="font-display text-[12px] font-extrabold leading-tight text-[#14352a]">
                Agissons
                <br />
                ensemble
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.9fr)_minmax(0,1.2fr)]">
          <div className="flex items-center gap-3 rounded-[1.6rem] bg-white/95 px-3 py-3 shadow-[0_10px_28px_-18px_rgba(13,59,46,0.35)] ring-1 ring-white/80 backdrop-blur-[2px] sm:px-4">
            <div className="relative">
              <AntiWasteGauge
                size="sm"
                value={gramsPer100}
                objective={targetGPer100}
                status={gaugeStatus}
                emptyLabel="—"
              />
              <Leaf
                className="pointer-events-none absolute left-1/2 top-[28%] size-4 -translate-x-1/2 text-[#2f9a5f]"
                fill="currentColor"
                aria-hidden
              />
            </div>
            <span className="hidden h-16 w-px bg-emerald-100 sm:block" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-[#14352a]">Notre performance</p>
              <TrendingUp className="mt-1 size-8 text-[#2f9a5f]" strokeWidth={2.2} aria-hidden />
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-[1.6rem] bg-white/95 px-4 py-3 shadow-[0_10px_28px_-18px_rgba(13,59,46,0.35)] ring-1 ring-white/80 backdrop-blur-[2px]">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#e7f8ee] text-[#1f8a4d]">
              <Target className="size-7" strokeWidth={2.1} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className={cn("flex items-center gap-1.5 text-lg font-extrabold leading-tight", objective.className)}>
                {objective.label}
                {gaugeStatus === "green" && hasWeighing ? (
                  <Check className="size-4" strokeWidth={3} aria-hidden />
                ) : null}
              </p>
              <p className="mt-0.5 text-sm font-medium leading-snug text-[#5d7a6c]">
                {objective.detail}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-[1.6rem] bg-[#d8f3e3]/95 px-4 py-3 shadow-[0_10px_28px_-18px_rgba(13,59,46,0.28)] ring-1 ring-white/70 backdrop-blur-[2px]">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#1f8a4d] shadow-sm">
              <CalendarDays className="size-6" strokeWidth={2.1} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug text-[#14352a]">
                {kg ? (
                  <>
                    Pour 100 repas servis, environ{" "}
                    <span className="font-extrabold">{kg} kg</span> de nourriture
                    ont été jetés sur la période.
                  </>
                ) : (
                  <>Pas encore de pesée sur la période.</>
                )}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold text-[#3f8f62]">
                <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                {formatPeriodEstimateFr(days)}
              </p>
            </div>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-[#1f8a4d]">
              <ArrowRight className="size-4" aria-hidden />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
