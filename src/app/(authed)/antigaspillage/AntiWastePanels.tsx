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
  Leaf,
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
  const status = antiWasteStatus(wasteGramsPer100Served, targetGPer100);
  const gaugeValue = wasteGramsPer100Served ?? 0;
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
    ...riskyDishes.map((d) => d.avgWasteGPer100),
    1,
  );

  return (
    <div className="anti-waste-dash relative space-y-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-8 -z-10 h-[420px] bg-gradient-to-b from-primary/8 to-transparent"
      />

      <section className="aw-reveal">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Leaf className="size-5" aria-hidden />
            </div>
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Cantine 360
              </p>
              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Mode anti-gaspillage
              </h1>
              <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                Le mode anti-gaspillage aide la cuisine et la commission à
                réduire les restes : fixez un objectif en grammes pour 100
                assiettes, puis suivez la synthèse, les plats à risque,
                l’évolution et le détail jour par jour sur {days} jours.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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
        </div>

        <div className="mt-6 grid gap-px overflow-hidden rounded-3xl border border-border bg-border shadow-[0_24px_60px_-30px_rgb(20_60_40/0.35)] lg:grid-cols-[1.05fr_1.35fr]">
          <div className="flex flex-col items-center justify-center gap-5 bg-card px-6 py-10">
            <AntiWasteGauge
              value={gaugeValue}
              objective={targetGPer100}
              status={gaugeStatus}
            />
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold",
                STATUS_STYLES[gaugeStatus],
              )}
            >
              <span className="size-2 rounded-full bg-current" aria-hidden />
              {wasteGramsPer100Served == null || wasteGramsPer100Served <= 0
                ? status.label
                : gaugeStatusLabel[gaugeStatus]}
            </div>
            <p className="max-w-xs text-balance text-center text-sm leading-relaxed text-muted-foreground">
              {status.detail}
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
      </section>

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
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.label}
                </span>
                <Icon className={cn("size-4", t.accent)} aria-hidden />
              </div>
              <p className="mt-3 font-display text-3xl font-bold tracking-tight">
                {t.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{t.sub}</p>
            </div>
          );
        })}
      </div>

      {missingWeighCount > 0 || streakAboveTarget >= 3 ? (
        <div className="aw-reveal overflow-hidden rounded-2xl border border-[color:var(--aw-coral)]/30 bg-[color:var(--aw-coral)]/8">
          <div className="flex w-full flex-wrap items-center justify-between gap-4 px-5 py-4">
            <span className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--aw-coral)]/15 text-[color:var(--aw-coral)]">
                <AlertTriangle className="size-4" aria-hidden />
              </span>
              <span className="space-y-1 text-sm sm:text-base">
                {streakAboveTarget >= 3 ? (
                  <p>
                    <span className="font-semibold text-[color:var(--aw-coral)]">
                      {streakAboveTarget} jours de suite
                    </span>{" "}
                    au-dessus de l’objectif g / 100.
                  </p>
                ) : null}
                {missingWeighCount > 0 ? (
                  <p>
                    <span className="font-semibold text-[color:var(--aw-coral)]">
                      {missingWeighCount} service
                      {missingWeighCount > 1 ? "s" : ""}
                    </span>{" "}
                    sans pesée sur la période.
                  </p>
                ) : null}
              </span>
            </span>
            {missingWeighServices.length > 0 ? (
              <button
                type="button"
                onClick={() => setMissingWeighOpen((v) => !v)}
                aria-expanded={missingWeighOpen}
                className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--aw-coral)]/30 px-3 py-1 text-xs font-medium text-[color:var(--aw-coral)]"
              >
                {missingWeighOpen ? "Voir moins" : "Voir plus"}
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform",
                    missingWeighOpen && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
            ) : null}
          </div>

          <div
            className={cn(
              "grid transition-all duration-300 ease-out",
              missingWeighOpen
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0",
            )}
          >
            <div className="overflow-hidden">
              <ul className="grid gap-2 px-5 pb-5 sm:grid-cols-2">
                {missingWeighServices.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/service/${s.id}`}
                      className="block rounded-xl border border-[color:var(--aw-coral)]/20 bg-card/70 px-4 py-3 transition hover:border-[color:var(--aw-coral)]/45"
                    >
                      <p className="text-sm font-semibold">
                        {s.dateLabel}{" "}
                        <span className="text-muted-foreground">
                          · {s.mealLabel}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.menuSummary}
                        {s.servedCount > 0
                          ? ` · ${fmt(s.servedCount)} assiette${s.servedCount > 1 ? "s" : ""}`
                          : ""}{" "}
                        · Pesée manquante
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="aw-reveal flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card">
          <div className="flex items-start gap-3 border-b border-border p-6">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[color:var(--aw-coral)]/12 text-[color:var(--aw-coral)]">
              <Flame className="size-5" aria-hidden />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold tracking-tight">
                Plats à risque
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Les plats liés aux jours de plus fort gaspillage sur {days}{" "}
                jours — pour décider quoi ajuster demain.
              </p>
            </div>
          </div>

          {riskyDishes.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              Pas encore assez de menus + pesées sur la période pour classer
              les plats.
            </p>
          ) : (
            <ul className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
              {riskyDishes.map((d, i) => {
                const pct = Math.max((d.avgWasteGPer100 / maxRiskG) * 100, 3);
                const rank = i + 1;
                return (
                  <li
                    key={`${d.label}-${i}`}
                    className="rounded-2xl border border-border p-4 transition-colors hover:border-[color:var(--aw-coral)]/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-primary-foreground"
                          style={{
                            background:
                              rank === 1
                                ? "var(--aw-coral)"
                                : rank === 2
                                  ? "var(--aw-amber)"
                                  : "var(--aw-primary)",
                          }}
                        >
                          {rank}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold leading-tight capitalize">
                            {d.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {d.serviceCount} service
                            {d.serviceCount > 1 ? "s" : ""} avec ce plat
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-display text-xl font-bold tracking-tight text-[color:var(--aw-coral)]">
                          {fmt(Math.round(d.avgWasteGPer100))}
                          <span className="ml-1 text-xs font-medium text-muted-foreground">
                            g / 100
                          </span>
                        </p>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {d.vsTarget === "above"
                            ? "Au-dessus objectif"
                            : d.vsTarget === "ok"
                              ? "Sous objectif"
                              : "Sans objectif"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="aw-grow-bar h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          animationDelay: `${640 + i * 80}ms`,
                          background:
                            "linear-gradient(90deg, var(--aw-coral), var(--aw-amber))",
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <AntiWasteLineChart days={days} points={chartPoints} />
      </div>

      <div className="aw-reveal overflow-hidden rounded-3xl border border-border bg-card">
        <div className="flex items-start gap-3 border-b border-border p-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <CalendarDays className="size-5" aria-hidden />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight">
              Détail jour par jour
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Pesées, g / 100, RAB et variation des déchets pour chaque
              service.
            </p>
          </div>
        </div>

        <div className="max-h-[28rem] overflow-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="sticky top-0 z-10 border-b border-border bg-card text-left text-xs uppercase tracking-wider text-muted-foreground">
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
