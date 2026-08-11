"use client";

import { AlertTriangle, Recycle } from "lucide-react";
import { WasteEvolutionChart } from "@/components/dashboard/WasteEvolutionChart";
import type { WastePerDayRowInput } from "@/lib/buildWasteEvolutionSeries";
import { antiWasteStatus } from "@/lib/antiWasteStatus";
import type { RiskyDishRow } from "@/lib/antiWasteRiskyDishes";
import {
  CANTINE_PLUS_MIDNIGHT,
  CANTINE_PLUS_MIDNIGHT_BORDER,
} from "@/lib/cantinePlusTheme";
import { cn } from "@/lib/utils";

type DayRow = {
  date: string;
  wasteWeightG: number;
  wasteWeightMaternelleG: number;
  wasteWeightPrimaireG: number;
  wasteGramsPer100: number | null;
  rabRatePct: number | null;
  weighLabel: string;
  wasteDelta: number | null;
};

export function AntiWastePanels({
  days,
  targetGPer100,
  totalWasteWeightG,
  totalWasteMaternelleG,
  totalWastePrimaireG,
  wasteGramsPer100Served,
  rabRatePct,
  servicesCount,
  servicesWithWaste,
  missingWeighCount,
  streakAboveTarget,
  perDayRows,
  chartRows,
  riskyDishes = [],
}: {
  days: 7 | 30;
  targetGPer100: number | null;
  totalWasteWeightG: number;
  totalWasteMaternelleG: number;
  totalWastePrimaireG: number;
  wasteGramsPer100Served: number | null;
  rabRatePct: string;
  servicesCount: number;
  servicesWithWaste: number;
  missingWeighCount: number;
  streakAboveTarget: number;
  perDayRows: DayRow[];
  chartRows: WastePerDayRowInput[];
  riskyDishes?: RiskyDishRow[];
}) {
  const status = antiWasteStatus(wasteGramsPer100Served, targetGPer100);
  const statusShell =
    status.tone === "ok"
      ? "from-emerald-500 via-emerald-400 to-teal-400"
      : status.tone === "watch"
        ? "from-amber-400 via-yellow-400 to-orange-400"
        : status.tone === "alert"
          ? "from-rose-600 via-rose-500 to-orange-500"
          : "from-slate-500 via-slate-400 to-zinc-400";
  const statusText =
    status.tone === "watch" || status.tone === "ok"
      ? "text-zinc-950"
      : "text-white";
  const statusMuted =
    status.tone === "watch" || status.tone === "ok"
      ? "text-zinc-800"
      : "text-white/90";
  const statusBadge =
    status.tone === "watch" || status.tone === "ok"
      ? "bg-zinc-950/10 text-zinc-900 ring-zinc-950/15"
      : "bg-white/20 text-white ring-white/25";
  const actionBox =
    status.tone === "watch"
      ? "border-zinc-950/15 bg-white text-zinc-950 shadow-lg shadow-amber-700/20"
      : status.tone === "ok"
        ? "border-emerald-900/15 bg-white text-zinc-950 shadow-lg shadow-emerald-700/20"
        : "border-white/25 bg-white/95 text-zinc-950 shadow-lg shadow-black/20";

  return (
    <div className="mt-8 space-y-8 sm:mt-10">
      <div
        className="space-y-4 rounded-2xl border p-4 shadow-md sm:p-5"
        style={{
          backgroundColor: CANTINE_PLUS_MIDNIGHT,
          borderColor: CANTINE_PLUS_MIDNIGHT_BORDER,
        }}
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl bg-gradient-to-br px-4 py-3 shadow-lg sm:px-5 sm:py-3.5",
            statusShell,
            statusText,
          )}
          role="status"
        >
          <div
            className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-white/25 blur-2xl"
            aria-hidden
          />
          <div className="relative">
            <p
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ring-1",
                statusBadge,
              )}
            >
              Lecture g / 100 assiettes
            </p>
            <p className="mt-1.5 text-balance text-lg font-black leading-snug tracking-tight sm:text-xl">
              {status.title}
            </p>
            <p
              className={cn(
                "mt-1.5 max-w-3xl text-sm font-medium leading-snug sm:text-[15px]",
                statusMuted,
              )}
            >
              {status.detail}
            </p>
            <div
              className={cn(
                "mt-2.5 rounded-xl border px-3 py-2 sm:px-3.5",
                actionBox,
              )}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-rose-600">
                Que faire
              </p>
              <p className="mt-0.5 text-sm font-semibold leading-snug text-zinc-900 sm:text-[15px]">
                {status.hint}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Déchets total",
              value:
                totalWasteWeightG > 0
                  ? `${Math.round(totalWasteWeightG).toLocaleString("fr-FR")} g`
                  : "—",
              sub:
                totalWasteMaternelleG > 0 || totalWastePrimaireG > 0
                  ? `Mat. ${Math.round(totalWasteMaternelleG).toLocaleString("fr-FR")} g · Prim. ${Math.round(totalWastePrimaireG).toLocaleString("fr-FR")} g`
                  : undefined,
            },
            {
              label: "Taux RAB",
              value: rabRatePct,
            },
            {
              label: "Pesées saisies",
              value: `${servicesWithWaste} / ${servicesCount}`,
              sub:
                missingWeighCount > 0
                  ? `${missingWeighCount} service${missingWeighCount > 1 ? "s" : ""} sans pesée`
                  : "Toutes les pesées sont saisies",
            },
            {
              label: "Jours au-dessus objectif",
              value:
                targetGPer100 != null
                  ? String(
                      perDayRows.filter(
                        (r) =>
                          r.wasteGramsPer100 != null &&
                          r.wasteGramsPer100 > targetGPer100,
                      ).length,
                    )
                  : "—",
              sub:
                streakAboveTarget >= 3
                  ? `Alerte : ${streakAboveTarget} jours de suite`
                  : targetGPer100 != null
                    ? `Objectif ${targetGPer100.toLocaleString("fr-FR")} g / 100`
                    : "Définir l’objectif (admin)",
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-white/55">
                {kpi.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-white">{kpi.value}</p>
              {kpi.sub ? (
                <p className="mt-1 text-sm text-white/65">{kpi.sub}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {streakAboveTarget >= 3 || missingWeighCount > 0 ? (
        <div className="flex items-start gap-3 overflow-hidden rounded-2xl border border-rose-300/70 bg-gradient-to-r from-rose-600 to-orange-500 px-4 py-3.5 text-sm text-white shadow-md">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-white" aria-hidden />
          <div className="space-y-1">
            {streakAboveTarget >= 3 ? (
              <p>
                <strong className="font-semibold">{streakAboveTarget} jours de suite</strong>{" "}
                au-dessus de l’objectif g / 100.
              </p>
            ) : null}
            {missingWeighCount > 0 ? (
              <p>
                <strong className="font-semibold">{missingWeighCount}</strong> service
                {missingWeighCount > 1 ? "s" : ""} sans pesée sur la période.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-rose-200/80 bg-white shadow-md ring-1 ring-rose-100">
        <div className="relative overflow-hidden bg-gradient-to-br from-rose-600 via-rose-500 to-orange-500 px-4 py-5 text-white sm:px-6 sm:py-6">
          <div
            className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/15 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-12 left-1/3 h-28 w-28 rounded-full bg-orange-300/30 blur-2xl"
            aria-hidden
          />
          <div className="relative flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 shadow-inner ring-1 ring-white/30 backdrop-blur-sm">
              <Recycle className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                Plats à risque
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">
                Classement des plats liés aux jours à plus fort gaspillage sur{" "}
                {days} jours — pour décider quoi ajuster demain.
              </p>
            </div>
          </div>
        </div>

        {riskyDishes.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500 sm:px-6">
            Pas encore assez de menus + pesées sur la période pour classer les
            plats.
          </p>
        ) : (
          <ul className="space-y-3 p-4 sm:p-5">
            {riskyDishes.map((dish, i) => {
              const maxG = riskyDishes[0]?.avgWasteGPer100 || 1;
              const barPct = Math.max(
                8,
                Math.round((dish.avgWasteGPer100 / maxG) * 100),
              );
              const rankTone =
                i === 0
                  ? "from-rose-600 to-orange-500 text-white shadow-rose-200"
                  : i === 1
                    ? "from-orange-500 to-amber-400 text-white shadow-orange-100"
                    : i === 2
                      ? "from-[#2f6b69] to-teal-500 text-white shadow-teal-100"
                      : "from-zinc-200 to-zinc-100 text-zinc-700";
              return (
                <li
                  key={`${dish.label}-${i}`}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
                    i === 0
                      ? "border-rose-300 ring-1 ring-rose-200"
                      : "border-zinc-200",
                  )}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-black tabular-nums shadow-md",
                        rankTone,
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-base font-bold capitalize text-zinc-900 sm:text-lg">
                            {dish.label}
                          </p>
                          <p className="mt-0.5 text-xs font-medium text-zinc-500 sm:text-sm">
                            {dish.serviceCount} service
                            {dish.serviceCount > 1 ? "s" : ""} avec ce plat
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black tabular-nums tracking-tight text-rose-600 sm:text-3xl">
                            {dish.avgWasteGPer100.toLocaleString("fr-FR", {
                              maximumFractionDigits: 0,
                            })}
                            <span className="ml-1 text-sm font-bold text-rose-500/80">
                              g / 100
                            </span>
                          </p>
                          <p
                            className={cn(
                              "mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                              dish.vsTarget === "above"
                                ? "bg-rose-100 text-rose-700"
                                : dish.vsTarget === "ok"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-zinc-100 text-zinc-600",
                            )}
                          >
                            {dish.vsTarget === "above"
                              ? "Au-dessus objectif"
                              : dish.vsTarget === "ok"
                                ? "Sous objectif"
                                : "Sans objectif"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-rose-100">
                        <div
                          className={cn(
                            "h-full rounded-full bg-gradient-to-r transition-[width]",
                            i === 0
                              ? "from-rose-600 to-orange-400"
                              : "from-rose-400 to-orange-300",
                          )}
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <WasteEvolutionChart days={days} perDayRows={chartRows} />

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 className="text-lg font-bold text-zinc-900">Jour par jour</h2>
        </div>
        <div className="max-h-[28rem] overflow-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="sticky top-0 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Déchets</th>
                <th className="px-3 py-2 font-medium">Mat. / Prim.</th>
                <th className="px-3 py-2 font-medium">g / 100</th>
                <th className="px-3 py-2 font-medium">RAB %</th>
                <th className="px-3 py-2 font-medium">Pesée</th>
                <th className="px-3 py-2 font-medium">Δ déchets</th>
              </tr>
            </thead>
            <tbody>
              {[...perDayRows].reverse().map((row) => (
                <tr key={row.date} className="border-t border-zinc-100">
                  <td className="px-3 py-2 font-medium text-zinc-900">{row.date}</td>
                  <td className="px-3 py-2">
                    {row.wasteWeightG > 0
                      ? `${Math.round(row.wasteWeightG).toLocaleString("fr-FR")} g`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-zinc-600">
                    {Math.round(row.wasteWeightMaternelleG).toLocaleString("fr-FR")} /{" "}
                    {Math.round(row.wasteWeightPrimaireG).toLocaleString("fr-FR")} g
                  </td>
                  <td className="px-3 py-2">
                    {row.wasteGramsPer100 != null
                      ? row.wasteGramsPer100.toLocaleString("fr-FR", {
                          maximumFractionDigits: 1,
                        })
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {row.rabRatePct != null
                      ? `${row.rabRatePct.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`
                      : "—"}
                  </td>
                  <td className="px-3 py-2">{row.weighLabel}</td>
                  <td className="px-3 py-2">
                    {row.wasteDelta == null
                      ? "—"
                      : `${row.wasteDelta > 0 ? "+" : ""}${Math.round(row.wasteDelta).toLocaleString("fr-FR")}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
