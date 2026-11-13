"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  Ban,
  BarChart3,
  CalendarDays,
  ChefHat,
  Info,
  Leaf,
  Lightbulb,
  Recycle,
  Repeat2,
  Scale,
  Sun,
  Trash2,
  TrendingUp,
  Users,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { DashboardDayDetailRow } from "@/lib/buildDashboardDayDetailRows";
import { formatServiceDateKey } from "@/lib/serviceDate";
import { schoolLevelLabelFr, type SchoolLevel } from "@/lib/schoolLevel";

type Totals = {
  present: number;
  served: number;
  rab: number;
  refused: number;
};

type KpiId = "present" | "served" | "rab" | "refused" | "waste";

function fmt(n: number) {
  return Math.round(n).toLocaleString("fr-FR");
}

function formatDayFr(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}

function formatDayLongFr(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

function capFirst(s: string) {
  return s ? `${s.charAt(0).toUpperCase()}${s.slice(1)}` : s;
}

function peakDay(
  rows: DashboardDayDetailRow[],
  pick: (r: DashboardDayDetailRow) => number,
) {
  if (rows.length === 0) return null;
  return rows.reduce((best, r) => (pick(r) > pick(best) ? r : best));
}

const WEEKDAY_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;

function shiftIsoDate(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return formatServiceDateKey(d);
}

function wasteGramsOfRow(row: DashboardDayDetailRow) {
  if (row.wasteWeightG > 0) return row.wasteWeightG;
  return row.wasteWeightMaternelleG + row.wasteWeightPrimaireG;
}

function mondayIndexFromIso(iso: string) {
  const day = new Date(`${iso}T12:00:00`).getDay();
  return day === 0 ? 6 : day - 1;
}

function WeekWasteChart({
  rows,
  days,
  periodTotal,
}: {
  rows: DashboardDayDetailRow[];
  days: 7 | 30;
  periodTotal: number;
}) {
  const byDate = new Map<string, number>();
  for (const row of rows) {
    byDate.set(row.date, (byDate.get(row.date) ?? 0) + wasteGramsOfRow(row));
  }
  const weekdayTotals = [0, 0, 0, 0, 0, 0, 0];
  for (const [date, grams] of byDate) {
    weekdayTotals[mondayIndexFromIso(date)] += grams;
  }
  const points = WEEKDAY_SHORT.map((label, i) => ({
    label,
    value: weekdayTotals[i] ?? 0,
  }));
  const sortedDates = [...byDate.keys()].sort();
  const endIso =
    sortedDates.at(-1) ?? formatServiceDateKey(new Date());
  const last7start = shiftIsoDate(endIso, -6);
  const prev7start = shiftIsoDate(endIso, -13);
  let last7 = 0;
  let prev7 = 0;
  for (const [date, grams] of byDate) {
    if (date >= last7start && date <= endIso) last7 += grams;
    else if (date >= prev7start && date < last7start) prev7 += grams;
  }
  const deltaPct = prev7 > 0 ? ((last7 - prev7) / prev7) * 100 : null;
  const peak = Math.max(0, ...points.map((p) => p.value));
  const yMax = Math.max(1000, Math.ceil((peak || 1) / 1000) * 1000);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMax * f));
  const periodLabel = days === 30 ? "sur 30 jours" : "sur 7 jours";

  return (
    <div className="rounded-[1.5rem] bg-white px-3 py-3 sm:px-4 sm:py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="inline-flex rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-orange-600">
            Évolution
          </p>
          <p className="mt-1.5 text-base font-extrabold tracking-tight text-zinc-950 sm:text-lg">
            Vos déchets cette semaine
          </p>
          <p className="mt-0.5 text-xs font-semibold text-zinc-600">
            Pesées de l’établissement {periodLabel}
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-[1.25rem] bg-[#e7f8ef] px-4 py-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0f9f4f] shadow-sm">
            <Scale className="size-5" strokeWidth={2.2} aria-hidden />
          </span>
          <div>
            <p className="font-display text-2xl font-extrabold leading-none tabular-nums tracking-tight text-zinc-950 sm:text-[1.7rem]">
              {fmt(periodTotal)} g
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs font-bold text-zinc-700">
              vs semaine d’avant
              {deltaPct != null ? (
                <span
                  className={cn(
                    "font-extrabold tabular-nums",
                    deltaPct > 0 ? "text-emerald-600" : "text-emerald-700",
                  )}
                >
                  {deltaPct > 0 ? "↑ +" : deltaPct < 0 ? "↓ " : "→ "}
                  {Math.abs(deltaPct).toLocaleString("fr-FR", {
                    maximumFractionDigits: 0,
                  })}{" "}
                  %
                </span>
              ) : null}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2.5">
        <div className="flex h-48 flex-col justify-between pb-7 text-right text-[10px] font-semibold tabular-nums text-zinc-400">
          {[...yTicks].reverse().map((tick) => (
            <span key={tick}>{tick.toLocaleString("fr-FR")} g</span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48">
            {yTicks.slice(1).map((tick) => (
              <div
                key={tick}
                className="absolute inset-x-0 border-t border-zinc-200/80"
                style={{ bottom: `${(tick / yMax) * 100}%` }}
              />
            ))}
          </div>
          <div className="flex h-48 items-end justify-between gap-2">
            {points.map((point) => {
              const h = yMax > 0 ? (point.value / yMax) * 100 : 0;
              const isPeak = peak > 0 && point.value === peak;
              return (
                <div
                  key={point.label}
                  className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                >
                  {point.value > 0 ? (
                    <p
                      className={cn(
                        "mb-1 text-[10px] font-extrabold tabular-nums",
                        isPeak ? "text-orange-500" : "text-zinc-700",
                      )}
                    >
                      {fmt(point.value)} g
                    </p>
                  ) : (
                    <span className="mb-1 h-4" />
                  )}
                  <div
                    className="w-[72%] max-w-[2.15rem] rounded-t-[10px]"
                    style={{
                      height: `${point.value > 0 ? Math.max(h, 10) : 0}%`,
                      background: isPeak
                        ? "linear-gradient(180deg, #fdba74 0%, #f97316 100%)"
                        : "linear-gradient(180deg, #86efac 0%, #22c55e 100%)",
                    }}
                    title={`${point.label} : ${fmt(point.value)} g`}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between gap-2 border-t border-zinc-200 pt-2">
            {points.map((point) => (
              <span
                key={`${point.label}-lbl`}
                className={cn(
                  "min-w-0 flex-1 text-center text-[11px] font-semibold",
                  peak > 0 && point.value === peak
                    ? "text-orange-600"
                    : "text-zinc-500",
                )}
              >
                {point.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WasteDetailPanel({
  days,
  levelNote,
  totalWasteWeightG,
  totalWasteMaternelleG,
  totalWastePrimaireG,
  wasteGramsPer100Served,
  peakWaste,
  perDayRows,
}: {
  days: 7 | 30;
  levelNote: string;
  totalWasteWeightG: number;
  totalWasteMaternelleG: number;
  totalWastePrimaireG: number;
  wasteGramsPer100Served: number | null;
  peakWaste: DashboardDayDetailRow | null;
  perDayRows: DashboardDayDetailRow[];
}) {
  const hasSplit = totalWasteMaternelleG > 0 || totalWastePrimaireG > 0;
  const peakLabel =
    peakWaste && peakWaste.wasteWeightG > 0
      ? `${capFirst(formatDayFr(peakWaste.date))}`
      : null;
  const recap =
    peakWaste && peakWaste.wasteWeightG > 0
      ? "Ce jour-là, le gaspillage a été particulièrement élevé. Pensez à ajuster les portions ou à adapter le menu."
      : "Les pesées apparaîtront ici dès le premier service.";

  return (
    <div className="relative overflow-hidden">
      <div className="relative px-5 pb-2 pt-5 sm:px-6">
        <RabLeafDecor className="pointer-events-none absolute -right-4 -top-6 h-28 w-40" />
        <div className="relative flex items-start gap-3 pr-10">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-orange-400 text-white shadow-sm">
            <Trash2 className="size-6" strokeWidth={2.4} aria-hidden />
          </span>
          <div className="min-w-0">
            <DialogTitle className="text-[1.75rem] font-extrabold leading-none tracking-tight text-zinc-950">
              Déchets (poids)
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-sm font-semibold text-zinc-800 sm:text-base">
              {totalWasteWeightG > 0
                ? `${fmt(totalWasteWeightG)} g pesés sur ${days} jours · ${levelNote}.`
                : `Pas encore de pesée sur ${days} jours · ${levelNote}.`}
            </DialogDescription>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-5 pb-5 pt-3 sm:px-6">
        <WeekWasteChart
          rows={perDayRows}
          days={days}
          periodTotal={totalWasteWeightG}
        />

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-[1.25rem] bg-[#e7f8ef] px-4 py-3.5">
            <div className="flex items-center gap-2">
              <Leaf className="size-4 text-[#0f9f4f]" strokeWidth={2.4} aria-hidden />
              <p className="text-sm font-extrabold text-[#0b3d24]">Répartition</p>
            </div>
            {hasSplit ? (
              <div className="mt-2 space-y-1.5">
                <p className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
                  <span className="size-2.5 rounded-full bg-sky-400" aria-hidden />
                  maternelle
                  <span className="ml-auto tabular-nums font-extrabold text-zinc-950">
                    {fmt(totalWasteMaternelleG)} g
                  </span>
                </p>
                <p className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
                  <span className="size-2.5 rounded-full bg-emerald-500" aria-hidden />
                  primaire
                  <span className="ml-auto tabular-nums font-extrabold text-zinc-950">
                    {fmt(totalWastePrimaireG)} g
                  </span>
                </p>
              </div>
            ) : (
              <p className="mt-2 text-xs font-bold leading-snug text-zinc-700">
                Indiquez maternelle et primaire à la pesée de fin de service.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 rounded-[1.25rem] bg-[#e7f8ef] px-4 py-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0f9f4f] shadow-sm">
              <Recycle className="size-5" strokeWidth={2.2} aria-hidden />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-[#047857]">Soit</p>
              <p className="font-display text-2xl font-extrabold leading-none tabular-nums tracking-tight text-zinc-950">
                {wasteGramsPer100Served != null
                  ? `${fmt(wasteGramsPer100Served)} g`
                  : "—"}
              </p>
              <p className="mt-1 text-xs font-bold leading-snug text-zinc-700">
                de déchets pour
                <span className="block">100 assiettes servies</span>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-[1.25rem] bg-[#e7f8ef] px-4 py-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0f9f4f] shadow-sm">
              <CalendarDays className="size-5" strokeWidth={2.2} aria-hidden />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-[#047857]">Jour le plus lourd</p>
              <p className="text-sm font-extrabold leading-snug text-zinc-950 sm:text-[1.05rem]">
                {peakLabel ?? "Pas encore de jour de pointe"}
              </p>
              {peakWaste && peakWaste.wasteWeightG > 0 ? (
                <p className="mt-0.5 text-xs font-bold text-zinc-800">
                  — {fmt(peakWaste.wasteWeightG)} g
                  {peakWaste.wasteGramsPer100 != null
                    ? ` (${peakWaste.wasteGramsPer100.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} g / 100)`
                    : ""}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[1.25rem] bg-[#e7f8ef] px-4 py-3.5">
          <RabLeafDecor className="pointer-events-none absolute -bottom-6 -right-4 h-20 w-28 opacity-80" />
          <div className="relative flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-[#0f9f4f] shadow-sm">
              <Lightbulb className="size-4" strokeWidth={2.3} aria-hidden />
            </span>
            <div>
              <p className="text-base font-extrabold text-[#047857]">À retenir</p>
              <p className="mt-0.5 text-sm font-bold leading-snug text-[#052e16]">
                {recap}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RefusalRateDonut({
  refused,
  served,
}: {
  refused: number;
  served: number;
}) {
  const ratePct = served > 0 ? (refused / served) * 100 : 0;
  const cx = 70;
  const cy = 70;
  const r = 52;
  const stroke = 16;
  const circ = 2 * Math.PI * r;
  const frac = Math.min(Math.max(ratePct / 100, 0), 1);
  const rateLabel = ratePct.toLocaleString("fr-FR", {
    maximumFractionDigits: 1,
  });

  return (
    <div className="relative size-[148px] shrink-0">
      <svg viewBox="0 0 140 140" className="size-full -rotate-90" aria-hidden>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#e4e4e7"
          strokeWidth={stroke}
        />
        {frac > 0 ? (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#fb7185"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circ * frac} ${circ}`}
          />
        ) : null}
      </svg>
      <div className="pointer-events-none absolute inset-[16%] flex flex-col items-center justify-center text-center">
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-zinc-700">Taux</p>
        <p className="text-[1.65rem] font-extrabold tabular-nums leading-none text-zinc-950">
          {rateLabel} %
        </p>
        <span className="mt-1 flex size-7 items-center justify-center rounded-full bg-[#ffe4ec] text-[#fb7185]">
          <TrendingUp className="size-3.5" strokeWidth={2.6} aria-hidden />
        </span>
      </div>
    </div>
  );
}

function KpiDialogClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="absolute right-4 top-4 z-30 flex size-8 items-center justify-center rounded-full bg-white text-zinc-500 shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50 hover:text-zinc-800"
      aria-label="Fermer"
    >
      <X className="size-4" />
    </button>
  );
}

function RabLeafDecor({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 120"
      className={className}
      aria-hidden
    >
      <ellipse cx="118" cy="38" rx="42" ry="28" fill="#bbf7d0" />
      <ellipse cx="148" cy="18" rx="28" ry="20" fill="#86efac" />
      <path
        d="M22 108c18-28 48-38 72-22-8 22-32 34-56 28-8-2-14-4-16-6Z"
        fill="#bbf7d0"
      />
      <path
        d="M88 92c16-10 34-8 46 4-12 12-30 14-44 8-2-2-2-8-2-12Z"
        fill="#86efac"
      />
    </svg>
  );
}

function RabDetailPanel({
  rabCount,
  rabRatePct,
  peakLabel,
}: {
  rabCount: number;
  rabRatePct: string;
  peakLabel: string | null;
}) {
  return (
    <div className="relative overflow-hidden">
      <div className="relative px-5 pb-2 pt-5 sm:px-6">
        <RabLeafDecor className="pointer-events-none absolute -right-4 -top-6 h-28 w-40" />
        <div className="relative flex items-start gap-3 pr-10">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#0f9f4f] text-white shadow-sm">
            <Repeat2 className="size-6" strokeWidth={2.4} aria-hidden />
          </span>
          <div className="min-w-0">
            <DialogTitle className="text-[1.75rem] font-extrabold leading-none tracking-tight text-zinc-950">
              RAB
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-sm font-semibold text-zinc-800 sm:text-base">
              {fmt(rabCount)} RAB · {rabRatePct} des assiettes servies.
            </DialogDescription>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-5 pb-5 pt-3 sm:px-6">
        <div className="flex flex-col gap-3 rounded-[1.35rem] bg-[#e7f8ef] px-4 py-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0f9f4f] shadow-sm">
              <UtensilsCrossed className="size-5" strokeWidth={2.2} aria-hidden />
            </span>
            <div>
              <p className="font-display text-3xl font-extrabold leading-none tabular-nums tracking-tight text-[#0b3d24]">
                {rabRatePct}
              </p>
              <p className="mt-1 text-sm font-bold text-[#14532d]">
                des assiettes sont des RAB
              </p>
            </div>
          </div>
          <span className="hidden h-12 w-px bg-[#b7e4c7] sm:block" aria-hidden />
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0f9f4f] shadow-sm">
              <CalendarDays className="size-5" strokeWidth={2.2} aria-hidden />
            </span>
            <div>
              <p className="text-sm font-bold text-[#14532d]">
                Jour le plus de RAB
              </p>
              <p className="mt-0.5 text-sm font-extrabold leading-snug text-[#0b3d24]">
                {peakLabel ?? "Pas encore de jour de pointe"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-[1.25rem] bg-zinc-50 px-4 py-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <Info className="size-4" strokeWidth={2.4} aria-hidden />
          </span>
          <p className="text-sm font-bold leading-snug text-zinc-950">
            RAB = assiettes adaptées ou resservies
            <span className="mt-0.5 block font-semibold text-zinc-700">
              (petite faim, deuxième service, etc.).
            </span>
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-[1.25rem] bg-zinc-50 px-4 py-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-500">
            <Lightbulb className="size-4" strokeWidth={2.4} aria-hidden />
          </span>
          <p className="text-sm font-bold leading-snug text-zinc-950">
            Un RAB régulier aide à limiter les restes,
            <span className="mt-0.5 block font-semibold text-zinc-800">
              sans remplacer la pesée des déchets.
            </span>
          </p>
        </div>

        <div className="relative overflow-hidden rounded-[1.25rem] bg-[#e7f8ef] px-4 py-3.5">
          <RabLeafDecor className="pointer-events-none absolute -bottom-6 -right-4 h-20 w-28 opacity-80" />
          <div className="relative flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-[#0f9f4f] shadow-sm">
              <Leaf className="size-4" strokeWidth={2.3} aria-hidden />
            </span>
            <div>
              <p className="text-base font-extrabold text-[#047857]">À retenir</p>
              <p className="mt-0.5 text-sm font-bold leading-snug text-[#052e16]">
                {peakLabel
                  ? `Jour le plus de RAB : ${peakLabel.charAt(0).toLowerCase()}${peakLabel.slice(1)}.`
                  : "Saisissez les RAB pour voir le jour le plus marqué."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServedDetailPanel({
  served,
  servedVsPresentPct,
  leftover,
  avgServed,
  daysServed,
  peakServed,
}: {
  served: number;
  servedVsPresentPct: string;
  leftover: number;
  avgServed: number;
  daysServed: number;
  peakServed: DashboardDayDetailRow | null;
}) {
  const peakShort =
    peakServed && peakServed.served > 0
      ? `${capFirst(formatDayFr(peakServed.date))} – ${fmt(peakServed.served)} assiettes`
      : null;
  const recap =
    daysServed > 0 && peakServed && peakServed.served > 0
      ? `En moyenne, ${fmt(avgServed)} assiettes sont servies par jour, avec un pic à ${fmt(peakServed.served)} assiettes le ${formatDayLongFr(peakServed.date)}.`
      : daysServed > 0
        ? `En moyenne, ${fmt(avgServed)} assiettes sont servies par jour de service.`
        : "Les assiettes servies apparaîtront ici dès les premières saisies.";

  return (
    <div className="relative overflow-hidden">
      <div className="relative px-5 pb-2 pt-5 sm:px-6">
        <RabLeafDecor className="pointer-events-none absolute -right-4 -top-6 h-28 w-40" />
        <div className="relative flex items-start gap-3 pr-10">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#0f9f4f] text-white shadow-sm">
            <UtensilsCrossed className="size-6" strokeWidth={2.4} aria-hidden />
          </span>
          <div className="min-w-0">
            <DialogTitle className="text-[1.75rem] font-extrabold leading-none tracking-tight text-zinc-950">
              Assiettes servies
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-sm font-semibold text-zinc-800 sm:text-base">
              {fmt(served)} assiettes servies · {servedVsPresentPct} des présents.
            </DialogDescription>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-5 pb-5 pt-3 sm:px-6">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-[1.25rem] bg-[#e7f8ef] px-3.5 py-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0f9f4f] shadow-sm">
              <Users className="size-5" strokeWidth={2.2} aria-hidden />
            </span>
            <span className="h-10 w-px bg-[#b7e4c7]" aria-hidden />
            <div>
              <p className="font-display text-2xl font-extrabold leading-none tabular-nums tracking-tight text-[#0b3d24]">
                {servedVsPresentPct}
              </p>
              <p className="mt-1 text-xs font-bold text-[#14532d]">des présents</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-[1.25rem] bg-[#e7f3ff] px-3.5 py-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm">
              <UtensilsCrossed className="size-5" strokeWidth={2.2} aria-hidden />
            </span>
            <span className="h-10 w-px bg-sky-200" aria-hidden />
            <div>
              <p className="font-display text-2xl font-extrabold leading-none tabular-nums tracking-tight text-zinc-950">
                {fmt(served)}
              </p>
              <p className="mt-1 text-xs font-bold text-sky-800">assiettes servies</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-[1.25rem] bg-[#fff6ea] px-3.5 py-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#c2410c] shadow-sm">
              <CalendarDays className="size-5" strokeWidth={2.2} aria-hidden />
            </span>
            <span className="h-10 w-px bg-[#f3d5b3]" aria-hidden />
            <div>
              <p className="font-display text-2xl font-extrabold leading-none tabular-nums tracking-tight text-[#9a3412]">
                {fmt(leftover)}
              </p>
              <p className="mt-1 text-xs font-bold leading-snug text-[#9a3412]">
                présents non comptés
                <span className="block">(écart présents / servis)</span>
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#e7f8ef] px-3 py-1 text-xs font-extrabold text-[#047857]">
            <BarChart3 className="size-3.5" aria-hidden />
            Détails par service
          </p>
          <div className="flex flex-col gap-3 rounded-[1.35rem] bg-zinc-50 px-4 py-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#e7f8ef] text-[#0f9f4f]">
                <Sun className="size-5" strokeWidth={2.2} aria-hidden />
              </span>
              <div>
                <p className="text-sm font-bold text-zinc-700">Moyenne</p>
                <p className="text-lg font-extrabold leading-tight text-zinc-950">
                  {daysServed > 0 ? `${fmt(avgServed)} assiettes` : "—"}
                </p>
                <p className="text-xs font-bold text-zinc-700">par jour de service</p>
              </div>
            </div>
            <span className="hidden h-12 w-px bg-zinc-200 sm:block" aria-hidden />
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#e7f8ef] text-[#0f9f4f]">
                <CalendarDays className="size-5" strokeWidth={2.2} aria-hidden />
              </span>
              <div>
                <p className="text-sm font-bold text-zinc-700">Jour le plus servi</p>
                <p className="text-sm font-extrabold leading-snug text-zinc-950 sm:text-[1.05rem]">
                  {peakShort ?? "Pas encore de jour de pointe"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[1.25rem] bg-[#e7f8ef] px-4 py-3.5">
          <RabLeafDecor className="pointer-events-none absolute -bottom-6 -right-4 h-20 w-28 opacity-80" />
          <div className="relative flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-[#0f9f4f] shadow-sm">
              <Lightbulb className="size-4" strokeWidth={2.3} aria-hidden />
            </span>
            <div>
              <p className="text-base font-extrabold text-[#047857]">À retenir</p>
              <p className="mt-0.5 text-sm font-bold leading-snug text-[#052e16]">
                {recap}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PresentDetailPanel({
  present,
  days,
  levelNote,
  avgPresent,
  daysPresent,
  peakPresent,
}: {
  present: number;
  days: 7 | 30;
  levelNote: string;
  avgPresent: number;
  daysPresent: number;
  peakPresent: DashboardDayDetailRow | null;
}) {
  const peakCount =
    peakPresent && peakPresent.present > 0 ? peakPresent.present : 0;
  const peakMeal =
    peakPresent && peakPresent.present > 0 ? peakPresent.mealLabel : null;
  const peakShort =
    peakPresent && peakPresent.present > 0
      ? `${capFirst(formatDayFr(peakPresent.date))} — ${fmt(peakPresent.present)} présents (${peakPresent.mealLabel})`
      : null;

  return (
    <div className="relative overflow-hidden">
      <div className="relative px-5 pb-2 pt-5 sm:px-6">
        <RabLeafDecor className="pointer-events-none absolute -right-4 -top-6 h-28 w-40" />
        <div className="relative flex items-start gap-3 pr-10">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#0f9f4f] text-white shadow-sm">
            <Users className="size-6" strokeWidth={2.4} aria-hidden />
          </span>
          <div className="min-w-0">
            <DialogTitle className="text-[1.75rem] font-extrabold leading-none tracking-tight text-zinc-950">
              Élèves présents
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-sm font-semibold text-zinc-800 sm:text-base">
              {fmt(present)} présents sur {days} jours · {levelNote}.
            </DialogDescription>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-5 pb-5 pt-3 sm:px-6">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-[1.25rem] bg-[#e7f8ef] px-3.5 py-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0f9f4f] shadow-sm">
              <Users className="size-5" strokeWidth={2.2} aria-hidden />
            </span>
            <span className="h-10 w-px bg-[#b7e4c7]" aria-hidden />
            <div>
              <p className="font-display text-2xl font-extrabold leading-none tabular-nums tracking-tight text-[#0b3d24]">
                {fmt(present)}
              </p>
              <p className="mt-1 text-xs font-bold leading-snug text-[#14532d]">
                élèves présents
                <span className="block">sur {days} jours</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-[1.25rem] bg-[#e7f3ff] px-3.5 py-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm">
              <CalendarDays className="size-5" strokeWidth={2.2} aria-hidden />
            </span>
            <span className="h-10 w-px bg-sky-200" aria-hidden />
            <div>
              <p className="font-display text-2xl font-extrabold leading-none tabular-nums tracking-tight text-zinc-950">
                {daysPresent > 0 ? fmt(avgPresent) : "—"}
              </p>
              <p className="mt-1 text-xs font-bold leading-snug text-sky-800">
                par jour
                <span className="block">en moyenne</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-[1.25rem] bg-[#fff6ea] px-3.5 py-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#c2410c] shadow-sm">
              <ChefHat className="size-5" strokeWidth={2.2} aria-hidden />
            </span>
            <span className="h-10 w-px bg-[#f3d5b3]" aria-hidden />
            <div>
              <p className="font-display text-2xl font-extrabold leading-none tabular-nums tracking-tight text-[#9a3412]">
                {peakCount > 0 ? fmt(peakCount) : "—"}
              </p>
              <p className="mt-1 text-xs font-bold leading-snug text-[#9a3412]">
                le jour le plus chargé
                {peakMeal ? (
                  <span className="block">({peakMeal})</span>
                ) : null}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-[1.25rem] bg-zinc-50 px-4 py-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#e7f8ef] text-[#0f9f4f]">
            <CalendarDays className="size-5" strokeWidth={2.2} aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold text-zinc-700">Moyenne</p>
            <p className="text-sm font-extrabold leading-snug text-zinc-950 sm:text-[1.05rem]">
              {daysPresent > 0
                ? `${fmt(avgPresent)} présents par jour de service (${daysPresent} jour${daysPresent > 1 ? "s" : ""}).`
                : "Aucun présent saisi sur la période."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-[1.25rem] bg-zinc-50 px-4 py-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#e7f8ef] text-[#0f9f4f]">
            <UtensilsCrossed className="size-5" strokeWidth={2.2} aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold text-zinc-700">Jour le plus chargé</p>
            <p className="text-sm font-extrabold leading-snug text-zinc-950 sm:text-[1.05rem]">
              {peakShort ?? "Pas encore de jour de pointe."}
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[1.25rem] bg-[#e7f8ef] px-4 py-3.5">
          <RabLeafDecor className="pointer-events-none absolute -bottom-6 -right-4 h-20 w-28 opacity-80" />
          <div className="relative flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-[#0f9f4f] shadow-sm">
              <Lightbulb className="size-4" strokeWidth={2.3} aria-hidden />
            </span>
            <div>
              <p className="text-base font-extrabold text-[#047857]">À retenir</p>
              <p className="mt-0.5 text-sm font-bold leading-snug text-[#052e16]">
                Ce chiffre vient des compteurs cuisine par classe, le jour du
                service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RefusedDetailPanel({
  refused,
  served,
  refusalRatePct,
  peakLabel,
}: {
  refused: number;
  served: number;
  refusalRatePct: string;
  peakLabel: string | null;
}) {
  const restPct =
    served > 0 ? Math.max(0, 100 - (refused / served) * 100) : 100;
  const restLabel = restPct.toLocaleString("fr-FR", {
    maximumFractionDigits: 1,
  });

  return (
    <div className="relative overflow-hidden">
      <div className="relative px-5 pb-2 pt-5 sm:px-6">
        <RabLeafDecor className="pointer-events-none absolute -right-4 -top-6 h-28 w-40" />
        <div className="relative flex items-start gap-3 pr-10">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#fb7185] text-white shadow-sm">
            <Ban className="size-6" strokeWidth={2.4} aria-hidden />
          </span>
          <div className="min-w-0">
            <DialogTitle className="text-[1.75rem] font-extrabold leading-none tracking-tight text-zinc-950">
              Refus
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-sm font-semibold text-zinc-800 sm:text-base">
              {fmt(refused)} refus · taux {refusalRatePct}.
            </DialogDescription>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-5 pb-5 pt-3 sm:px-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.15fr)] sm:items-stretch">
          <div className="flex items-center justify-center rounded-[1.35rem] bg-white px-2 py-2">
            <RefusalRateDonut refused={refused} served={served} />
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-1 items-center gap-3 rounded-[1.25rem] bg-[#ffe8ee] px-3.5 py-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#fb7185] shadow-sm">
                <X className="size-4" strokeWidth={2.6} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-[#be123c]">Refus</p>
                <p className="font-display text-2xl font-extrabold leading-none tabular-nums tracking-tight text-zinc-950">
                  {fmt(refused)}
                </p>
                <p className="mt-0.5 text-xs font-bold text-zinc-700">
                  soit {refusalRatePct} du total
                </p>
              </div>
            </div>
            <div className="flex flex-1 items-center gap-3 rounded-[1.25rem] bg-[#e7f8ef] px-3.5 py-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#0f9f4f] shadow-sm">
                <UtensilsCrossed className="size-4" strokeWidth={2.4} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-[#14532d]">
                  Autres assiettes
                </p>
                <p className="font-display text-2xl font-extrabold leading-none tabular-nums tracking-tight text-zinc-950">
                  {restLabel} %
                </p>
                <p className="mt-0.5 text-xs font-bold text-zinc-700">
                  du total
                </p>
              </div>
            </div>
          </div>

          <div className="min-w-0 rounded-[1.25rem] bg-[#e7f8ef] px-4 py-3.5">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-[#0f9f4f] shadow-sm">
                <Lightbulb className="size-4" strokeWidth={2.3} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-base font-extrabold text-[#047857]">À retenir</p>
                <p className="mt-1 text-sm font-bold leading-relaxed text-[#052e16]">
                  Un refus, c’est un élève qui n’a pas pris (ou a rendu) le plat
                  ce jour-là.
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-[#0f9f4f] shadow-sm">
                <CalendarDays className="size-4" strokeWidth={2.3} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-[#047857]">
                  Jour le plus de refus
                </p>
                <p className="mt-0.5 text-sm font-bold leading-relaxed text-[#052e16]">
                  {peakLabel ?? "Aucun refus saisi sur la période."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[1.25rem] bg-[#e7f8ef] px-4 py-3.5">
          <RabLeafDecor className="pointer-events-none absolute -bottom-6 -right-4 h-20 w-28 opacity-80" />
          <div className="relative flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-[#0f9f4f] shadow-sm">
              <TrendingUp className="size-4" strokeWidth={2.4} aria-hidden />
            </span>
            <p className="text-sm font-bold leading-relaxed text-[#052e16]">
              Utile pour{" "}
              <span className="font-extrabold">ajuster le menu</span> du
              lendemain, surtout si le même plat revient.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LevelFill({
  level,
  children,
}: {
  level: "MATERNELLE" | "PRIMAIRE";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 font-extrabold",
        level === "MATERNELLE"
          ? "bg-sky-400 text-sky-950"
          : "bg-emerald-400 text-emerald-950",
      )}
    >
      {children}
    </span>
  );
}

export function KitchenDashboardKpis({
  days,
  levelFilter,
  totals,
  servedVsPresentPct,
  rabRatePct,
  refusalRatePct,
  totalWasteWeightG,
  totalWasteMaternelleG,
  totalWastePrimaireG,
  wasteGramsPer100Served,
  servicesWithWaste,
  perDayRows,
}: {
  days: 7 | 30;
  levelFilter: "all" | SchoolLevel;
  totals: Totals;
  servedVsPresentPct: string;
  rabRatePct: string;
  refusalRatePct: string;
  totalWasteWeightG: number;
  totalWasteMaternelleG: number;
  totalWastePrimaireG: number;
  wasteGramsPer100Served: number | null;
  servicesWithWaste: number;
  perDayRows: DashboardDayDetailRow[];
}) {
  const [open, setOpen] = useState<KpiId | null>(null);
  const levelNote =
    levelFilter === "all"
      ? "Tous niveaux"
      : schoolLevelLabelFr(levelFilter);
  const daysServed = perDayRows.filter((r) => r.served > 0).length;
  const daysPresent = perDayRows.filter((r) => r.present > 0).length;
  const peakPresent = peakDay(perDayRows, (r) => r.present);
  const peakServed = peakDay(perDayRows, (r) => r.served);
  const peakRab = peakDay(perDayRows, (r) => r.rab);
  const peakRefused = peakDay(perDayRows, (r) => r.refused);
  const peakWaste = peakDay(perDayRows, (r) => r.wasteWeightG);
  const avgPresent = daysPresent > 0 ? totals.present / daysPresent : 0;
  const avgServed = daysServed > 0 ? totals.served / daysServed : 0;
  const leftover =
    totals.present > totals.served ? totals.present - totals.served : 0;

  const cards: {
    id: KpiId;
    icon: LucideIcon;
    label: string;
    value: string;
    sub: string;
    accent: string;
    iconWrap: string;
    link: string;
  }[] = [
    {
      id: "present",
      icon: Users,
      label: "Élèves présents",
      value: fmt(totals.present),
      sub: `${daysPresent} jour${daysPresent > 1 ? "s" : ""} de service`,
      accent: "bg-white",
      iconWrap: "bg-emerald-500 text-white",
      link: "text-emerald-600",
    },
    {
      id: "served",
      icon: UtensilsCrossed,
      label: "Assiettes servies",
      value: fmt(totals.served),
      sub: `${servedVsPresentPct} des présents`,
      accent: "bg-[#eafbf1]",
      iconWrap: "bg-emerald-600 text-white",
      link: "text-emerald-700",
    },
    {
      id: "rab",
      icon: Repeat2,
      label: "RAB",
      value: fmt(totals.rab),
      sub: `${rabRatePct} des servis`,
      accent: "bg-[#e7f6fb]",
      iconWrap: "bg-sky-400 text-white",
      link: "text-sky-500",
    },
    {
      id: "refused",
      icon: Ban,
      label: "Refus",
      value: fmt(totals.refused),
      sub: `Taux ${refusalRatePct}`,
      accent: "bg-[#fdecef]",
      iconWrap: "bg-rose-400 text-white",
      link: "text-rose-500",
    },
    {
      id: "waste",
      icon: Trash2,
      label: "Déchets (poids)",
      value:
        totalWasteWeightG > 0 ? `${fmt(totalWasteWeightG)} g` : "—",
      sub:
        wasteGramsPer100Served != null
          ? `${wasteGramsPer100Served.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} g / 100`
          : "Pesée en fin de service",
      accent: "bg-[#fff6e8]",
      iconWrap: "bg-amber-400 text-white",
      link: "text-amber-500",
    },
  ];

  const details: Record<
    KpiId,
    { title: string; lead: ReactNode; lines: ReactNode[] }
  > = {
    present: {
      title: "Élèves présents",
      lead: (
        <>
          {fmt(totals.present)} présents sur {days} jours ·{" "}
          {levelFilter === "all" ? (
            levelNote
          ) : (
            <LevelFill level={levelFilter}>{levelNote}</LevelFill>
          )}
          .
        </>
      ),
      lines: [
        daysPresent > 0
          ? `Moyenne : ${fmt(avgPresent)} présents par jour de service (${daysPresent} jour${daysPresent > 1 ? "s" : ""}).`
          : "Aucun présent saisi sur la période.",
        peakPresent && peakPresent.present > 0
          ? `Jour le plus chargé : ${formatDayFr(peakPresent.date)} — ${fmt(peakPresent.present)} présents (${peakPresent.mealLabel}).`
          : "Pas encore de jour de pointe.",
        "Ce chiffre vient des compteurs cuisine par classe, le jour du service.",
      ],
    },
    served: {
      title: "Assiettes servies",
      lead: `${fmt(totals.served)} assiettes servies · ${servedVsPresentPct} des présents.`,
      lines: [
        leftover > 0
          ? `${fmt(leftover)} présents n’ont pas été comptés comme servis (écart présents / servis).`
          : "Les assiettes servies couvrent (ou dépassent) les présents saisis.",
        daysServed > 0
          ? `Moyenne : ${fmt(avgServed)} assiettes par jour de service.`
          : "Aucune assiette servie saisie.",
        peakServed && peakServed.served > 0
          ? `Jour le plus servi : ${formatDayFr(peakServed.date)} — ${fmt(peakServed.served)} assiettes.`
          : "Pas encore de jour de pointe.",
      ],
    },
    rab: {
      title: "RAB",
      lead: `${fmt(totals.rab)} RAB · ${rabRatePct} des assiettes servies.`,
      lines: [
        "RAB = assiettes adaptées ou resservies (petite faim, deuxième service, etc.).",
        peakRab && peakRab.rab > 0
          ? `Jour le plus de RAB : ${formatDayFr(peakRab.date)} — ${fmt(peakRab.rab)} (${peakRab.rabRatePct != null ? `${peakRab.rabRatePct.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %` : "taux n.d."}).`
          : "Aucun RAB saisi sur la période.",
        totals.served > 0
          ? "Un RAB régulier aide à limiter les restes, sans remplacer la pesée des déchets."
          : "Saisissez les servis pour calculer le taux de RAB.",
      ],
    },
    refused: {
      title: "Refus",
      lead: `${fmt(totals.refused)} refus · taux ${refusalRatePct}.`,
      lines: [
        "Un refus, c’est un élève qui n’a pas pris (ou a rendu) le plat ce jour-là.",
        peakRefused && peakRefused.refused > 0
          ? `Jour le plus de refus : ${formatDayFr(peakRefused.date)} — ${fmt(peakRefused.refused)} (${peakRefused.refusalRatePct != null ? `${peakRefused.refusalRatePct.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %` : "taux n.d."}).`
          : "Aucun refus saisi sur la période.",
        "Utile pour ajuster le menu du lendemain, surtout si le même plat revient.",
      ],
    },
    waste: {
      title: "Déchets (poids)",
      lead:
        totalWasteWeightG > 0 ? (
          <>
            {fmt(totalWasteWeightG)} g pesés sur {days} jours ·{" "}
            {levelFilter === "all" ? (
              levelNote
            ) : (
              <LevelFill level={levelFilter}>{levelNote}</LevelFill>
            )}
            .
          </>
        ) : (
          "Pas encore de pesée sur la période."
        ),
      lines: [
        totalWasteMaternelleG > 0 || totalWastePrimaireG > 0 ? (
          <span className="flex flex-wrap items-center gap-2">
            <span>Répartition :</span>
            <LevelFill level="MATERNELLE">
              maternelle {fmt(totalWasteMaternelleG)} g
            </LevelFill>
            <LevelFill level="PRIMAIRE">
              primaire {fmt(totalWastePrimaireG)} g
            </LevelFill>
          </span>
        ) : (
          <span className="flex flex-wrap items-center gap-2">
            <span>Indiquez</span>
            <LevelFill level="MATERNELLE">maternelle</LevelFill>
            <span>et</span>
            <LevelFill level="PRIMAIRE">primaire</LevelFill>
            <span>à la pesée de fin de service.</span>
          </span>
        ),
        wasteGramsPer100Served != null
          ? `Soit ${wasteGramsPer100Served.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} g de déchets pour 100 assiettes servies.`
          : "Le g / 100 apparaît dès qu’une pesée et des assiettes servies sont saisies.",
        peakWaste && peakWaste.wasteWeightG > 0
          ? `Jour le plus lourd : ${formatDayFr(peakWaste.date)} — ${fmt(peakWaste.wasteWeightG)} g${peakWaste.wasteGramsPer100 != null ? ` (${peakWaste.wasteGramsPer100.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} g / 100)` : ""}.`
          : `${servicesWithWaste} service${servicesWithWaste > 1 ? "s" : ""} avec pesée.`,
      ],
    },
  };

  const active = open ? details[open] : null;
  const activeCard = open ? cards.find((c) => c.id === open) : null;
  const ActiveIcon = activeCard?.icon;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 overflow-visible lg:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setOpen(card.id)}
              className={cn(
                "group relative z-0 cursor-pointer rounded-[26px] p-4 text-left shadow-[0_12px_28px_-18px_rgba(24,24,27,0.28)] transition-transform duration-200 ease-out hover:z-10 hover:scale-[1.04] hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:scale-100",
                card.accent,
              )}
            >
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-full transition-transform duration-200 ease-out group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100",
                  card.iconWrap,
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <p className="mt-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-zinc-950">
                {card.label}
              </p>
              <p className="mt-1 font-display text-[2rem] font-extrabold leading-none tabular-nums tracking-tight text-zinc-950">
                {card.value}
              </p>
              <p className="mt-2 text-sm font-medium leading-snug text-zinc-600">
                {card.sub}
              </p>
              <p
                className={cn(
                  "mt-4 inline-flex items-center gap-1 text-xs font-bold",
                  card.link,
                )}
              >
                Voir le détail
                <ArrowRight
                  className="size-3.5 transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                  aria-hidden
                />
              </p>
            </button>
          );
        })}
      </div>

      <Dialog open={open != null} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            "z-[100] rounded-3xl",
            open === "rab" ||
              open === "served" ||
              open === "present" ||
              open === "refused" ||
              open === "waste"
              ? "gap-0 overflow-hidden border-0 p-0 shadow-[0_24px_60px_-24px_rgba(15,60,40,0.45)]"
              : "border-2 border-zinc-900",
            open === "refused"
              ? "max-w-3xl sm:max-w-3xl"
              : open === "waste"
                ? "max-w-3xl sm:max-w-3xl"
                : open === "served" || open === "present"
                  ? "max-w-2xl sm:max-w-2xl"
                  : open === "rab"
                    ? "max-w-lg sm:max-w-lg"
                    : "max-w-md sm:max-w-md",
          )}
          overlayClassName="z-[100]"
        >
          <KpiDialogClose onClose={() => setOpen(null)} />
          {open === "rab" ? (
            <RabDetailPanel
              rabCount={totals.rab}
              rabRatePct={rabRatePct}
              peakLabel={
                peakRab && peakRab.rab > 0
                  ? `${capFirst(formatDayFr(peakRab.date))} — ${fmt(peakRab.rab)}${
                      peakRab.rabRatePct != null
                        ? ` (${peakRab.rabRatePct.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %)`
                        : ""
                    }`
                  : null
              }
            />
          ) : open === "served" ? (
            <ServedDetailPanel
              served={totals.served}
              servedVsPresentPct={servedVsPresentPct}
              leftover={leftover}
              avgServed={avgServed}
              daysServed={daysServed}
              peakServed={peakServed}
            />
          ) : open === "present" ? (
            <PresentDetailPanel
              present={totals.present}
              days={days}
              levelNote={levelNote}
              avgPresent={avgPresent}
              daysPresent={daysPresent}
              peakPresent={peakPresent}
            />
          ) : open === "refused" ? (
            <RefusedDetailPanel
              refused={totals.refused}
              served={totals.served}
              refusalRatePct={refusalRatePct}
              peakLabel={
                peakRefused && peakRefused.refused > 0
                  ? `${capFirst(formatDayFr(peakRefused.date))} — ${fmt(peakRefused.refused)}${
                      peakRefused.refusalRatePct != null
                        ? ` (${peakRefused.refusalRatePct.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %)`
                        : ""
                    }`
                  : null
              }
            />
          ) : open === "waste" ? (
            <WasteDetailPanel
              days={days}
              levelNote={levelNote}
              totalWasteWeightG={totalWasteWeightG}
              totalWasteMaternelleG={totalWasteMaternelleG}
              totalWastePrimaireG={totalWastePrimaireG}
              wasteGramsPer100Served={wasteGramsPer100Served}
              peakWaste={peakWaste}
              perDayRows={perDayRows}
            />
          ) : active && activeCard && ActiveIcon ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-extrabold text-zinc-950">
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full",
                      activeCard.iconWrap,
                    )}
                  >
                    <ActiveIcon className="size-4" aria-hidden />
                  </span>
                  {active.title}
                </DialogTitle>
                <DialogDescription className="text-base font-semibold leading-relaxed text-zinc-800">
                  {active.lead}
                </DialogDescription>
              </DialogHeader>
              <ul className="space-y-2.5">
                {active.lines.map((line, i) => (
                  <li
                    key={i}
                    className="rounded-2xl bg-zinc-50 px-3.5 py-3 text-base font-semibold leading-snug text-zinc-950"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
