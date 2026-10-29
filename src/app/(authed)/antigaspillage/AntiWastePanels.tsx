"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ChevronDown,
  Download,
  Flag,
  Flame,
  Lightbulb,
  Recycle,
  Scale,
  Trash2,
} from "lucide-react";
import type { WastePerDayRowInput } from "@/lib/buildWasteEvolutionSeries";
import { antiWasteStatus } from "@/lib/antiWasteStatus";
import type { RiskyDishRow } from "@/lib/antiWasteRiskyDishes";
import { unparseCsvSemicolon } from "@/lib/csvExport";
import { cn } from "@/lib/utils";
import { AntiWasteModeToggle } from "@/components/admin/AntiWasteModeToggle";
import { DashboardFoldOverlay } from "@/components/dashboard/DashboardFoldOverlay";
import { AntiWasteGauge } from "./AntiWasteGauge";
import { AntiWasteLineChart } from "./AntiWasteLineChart";
import {
  fmt,
  fmt1,
  formatDayLabelFr,
  gaugeStatusFromTone,
  gaugeStatusLabel,
  weighingStatusFromLabel,
} from "./antiWasteFormat";

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

export type MissingWeighServiceRow = {
  id: string;
  dateLabel: string;
  mealLabel: string;
  menuSummary: string;
  servedCount: number;
};

const STATUS_STYLES = {
  green: "bg-primary/12 text-primary",
  amber: "bg-[color:var(--aw-amber)]/25 text-[color:var(--aw-amber-fg)]",
  red: "bg-[color:var(--aw-coral)]/15 text-[color:var(--aw-coral)]",
  none: "bg-muted text-muted-foreground",
} as const;

function CyclePill({ level }: { level: "MATERNELLE" | "PRIMAIRE" }) {
  return (
    <span
      className={cn(
        "inline-flex translate-y-[-1px] rounded-full px-2.5 py-0.5 align-middle text-[11px] font-extrabold uppercase tracking-[0.12em] text-white",
        level === "MATERNELLE" ? "bg-sky-600" : "bg-emerald-600",
      )}
    >
      {level === "MATERNELLE" ? "Maternelle" : "Primaire"}
    </span>
  );
}

export function AntiWastePanels({
  days,
  targetGPer100,
  modeEnabled,
  schemaReady = true,
  totalWasteWeightG,
  totalWasteMaternelleG,
  totalWastePrimaireG,
  wasteGramsPer100Served,
  rabRatePct,
  servicesCount,
  servicesWithWaste,
  missingWeighCount,
  missingWeighServices = [],
  streakAboveTarget,
  perDayRows,
  chartRows,
  riskyDishes = [],
}: {
  days: 7 | 30;
  targetGPer100: number | null;
  modeEnabled: boolean;
  schemaReady?: boolean;
  totalWasteWeightG: number;
  totalWasteMaternelleG: number;
  totalWastePrimaireG: number;
  wasteGramsPer100Served: number | null;
  rabRatePct: string;
  servicesCount: number;
  servicesWithWaste: number;
  missingWeighCount: number;
  missingWeighServices?: MissingWeighServiceRow[];
  streakAboveTarget: number;
  perDayRows: DayRow[];
  chartRows: WastePerDayRowInput[];
  riskyDishes?: RiskyDishRow[];
}) {
  const [missingWeighOpen, setMissingWeighOpen] = useState(false);
  const riskyDishesVisible = riskyDishes;
  const missingWeighVisible = missingWeighServices;
  const missingWeighShown = missingWeighOpen
    ? missingWeighVisible
    : missingWeighVisible.slice(0, 2);
  const status = antiWasteStatus(wasteGramsPer100Served, targetGPer100);
  const hasWeighing =
    wasteGramsPer100Served != null && wasteGramsPer100Served > 0;
  const gaugeValue = hasWeighing ? wasteGramsPer100Served : null;
  const gaugeStatus = gaugeStatusFromTone(
    status.tone,
    wasteGramsPer100Served != null && wasteGramsPer100Served > 0,
    targetGPer100 != null && targetGPer100 > 0,
  );

  const daysOverObjective =
    targetGPer100 != null
      ? perDayRows.filter(
          (r) =>
            r.wasteGramsPer100 != null && r.wasteGramsPer100 > targetGPer100,
        ).length
      : null;

  const chartPoints = chartRows.map((r) => ({
    date: r.date,
    waste: r.wasteWeightG ?? 0,
    g100:
      r.served > 0 && (r.wasteWeightG ?? 0) > 0
        ? ((r.wasteWeightG ?? 0) / r.served) * 100
        : 0,
  }));

  function downloadSynthesisCsv() {
    const summaryRows: Record<string, unknown>[] = [
      { Section: "Synthèse", Indicateur: "Période (jours)", Valeur: days },
      { Section: "Synthèse", Indicateur: "Lecture g / 100", Valeur: status.title },
      { Section: "Synthèse", Indicateur: "Détail", Valeur: status.detail },
      { Section: "Synthèse", Indicateur: "Que faire", Valeur: status.hint },
      {
        Section: "Synthèse",
        Indicateur: "Objectif g / 100",
        Valeur: targetGPer100 ?? "",
      },
      {
        Section: "Synthèse",
        Indicateur: "Déchets total (g)",
        Valeur: totalWasteWeightG > 0 ? Math.round(totalWasteWeightG) : "",
      },
      {
        Section: "Synthèse",
        Indicateur: "Déchets maternelle (g)",
        Valeur:
          totalWasteMaternelleG > 0 ? Math.round(totalWasteMaternelleG) : "",
      },
      {
        Section: "Synthèse",
        Indicateur: "Déchets primaire (g)",
        Valeur: totalWastePrimaireG > 0 ? Math.round(totalWastePrimaireG) : "",
      },
      { Section: "Synthèse", Indicateur: "Taux RAB", Valeur: rabRatePct },
      {
        Section: "Synthèse",
        Indicateur: "Pesées saisies",
        Valeur: `${servicesWithWaste} / ${servicesCount}`,
      },
      {
        Section: "Synthèse",
        Indicateur: "Services sans pesée",
        Valeur: missingWeighCount,
      },
      {
        Section: "Synthèse",
        Indicateur: "Jours au-dessus objectif (suite)",
        Valeur: streakAboveTarget,
      },
    ];

    const dayRows = [...perDayRows].reverse().map((r) => ({
      Section: "Jour",
      Date: r.date,
      "Déchets (g)": r.wasteWeightG > 0 ? Math.round(r.wasteWeightG) : "",
      "Mat. (g)": Math.round(r.wasteWeightMaternelleG),
      "Prim. (g)": Math.round(r.wasteWeightPrimaireG),
      "g / 100":
        r.wasteGramsPer100 != null
          ? Math.round(r.wasteGramsPer100 * 10) / 10
          : "",
      "RAB %":
        r.rabRatePct != null ? Math.round(r.rabRatePct * 10) / 10 : "",
      Pesée: r.weighLabel,
      "Δ déchets":
        r.wasteDelta == null ? "" : Math.round(r.wasteDelta),
    }));

    const dishRows = riskyDishes.map((d, i) => ({
      Section: "Plat à risque",
      Rang: i + 1,
      Plat: d.label,
      Services: d.serviceCount,
      "g / 100": Math.round(d.avgWasteGPer100),
      vsObjectif:
        d.vsTarget === "above"
          ? "Au-dessus"
          : d.vsTarget === "ok"
            ? "Sous"
            : "Sans",
    }));

    const csv = unparseCsvSemicolon([
      ...summaryRows,
      ...dayRows,
      ...dishRows,
    ]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anti-gaspillage-${days}j.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const kpis = [
    {
      icon: Trash2,
      label: "Déchets total",
      value:
        totalWasteWeightG > 0
          ? `${fmt(Math.round(totalWasteWeightG))} g`
          : "—",
      sub:
        totalWasteMaternelleG > 0 || totalWastePrimaireG > 0
          ? `Mat. ${fmt(Math.round(totalWasteMaternelleG))} g · Prim. ${fmt(Math.round(totalWastePrimaireG))} g`
          : "Aucune pesée sur la période",
      accent: "text-primary",
    },
    {
      icon: Recycle,
      label: "Taux de RAB",
      value: rabRatePct,
      sub: "Rab servi sur la période",
      accent: "text-primary",
    },
    {
      icon: Scale,
      label: "Pesées saisies",
      value: `${servicesWithWaste} / ${servicesCount}`,
      sub:
        missingWeighCount > 0
          ? `${missingWeighCount} service${missingWeighCount > 1 ? "s" : ""} sans pesée`
          : "Toutes les pesées sont saisies",
      accent: "text-[color:var(--aw-amber-fg)]",
    },
    {
      icon: Flag,
      label: "Jours au-dessus objectif",
      value: daysOverObjective == null ? "—" : String(daysOverObjective),
      sub:
        streakAboveTarget >= 3
          ? `Alerte : ${streakAboveTarget} jours de suite`
          : daysOverObjective == null
            ? "Définissez un objectif"
            : "Sur la période",
      accent: "text-[color:var(--aw-coral)]",
    },
  ];

  const maxRiskG = Math.max(
    ...riskyDishesVisible.map((d) => d.avgWasteGPer100),
    1,
  );

  const weighedPoints = chartPoints.filter((p) => p.g100 > 0 || p.waste > 0);
  const heaviestDay =
    weighedPoints.length === 0
      ? null
      : weighedPoints.reduce((best, p) => {
          if (p.g100 !== best.g100) return p.g100 > best.g100 ? p : best;
          return p.waste > best.waste ? p : best;
        });
  const g100Series = chartPoints.filter((p) => p.g100 > 0);
  let curveRemark: string | null = null;
  if (g100Series.length >= 2) {
    const first = g100Series[0]!.g100;
    const last = g100Series[g100Series.length - 1]!.g100;
    const delta = last - first;
    if (first > 0 && Math.abs(delta) / first < 0.08) {
      curveRemark = "Les g / 100 restent stables sur la période.";
    } else if (delta > 0) {
      curveRemark = "Les g / 100 montent sur la période.";
    } else {
      curveRemark = "Les g / 100 baissent sur la période.";
    }
  }
  const watchedDish = riskyDishes[0] ?? null;
  let dishRemark: string | null = null;
  if (watchedDish) {
    const mat = watchedDish.maternelleGPer100;
    const prim = watchedDish.primaireGPer100;
    let levelNote = "";
    if (mat != null && prim != null && mat > 0 && prim > 0) {
      if (mat > prim * 1.1) levelNote = " La maternelle jette plus que le primaire.";
      else if (prim > mat * 1.1)
        levelNote = " Le primaire jette plus que la maternelle.";
    }
    dishRemark = `« ${watchedDish.label} » revient dans les jours lourds, environ ${fmt(Math.round(watchedDish.avgWasteGPer100))} g / 100.${levelNote}`;
  }

  return (
    <div className="anti-waste-dash relative space-y-6">
      <section className="aw-reveal space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-full">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Cantine 360
            </p>
            <h1 className="mt-2 inline-block rounded-2xl bg-white px-5 py-2 font-display text-2xl font-bold tracking-tight text-black sm:text-3xl">
              Mode anti-gaspillage
            </h1>
            <p className="mt-3 w-full text-lg leading-relaxed text-black sm:text-xl">
              Le mode anti-gaspillage aide la cuisine et la commission à réduire
              les restes : fixez un objectif en grammes pour 100 assiettes, puis
              activez le mode ci-dessous pour afficher la synthèse, les plats à
              risque, l’évolution et le détail jour par jour.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-full border border-border bg-card p-1">
            {(
              [
                { key: 7 as const, label: "7 jours" },
                { key: 30 as const, label: "30 jours" },
              ] as const
            ).map((o) => (
              <Link
                key={o.key}
                href={`/antigaspillage?days=${o.key}`}
                aria-pressed={days === o.key}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  days === o.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {o.label}
              </Link>
            ))}
          </div>
          <button
            type="button"
            onClick={downloadSynthesisCsv}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Download className="size-4" aria-hidden />
            Télécharger
          </button>
        </div>
      </section>

      <div className="anti-waste-dash-fade space-y-6">
        <div className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border shadow-[0_24px_60px_-30px_rgb(20_60_40/0.35)] lg:grid-cols-[1.05fr_1.35fr]">
          <div className="flex flex-col items-center justify-center gap-5 bg-card px-6 py-10">
            <AntiWasteGauge
              value={gaugeValue}
              objective={targetGPer100}
              status={gaugeStatus}
              emptyLabel="—"
            />
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold",
                STATUS_STYLES[gaugeStatus],
              )}
            >
              <span className="size-2 rounded-full bg-current" aria-hidden />
              {wasteGramsPer100Served == null || wasteGramsPer100Served <= 0
                ? "Pas encore de pesée"
                : targetGPer100 == null || targetGPer100 <= 0
                  ? "Sans objectif"
                  : gaugeStatusLabel[gaugeStatus]}
            </div>
            <p className="max-w-xs text-balance text-center text-base font-medium leading-relaxed text-zinc-950">
              {wasteGramsPer100Served != null && wasteGramsPer100Served > 0 ? (
                <>
                  Pour 100 repas servis, environ{" "}
                  <span className="font-bold text-zinc-950">
                    {(wasteGramsPer100Served / 1000).toLocaleString("fr-FR", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    kg
                  </span>{" "}
                  de nourriture ont été jetés sur la période.
                </>
              ) : (
                status.detail
              )}
            </p>
          </div>

          <div className="bg-card px-6 py-8 sm:px-8">
            <AntiWasteModeToggle
              initialEnabled={modeEnabled}
              initialTargetGPer100={targetGPer100}
              schemaReady={schemaReady}
              compact
            />
          </div>
        </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((t, i) => {
          const Icon = t.icon;
          return (
            <div
              key={t.label}
              className="aw-reveal group rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-[0_16px_40px_-24px_rgb(20_60_40/0.4)]"
              style={{ animationDelay: `${160 + i * 70}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-zinc-950">
                  {t.label}
                </span>
                <Icon className={cn("size-4", t.accent)} aria-hidden />
              </div>
              <p className="mt-3 font-display text-3xl font-bold tracking-tight text-zinc-950">
                {t.value}
              </p>
              <p className="mt-1 text-base font-semibold text-zinc-950">{t.sub}</p>
            </div>
          );
        })}
      </div>

      {streakAboveTarget >= 3 ? (
        <div className="aw-reveal flex items-center gap-3 rounded-2xl border-2 border-rose-500 bg-rose-50 px-5 py-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white">
            <AlertTriangle className="size-4" aria-hidden />
          </span>
          <p className="text-base font-semibold text-zinc-950">
            <span className="font-bold">{streakAboveTarget} jours de suite</span>{" "}
            au-dessus de l’objectif g / 100.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6">
        <DashboardFoldOverlay
          kicker="Plats à risque"
          openLabel="Ouvrir Plats à risque"
          overlayTitle="Plats à risque"
          titleClassName="text-violet-300"
          subtitle="Repérez les plats qui pèsent le plus sur le gaspillage, pour ajuster portions et menu dès demain."
          hint={`Classés du plus gourmand au plus léger · ${days} jours. Lisez, comparez, téléchargez.`}
          icon={Flame}
          labelledBy="risky-dishes-overlay-title"
          closeButtonClassName="bg-[#37784a] hover:bg-[#2f6840]"
          bodyClassName="overflow-y-scroll pr-1.5 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-400 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-zinc-100"
          headerAction={
            <button
              type="button"
              disabled={riskyDishesVisible.length === 0}
              onClick={() => {
                void import("@/lib/downloadRiskyDishesPdf").then((mod) =>
                  mod.downloadRiskyDishesPdf(riskyDishesVisible, days),
                );
              }}
              className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-zinc-900 shadow-sm transition duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:hover:scale-100"
            >
              <Download className="size-4" aria-hidden />
              Télécharger
            </button>
          }
        >
          {riskyDishesVisible.length === 0 ? (
            <p className="px-3 py-10 text-center text-base font-medium leading-relaxed text-zinc-700 sm:text-lg">
              Pas encore de classement. Dès que les menus et les pesées sont
              saisis, les plats les plus gourmands apparaîtront ici, du plus
              lourd au plus léger.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="px-1 text-base font-semibold leading-snug text-violet-950 sm:text-lg">
                {riskyDishesVisible.length} plat
                {riskyDishesVisible.length > 1 ? "s" : ""} classé
                {riskyDishesVisible.length > 1 ? "s" : ""} : le n°1 est celui
                à regarder en premier pour demain.
              </p>
            <ul className="flex flex-col gap-4">
              {riskyDishesVisible.map((d, i) => {
                const pct = Math.max((d.avgWasteGPer100 / maxRiskG) * 100, 3);
                const rank = i + 1;
                const rankLabel =
                  rank === 1
                    ? "À prioriser"
                    : rank === 2
                      ? "À surveiller"
                      : `N° ${rank}`;
                const grams = fmt(Math.round(d.avgWasteGPer100));
                return (
                  <li
                    key={`${d.label}-${i}`}
                    className={cn(
                      "overflow-hidden rounded-2xl border-2 p-4 shadow-sm sm:p-5",
                      rank === 1
                        ? "border-violet-400 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50"
                        : rank === 2
                          ? "border-violet-300 bg-gradient-to-br from-violet-50/80 to-white"
                          : "border-violet-200 bg-white",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <span
                          className={cn(
                            "flex size-11 shrink-0 items-center justify-center rounded-2xl text-base font-extrabold text-white shadow-sm",
                            rank === 1
                              ? "bg-violet-700"
                              : rank === 2
                                ? "bg-violet-500"
                                : "bg-violet-400",
                          )}
                        >
                          {rank}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-violet-700">
                            {rankLabel}
                          </p>
                          <p className="mt-0.5 text-xl font-extrabold leading-tight tracking-tight text-zinc-950 capitalize sm:text-2xl">
                            {d.label}
                          </p>
                          <p className="mt-1.5 text-sm font-medium leading-snug text-zinc-700 sm:text-base">
                            {d.serviceCount === 1
                              ? "Vu sur 1 service de la période."
                              : `Vu sur ${d.serviceCount} services de la période.`}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 rounded-2xl bg-white px-4 py-3 text-right shadow-sm ring-1 ring-violet-200">
                        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-black">
                          Moyenne
                        </p>
                        <p className="mt-0.5 font-display text-2xl font-extrabold tracking-tight text-violet-800 sm:text-3xl">
                          {grams}
                          <span className="ml-1 text-sm font-bold text-zinc-700">
                            g
                          </span>
                        </p>
                        <p className="mt-0.5 text-sm font-semibold leading-snug text-zinc-700">
                          de déchets pour 100 assiettes
                        </p>
                        <span
                          className={cn(
                            "mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide",
                            d.vsTarget === "above"
                              ? "bg-rose-100 text-rose-800"
                              : d.vsTarget === "ok"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-violet-100 text-violet-800",
                          )}
                        >
                          {d.vsTarget === "above"
                            ? "Au-dessus de l’objectif"
                            : d.vsTarget === "ok"
                              ? "Sous l’objectif"
                              : "Objectif non défini"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 border-t border-violet-200/80 pt-4 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white/80 px-3.5 py-3 ring-1 ring-violet-100">
                        <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-black">
                          Par cycle
                        </p>
                        <p className="mt-2.5 text-base font-medium leading-relaxed text-zinc-900">
                          En <CyclePill level="MATERNELLE" />{" "}
                          {d.maternelleGPer100 != null
                            ? `${fmt(Math.round(d.maternelleGPer100))} g de déchets pour 100 assiettes.`
                            : "pas encore de pesée sur la période."}
                        </p>
                        <p className="mt-2 text-base font-medium leading-relaxed text-zinc-900">
                          En <CyclePill level="PRIMAIRE" />{" "}
                          {d.primaireGPer100 != null
                            ? `${fmt(Math.round(d.primaireGPer100))} g de déchets pour 100 assiettes.`
                            : "pas encore de pesée sur la période."}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/80 px-3.5 py-3 ring-1 ring-violet-100">
                        <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-black">
                          Classes à surveiller
                        </p>
                        {(d.topClasses ?? []).length === 0 ? (
                          <p className="mt-2.5 text-base font-medium leading-relaxed text-zinc-600">
                            Pas encore de détail par classe pour ce plat.
                          </p>
                        ) : (
                          <ul className="mt-2.5 space-y-2">
                            {(d.topClasses ?? []).map((c) => (
                              <li
                                key={`${d.label}-${c.label}`}
                                className="flex items-center justify-between gap-3 rounded-xl bg-violet-50/70 px-2.5 py-1.5 text-base text-zinc-800"
                              >
                                <span className="min-w-0 font-medium">
                                  {c.label}
                                  <span className="ml-1.5">
                                    <CyclePill level={c.level} />
                                  </span>
                                </span>
                                <span className="shrink-0 font-bold tabular-nums text-zinc-950">
                                  {fmt(Math.round(c.wasteG))} g de déchets
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-violet-100">
                      <div
                        className="aw-grow-bar h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          animationDelay: `${640 + i * 80}ms`,
                          background:
                            "linear-gradient(90deg, #7c3aed, #c084fc)",
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            </div>
          )}
        </DashboardFoldOverlay>

        {missingWeighCount > 0 && missingWeighVisible.length > 0 ? (
          <div className="aw-reveal overflow-hidden rounded-3xl border-2 border-rose-500 bg-card">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-rose-200 bg-rose-100 p-5">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white">
                  <AlertTriangle className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-bold tracking-tight text-zinc-950">
                    {missingWeighCount} service
                    {missingWeighCount > 1 ? "s" : ""} sans pesée
                  </h2>
                  <p className="mt-1 text-base font-medium leading-snug text-zinc-950">
                    Sur la période. La pesée se saisit depuis l’espace{" "}
                    <span className="font-bold">Cuisine</span> (écran Service,
                    bloc « Poids des déchets »).
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void import("@/lib/downloadMissingWeighPdf").then((mod) =>
                      mod.downloadMissingWeighPdf(missingWeighVisible, days),
                    );
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/60 bg-white px-3 py-1.5 text-sm font-semibold text-rose-800 transition hover:bg-rose-50"
                >
                  <Download className="size-3.5" aria-hidden />
                  Télécharger
                </button>
                {missingWeighVisible.length > 2 ? (
                  <button
                    type="button"
                    onClick={() => setMissingWeighOpen((v) => !v)}
                    aria-expanded={missingWeighOpen}
                    className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/60 bg-white px-3 py-1.5 text-sm font-semibold text-rose-800 transition hover:bg-rose-50"
                  >
                    {missingWeighOpen ? "Voir moins" : "Voir plus"}
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform",
                        missingWeighOpen && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </button>
                ) : null}
              </div>
            </div>

            <ul
              className={cn(
                "grid gap-3 p-5 sm:grid-cols-2",
                missingWeighOpen
                  ? "max-h-[22rem] overflow-y-scroll [scrollbar-gutter:stable]"
                  : "overflow-visible",
              )}
            >
              {missingWeighShown.map((s) => (
                <li key={s.id}>
                  <div className="h-full rounded-2xl border border-rose-200 bg-white px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-base font-bold leading-snug text-zinc-950">
                        {s.dateLabel}
                        <span className="font-semibold"> · {s.mealLabel}</span>
                      </p>
                      <span className="shrink-0 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold text-white">
                        Pesée manquante
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-950">
                      {s.menuSummary}
                      {s.servedCount > 0
                        ? ` · ${fmt(s.servedCount)} assiette${s.servedCount > 1 ? "s" : ""}`
                        : ""}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-rose-800">
                      Rappel cuisine : ouvrir ce service et enregistrer maternelle
                      / primaire après le repas.
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,4fr)]">
          <div className="min-w-0">
            <AntiWasteLineChart days={days} points={chartPoints} />
          </div>
          <div className="min-w-0 lg:h-0 lg:min-h-full">
            <WasteAdvicePanel
              days={days}
              tone={status.tone}
              title={status.title}
              hint={status.hint}
              heaviestLabel={
                heaviestDay && (heaviestDay.g100 > 0 || heaviestDay.waste > 0)
                  ? formatDayLabelFr(heaviestDay.date)
                  : null
              }
              heaviestValue={
                heaviestDay == null
                  ? null
                  : heaviestDay.g100 > 0
                    ? `${fmt(Math.round(heaviestDay.g100))} g / 100`
                    : `${fmt(Math.round(heaviestDay.waste))} g`
              }
              curveRemark={curveRemark}
              dishRemark={dishRemark}
            />
          </div>
        </div>
      </div>

      <div className="aw-reveal overflow-hidden rounded-3xl border border-border bg-card">
        <div className="flex items-start gap-3 border-b border-sky-200 bg-sky-100 p-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-sky-600 text-white">
            <CalendarDays className="size-5" aria-hidden />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
              Détail jour par jour
            </h2>
            <p className="mt-0.5 text-sm font-medium text-foreground/80">
              Pesées, g / 100, RAB et variation des déchets pour chaque
              service.
            </p>
          </div>
        </div>

        <div className="max-h-[28rem] overflow-auto bg-white">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="sticky top-0 z-10 border-b border-border bg-card text-left text-xs uppercase tracking-wider text-foreground/75">
                <th className="px-3 py-3.5 pl-6 font-semibold">Date</th>
                <th className="px-3 py-3.5 font-semibold">Déchets</th>
                <th className="px-3 py-3.5 font-semibold">Mat. / Prim.</th>
                <th className="px-3 py-3.5 font-semibold">g / 100</th>
                <th className="px-3 py-3.5 font-semibold">RAB %</th>
                <th className="px-3 py-3.5 font-semibold">Pesée</th>
                <th className="px-3 py-3.5 pr-6 text-right font-semibold">
                  Δ Déchets
                </th>
              </tr>
            </thead>
            <tbody>
              {[...perDayRows].reverse().map((r) => {
                const weighing = weighingStatusFromLabel(r.weighLabel);
                return (
                  <tr
                    key={r.date}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/50"
                  >
                    <td className="py-3.5 pl-6 font-medium">
                      {formatDayLabelFr(r.date)}
                    </td>
                    <td className="py-3.5">
                      {r.wasteWeightG > 0
                        ? `${fmt(Math.round(r.wasteWeightG))} g`
                        : "—"}
                    </td>
                    <td className="py-3.5 text-muted-foreground">
                      {fmt(Math.round(r.wasteWeightMaternelleG))} /{" "}
                      {fmt(Math.round(r.wasteWeightPrimaireG))} g
                    </td>
                    <td className="py-3.5">
                      {r.wasteGramsPer100 == null
                        ? "—"
                        : fmt1(r.wasteGramsPer100)}
                    </td>
                    <td className="py-3.5">
                      {r.rabRatePct == null ? "—" : `${fmt1(r.rabRatePct)} %`}
                    </td>
                    <td className="py-3.5">
                      <PeseeBadge status={weighing} />
                    </td>
                    <td className="py-3.5 pr-6 text-right">
                      <Delta value={r.wasteDelta} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="flex items-center justify-center gap-2 pb-2 text-xs text-muted-foreground">
        <span>Stop au gaspillage alimentaire</span>
        <span aria-hidden>·</span>
        <span>Données sur {days} jours</span>
      </footer>
      </div>
    </div>
  );
}

function WasteAdvicePanel({
  days,
  tone,
  title,
  hint,
  heaviestLabel,
  heaviestValue,
  curveRemark,
  dishRemark,
}: {
  days: 7 | 30;
  tone: "ok" | "watch" | "alert" | "none";
  title: string;
  hint: string;
  heaviestLabel: string | null;
  heaviestValue: string | null;
  curveRemark: string | null;
  dishRemark: string | null;
}) {
  const toneClass =
    tone === "ok"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "watch"
        ? "border-amber-200 bg-amber-50"
        : tone === "alert"
          ? "border-rose-200 bg-rose-50"
          : "border-zinc-200 bg-zinc-50";

  return (
    <aside className="aw-reveal flex h-full flex-col overflow-hidden rounded-3xl border-2 border-[#eab308] bg-card">
      <div className="flex items-start gap-3 border-b border-[#e6d24a] bg-[#fbe961] p-5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
          <Lightbulb className="size-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold tracking-tight text-zinc-950">
            Avis du suivi
          </h2>
          <p className="mt-1 text-base font-medium leading-snug text-zinc-800">
            Ce que les pesées indiquent sur {days} jours.
          </p>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
        <div className={cn("rounded-2xl border p-4", toneClass)}>
          <p className="font-display text-lg font-bold leading-snug text-zinc-950">
            {title}
          </p>
          <p className="mt-2 text-base font-medium leading-relaxed text-zinc-800">
            {hint}
          </p>
        </div>
        {heaviestLabel && heaviestValue ? (
          <div>
            <p className="inline-flex rounded-md bg-black px-2 py-0.5 text-sm font-bold uppercase tracking-wide text-white">
              Jour le plus lourd
            </p>
            <p className="mt-1 text-base font-semibold leading-snug text-zinc-950">
              {heaviestLabel}
            </p>
            <p className="text-lg font-bold tabular-nums text-zinc-950">
              {heaviestValue}
            </p>
          </div>
        ) : null}
        {curveRemark ? (
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-zinc-950">
              Courbe
            </p>
            <p className="mt-1 text-base font-semibold leading-snug text-zinc-950">
              {curveRemark}
            </p>
          </div>
        ) : null}
        {dishRemark ? (
          <div>
            <p className="inline-flex rounded-md bg-black px-2 py-0.5 text-sm font-bold uppercase tracking-wide text-white">
              Plat à surveiller
            </p>
            <p className="mt-1 text-base font-semibold leading-snug text-zinc-950">
              {dishRemark}
            </p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function PeseeBadge({ status }: { status: "both" | "missing" | "partial" }) {
  const map = {
    both: { label: "Les deux", cls: "bg-primary/12 text-primary" },
    partial: {
      label: "Partielle",
      cls: "bg-[color:var(--aw-amber)]/25 text-[color:var(--aw-amber-fg)]",
    },
    missing: {
      label: "Manquante",
      cls: "bg-[color:var(--aw-coral)]/12 text-[color:var(--aw-coral)]",
    },
  } as const;
  const s = map[status];
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        s.cls,
      )}
    >
      {s.label}
    </span>
  );
}

function Delta({ value }: { value: number | null }) {
  if (value == null || value === 0) {
    return <span className="text-muted-foreground/50">—</span>;
  }
  const up = value > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold tabular-nums",
        up ? "text-[color:var(--aw-coral)]" : "text-primary",
      )}
    >
      {up ? (
        <ArrowUp className="size-3.5" />
      ) : (
        <ArrowDown className="size-3.5" />
      )}
      {up ? "+" : ""}
      {fmt(Math.round(value))}
    </span>
  );
}
