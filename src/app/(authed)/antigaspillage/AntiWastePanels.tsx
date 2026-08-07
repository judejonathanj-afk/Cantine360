"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WasteEvolutionChart } from "@/components/dashboard/WasteEvolutionChart";
import type { WastePerDayRowInput } from "@/lib/buildWasteEvolutionSeries";
import { antiWasteStatus } from "@/lib/antiWasteStatus";
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
}) {
  const status = antiWasteStatus(wasteGramsPer100Served, targetGPer100);
  const toneClass =
    status.tone === "ok"
      ? "border-emerald-300 bg-emerald-50 text-emerald-950"
      : status.tone === "watch"
        ? "border-amber-300 bg-amber-50 text-amber-950"
        : status.tone === "alert"
          ? "border-red-300 bg-red-50 text-red-950"
          : "border-zinc-200 bg-zinc-50 text-zinc-800";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <Button variant={days === 7 ? "default" : "outline"} asChild>
          <Link href="/antigaspillage?days=7">7 jours</Link>
        </Button>
        <Button variant={days === 30 ? "default" : "outline"} asChild>
          <Link href="/antigaspillage?days=30">30 jours</Link>
        </Button>
      </div>

      <div
        className={cn(
          "rounded-2xl border-2 px-4 py-3 text-sm font-medium sm:text-base",
          toneClass,
        )}
        role="status"
      >
        {status.label}
        {wasteGramsPer100Served != null ? (
          <span className="mt-1 block text-lg font-bold sm:text-xl">
            {wasteGramsPer100Served.toLocaleString("fr-FR", {
              maximumFractionDigits: 1,
            })}{" "}
            g / 100 assiettes
          </span>
        ) : null}
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
          <Card key={kpi.label} className="border-emerald-200/80 shadow-sm">
            <CardContent className="space-y-1 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {kpi.label}
              </p>
              <p className="text-2xl font-bold text-zinc-900">{kpi.value}</p>
              {kpi.sub ? (
                <p className="text-sm text-zinc-600">{kpi.sub}</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {streakAboveTarget >= 3 || missingWeighCount > 0 ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
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
