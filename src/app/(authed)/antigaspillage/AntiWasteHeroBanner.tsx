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

function GlobeLeaves({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 150"
      className={className}
      aria-hidden
    >
      <ellipse cx="150" cy="128" rx="58" ry="10" fill="#8fd4a8" opacity="0.35" />
      <path
        d="M28 92c18-38 48-62 78-54 8 22-6 48-28 62-22 14-48 12-50-8Z"
        fill="#3fa86a"
      />
      <path
        d="M48 78c12-8 28-10 38-2-8 14-22 22-38 18 2-6 0-12 0-16Z"
        fill="#7ed39a"
      />
      <path
        d="M168 38c32 8 48 38 38 64-28 8-52-10-62-34-6-16 4-34 24-30Z"
        fill="#2f9a5f"
      />
      <path
        d="M176 52c14 2 24 16 20 30-14 2-26-6-32-18 2-6 6-12 12-12Z"
        fill="#7ed39a"
      />
      <circle cx="118" cy="78" r="46" fill="#2f8f55" />
      <circle cx="118" cy="78" r="42" fill="url(#awGlobeShine)" />
      <path
        d="M90 62c14-10 28-8 38 2 6 8 4 18-6 22-12 4-22-2-28-12-4-6-6-10-4-12Z"
        fill="#d8f48a"
        opacity="0.9"
      />
      <path
        d="M78 86c18 4 34 2 46-8 8 10 6 24-8 32-18 8-34 2-42-12-4-8-4-12 4-12Z"
        fill="#1f6f40"
        opacity="0.55"
      />
      <path
        d="M108 104c16 6 32 4 42-8 2 14-8 28-24 32-18 4-28-6-22-18 2-4 2-6 4-6Z"
        fill="#d8f48a"
        opacity="0.75"
      />
      <defs>
        <radialGradient id="awGlobeShine" cx="0.35" cy="0.3" r="0.75">
          <stop offset="0%" stopColor="#6ecf8c" />
          <stop offset="70%" stopColor="#2f8f55" />
          <stop offset="100%" stopColor="#1e6b40" />
        </radialGradient>
      </defs>
    </svg>
  );
}

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
    <section className="relative overflow-hidden rounded-[2rem] bg-[#e9f8ee] shadow-[0_18px_44px_-24px_rgba(13,59,46,0.35)]">
      <div
        className="pointer-events-none absolute -left-16 -top-24 size-[18rem] rounded-full bg-[radial-gradient(circle_at_center,#2f9a5f_0%,#3fbf72_42%,transparent_70%)] opacity-90"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-10 top-0 h-40 w-[22rem] rounded-bl-[8rem] bg-[radial-gradient(circle_at_70%_20%,#b7ebc6_0%,transparent_68%)]"
        aria-hidden
      />

      <div className="relative px-5 pb-5 pt-5 sm:px-7 sm:pb-6 sm:pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
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

          <div className="relative hidden shrink-0 items-center gap-3 md:flex">
            <GlobeLeaves className="h-[7.5rem] w-[11rem]" />
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
          <div className="flex items-center gap-3 rounded-[1.6rem] bg-white px-3 py-3 shadow-[0_10px_28px_-18px_rgba(13,59,46,0.35)] sm:px-4">
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

          <div className="flex items-center gap-3 rounded-[1.6rem] bg-white px-4 py-3 shadow-[0_10px_28px_-18px_rgba(13,59,46,0.35)]">
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

          <div className="flex items-center gap-3 rounded-[1.6rem] bg-[#d8f3e3] px-4 py-3 shadow-[0_10px_28px_-18px_rgba(13,59,46,0.28)]">
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
