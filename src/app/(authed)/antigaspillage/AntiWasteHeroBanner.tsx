import { CalendarDays, Check, Leaf, Scale, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { AntiWasteGauge } from "./AntiWasteGauge";
import {
  formatPeriodEstimateFr,
  type GaugeStatus,
} from "./antiWasteFormat";

const OBJECTIVE_COPY: Record<GaugeStatus, { label: string; className: string }> = {
  green: {
    label: "Objectif atteint",
    className: "text-[#0d7a45]",
  },
  amber: {
    label: "À surveiller",
    className: "text-amber-700",
  },
  red: {
    label: "Objectif dépassé",
    className: "text-[color:var(--aw-coral)]",
  },
  none: {
    label: "Sans objectif",
    className: "text-zinc-600",
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
    : { label: "Pas encore de pesée", className: "text-zinc-600" };
  const kg =
    hasWeighing && gramsPer100 != null
      ? (gramsPer100 / 1000).toLocaleString("fr-FR", {
          maximumFractionDigits: 2,
        })
      : null;

  return (
    <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_16px_40px_-20px_rgba(13,59,46,0.22)] ring-1 ring-emerald-100/80">
      <div className="bg-[linear-gradient(135deg,#f4fbf6_0%,#ffffff_42%,#eef8f2_100%)] px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <span className="mt-0.5 flex size-12 shrink-0 items-center justify-center rounded-full bg-[#e8f8ef] text-[#0d7a45] ring-1 ring-emerald-100 sm:size-14">
              <Leaf className="size-6 sm:size-7" strokeWidth={2.1} aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-[1.45rem] font-extrabold leading-tight tracking-tight text-[#0d3b2e] sm:text-2xl">
                Lutte contre le gaspillage alimentaire
              </h1>
              <p className="mt-1 max-w-2xl text-sm font-medium text-zinc-600 sm:text-[0.95rem]">
                Ensemble, réduisons le gaspillage et préservons notre
                environnement.
              </p>
            </div>
          </div>
          <div className="flex size-[5.5rem] shrink-0 flex-col items-center justify-center rounded-full bg-white text-center shadow-[0_10px_28px_-12px_rgba(13,59,46,0.28)] ring-1 ring-emerald-100 sm:size-[6.25rem]">
            <Leaf className="mb-0.5 size-5 text-[#0d7a45]" aria-hidden />
            <span className="px-2 font-display text-[12px] font-extrabold leading-tight text-[#0d3b2e] sm:text-[13px]">
              Agissons
              <br />
              ensemble
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="flex items-center rounded-2xl bg-white/90 px-3 py-2 ring-1 ring-emerald-100/80 sm:px-3.5">
            <AntiWasteGauge
              size="sm"
              value={gramsPer100}
              objective={targetGPer100}
              status={gaugeStatus}
              emptyLabel="—"
            />
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl bg-white/90 px-3 py-2.5 ring-1 ring-emerald-100/80 sm:px-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e8f8ef] text-[#0d7a45]">
              <Target className="size-5" aria-hidden />
            </span>
            <p className={cn("text-sm font-extrabold", objective.className)}>
              {objective.label}
            </p>
            {gaugeStatus === "green" && hasWeighing ? (
              <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-[#0d7a45] text-white">
                <Check className="size-3" strokeWidth={3} aria-hidden />
              </span>
            ) : null}
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl bg-white/90 px-3 py-2.5 ring-1 ring-emerald-100/80 sm:col-span-2 sm:px-3.5 xl:col-span-1">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e8f8ef] text-[#0d7a45]">
              {kg ? (
                <Scale className="size-5" aria-hidden />
              ) : (
                <CalendarDays className="size-5" aria-hidden />
              )}
            </span>
            <div className="min-w-0 space-y-1 text-[12px] font-medium leading-snug text-zinc-600 sm:text-[13px]">
              <p>
                {kg ? (
                  <>
                    Pour 100 repas servis, environ{" "}
                    <span className="font-bold text-[#0d3b2e]">{kg} kg</span> de
                    nourriture ont été jetés sur la période.
                  </>
                ) : (
                  <>
                    Pas encore de pesée sur la période — le g / 100 apparaîtra dès
                    qu’un service sera pesé.
                  </>
                )}
              </p>
              <p className="flex items-start gap-1.5">
                <CalendarDays
                  className="mt-0.5 size-3.5 shrink-0 text-[#0d7a45]"
                  aria-hidden
                />
                {formatPeriodEstimateFr(days)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
