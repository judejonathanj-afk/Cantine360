"use client";

import { useMemo, useState } from "react";
import { BarChart3, CalendarDays, Recycle, Scale, Trash2, X } from "lucide-react";
import { AvisDuSuiviCard } from "@/components/dashboard/AvisDuSuiviCard";
import { WasteEvolutionChart } from "@/components/dashboard/WasteEvolutionChart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DashboardDayDetailRow } from "@/lib/buildDashboardDayDetailRows";

function formatDayLabel(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(d);
}

export function KitchenDashboardOverview({
  days,
  perDayRows,
  wasteGramsPer100,
  targetGPer100,
}: {
  days: 7 | 30;
  perDayRows: DashboardDayDetailRow[];
  wasteGramsPer100: number | null;
  targetGPer100: number | null;
}) {
  const [open, setOpen] = useState(false);
  const wasteRows = useMemo(
    () =>
      perDayRows.map((row) => ({
        date: row.date,
        wasteWeightG: row.wasteWeightG,
        served: row.served,
      })),
    [perDayRows],
  );
  const hasData = wasteRows.some((row) => row.wasteWeightG > 0);
  const totals = useMemo(() => {
    return perDayRows.reduce(
      (acc, row) => {
        acc.wasteG += row.wasteWeightG;
        acc.rab += row.rab;
        acc.refused += row.refused;
        if (row.wasteWeightG > acc.peakWaste) {
          acc.peakWaste = row.wasteWeightG;
          acc.peakDate = row.date;
        }
        return acc;
      },
      { wasteG: 0, rab: 0, refused: 0, peakWaste: 0, peakDate: "" },
    );
  }, [perDayRows]);

  return (
    <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="rounded-[28px] bg-white p-5 text-left shadow-[0_12px_28px_-18px_rgba(24,24,27,0.22)] ring-1 ring-zinc-100 transition-transform duration-200 ease-out hover:z-10 hover:scale-[1.03] hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:scale-100"
      >
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-zinc-950">
              <span className="flex size-8 items-center justify-center rounded-full bg-orange-400 text-white">
                <BarChart3 className="size-4" strokeWidth={2.4} aria-hidden />
              </span>
              Évolution des déchets
            </h2>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              Poids des déchets et g / 100 assiettes · {days} jours
            </p>
          </div>
        </div>
        {!hasData ? (
          <p className="py-10 text-sm font-medium text-zinc-500">
            Pas encore de pesée sur la période.
          </p>
        ) : (
          <WasteEvolutionChart
            days={days}
            perDayRows={wasteRows}
            embedded
            plotClassName="h-[220px]"
          />
        )}
      </button>

      <AvisDuSuiviCard
        days={days}
        perDayRows={perDayRows}
        wasteGramsPer100={wasteGramsPer100}
        targetGPer100={targetGPer100}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          overlayClassName="z-[100]"
          className="z-[100] max-w-3xl gap-0 overflow-hidden rounded-3xl border-0 p-0 shadow-[0_24px_60px_-24px_rgba(15,60,40,0.45)] sm:max-w-3xl"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 z-30 flex size-8 items-center justify-center rounded-full bg-white text-zinc-500 shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50 hover:text-zinc-800"
            aria-label="Fermer"
          >
            <X className="size-4" />
          </button>
          <div className="relative overflow-hidden">
            <div className="relative px-5 pb-2 pt-5 sm:px-6">
              <div className="relative flex items-start gap-3 pr-10">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-orange-400 text-white shadow-sm">
                  <BarChart3 className="size-6" strokeWidth={2.4} aria-hidden />
                </span>
                <div className="min-w-0">
                  <DialogTitle className="text-[1.75rem] font-extrabold leading-none tracking-tight text-zinc-950">
                    Évolution des déchets
                  </DialogTitle>
                  <DialogDescription className="mt-1.5 text-sm font-semibold text-zinc-800 sm:text-base">
                    Poids des déchets et grammes pour 100 assiettes · {days} jours.
                  </DialogDescription>
                </div>
              </div>
            </div>

            <div className="space-y-3 px-5 pb-5 pt-3 sm:px-6">
              <div className="rounded-[1.5rem] bg-white px-2 py-2 sm:px-3">
                {!hasData ? (
                  <p className="py-8 text-center text-sm font-medium text-zinc-500">
                    Pas encore de pesée sur la période.
                  </p>
                ) : (
                  <WasteEvolutionChart
                    days={days}
                    perDayRows={wasteRows}
                    embedded
                    plotClassName="h-[280px]"
                  />
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-[1.25rem] bg-[#e7f8ef] px-4 py-3.5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0f9f4f] shadow-sm">
                    <Trash2 className="size-5" strokeWidth={2.2} aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wide text-[#047857]">
                      Déchets
                    </p>
                    <p className="font-display text-xl font-extrabold leading-none tabular-nums text-zinc-950">
                      {(totals.wasteG / 1000).toLocaleString("fr-FR", {
                        maximumFractionDigits: 1,
                      })}{" "}
                      kg
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-[1.25rem] bg-[#e7f8ef] px-4 py-3.5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0f9f4f] shadow-sm">
                    <Scale className="size-5" strokeWidth={2.2} aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wide text-[#047857]">
                      RAB
                    </p>
                    <p className="font-display text-xl font-extrabold leading-none tabular-nums text-zinc-950">
                      {totals.rab.toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-[1.25rem] bg-[#e7f8ef] px-4 py-3.5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0f9f4f] shadow-sm">
                    <Recycle className="size-5" strokeWidth={2.2} aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wide text-[#047857]">
                      Refus
                    </p>
                    <p className="font-display text-xl font-extrabold leading-none tabular-nums text-zinc-950">
                      {totals.refused.toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-[1.25rem] bg-[#e7f8ef] px-4 py-3.5">
                  <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-[#047857]">
                    <CalendarDays className="size-4" aria-hidden />
                    Jour le plus lourd
                  </p>
                  <p className="mt-1 text-sm font-extrabold text-zinc-950">
                    {totals.peakWaste > 0
                      ? `${formatDayLabel(totals.peakDate)} · ${(totals.peakWaste / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} kg`
                      : "Pas encore de jour de pointe"}
                  </p>
                </div>
                <div className="rounded-[1.25rem] bg-[#e7f8ef] px-4 py-3.5">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-[#047857]">
                    Soit
                  </p>
                  <p className="mt-1 font-display text-xl font-extrabold tabular-nums text-zinc-950">
                    {wasteGramsPer100 != null
                      ? `${Math.round(wasteGramsPer100).toLocaleString("fr-FR")} g / 100`
                      : "—"}
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-zinc-700">
                    de déchets pour 100 assiettes servies
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

