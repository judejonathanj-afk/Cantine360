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
        className="pointer-events-none absolute right-[-2%] top-1/2 h-[78%] w-[34%] max-w-[16.5rem] -translate-y-1/2 object-contain object-right sm:w-[32%]"
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[62%] bg-[linear-gradient(90deg,#ffffff_0%,rgba(255,255,255,0.94)_48%,rgba(232,246,236,0.28)_82%,transparent_100%)]"
        aria-hidden
      />
      <div className="relative flex flex-col justify-between px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 max-w-2xl items-center gap-2.5 sm:gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-[#1f8a4d] shadow-[0_10px_24px_-8px_rgba(13,59,46,0.4)] ring-1 ring-emerald-100 sm:size-12">
              <Leaf className="size-5 sm:size-6" strokeWidth={2.1} fill="currentColor" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-[1.25rem] font-extrabold leading-tight tracking-tight text-[#0d2a20] drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] sm:text-[1.55rem]">
                Lutte contre le gaspillage alimentaire
              </h1>
              <p className="mt-0.5 text-sm font-semibold leading-snug text-[#244636] sm:text-[0.95rem]">
                Ensemble, réduisons le gaspillage et préservons notre
                environnement.
              </p>
              <span className="mt-1.5 block h-1 w-14 rounded-full bg-[#1f8a4d]" aria-hidden />
            </div>
          </div>

          <div className="hidden shrink-0 md:block">
            <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-[0_10px_24px_-10px_rgba(13,59,46,0.45)] ring-1 ring-emerald-100">
              <Leaf className="size-3.5 text-[#1f8a4d]" fill="currentColor" aria-hidden />
              <span className="font-display text-[11px] font-extrabold leading-tight text-[#0d2a20]">
                Agissons
                <br />
                ensemble
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-2.5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.9fr)_minmax(0,1.2fr)]">
          <div className="flex items-center gap-2.5 rounded-[1.35rem] bg-white px-2.5 py-2 shadow-[0_14px_32px_-12px_rgba(13,59,46,0.38)] ring-1 ring-emerald-100 sm:px-3">
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
            <span className="hidden h-12 w-px bg-emerald-100 sm:block" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-[#0d2a20]">Notre performance</p>
              <TrendingUp className="mt-0.5 size-6 text-[#1f8a4d]" strokeWidth={2.4} aria-hidden />
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-[1.35rem] bg-white px-3 py-2 shadow-[0_14px_32px_-12px_rgba(13,59,46,0.38)] ring-1 ring-emerald-100">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#e7f8ee] text-[#1f8a4d] ring-1 ring-emerald-100">
              <Target className="size-5" strokeWidth={2.1} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className={cn("flex items-center gap-1.5 text-base font-extrabold leading-tight", objective.className)}>
                {objective.label}
                {gaugeStatus === "green" && hasWeighing ? (
                  <Check className="size-4" strokeWidth={3} aria-hidden />
                ) : null}
              </p>
              <p className="mt-0.5 text-sm font-semibold leading-snug text-[#2d4c3c]">
                {objective.detail}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-[1.35rem] bg-[#dff7e8] px-3 py-2 shadow-[0_14px_32px_-12px_rgba(13,59,46,0.32)] ring-1 ring-emerald-200/80">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#1f8a4d] shadow-sm">
              <CalendarDays className="size-5" strokeWidth={2.1} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-snug text-[#0d2a20]">
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
              <p className="mt-1 flex items-center gap-1.5 text-[12px] font-bold text-[#1f6b42]">
                <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                {formatPeriodEstimateFr(days)}
              </p>
            </div>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/70 text-[#1f8a4d]">
              <ArrowRight className="size-3.5" aria-hidden />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
