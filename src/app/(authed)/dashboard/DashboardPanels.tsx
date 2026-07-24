"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CantinePulseCard } from "@/components/CantinePulseCard";
import { WasteEvolutionChart } from "@/components/dashboard/WasteEvolutionChart";
import { MealFlowChart } from "@/components/dashboard/MealFlowChart";
import { LevelComparisonChart } from "@/components/dashboard/LevelComparisonChart";
import { CantinePlusSection } from "@/components/dashboard/CantinePlusSection";
import type { WastePerDayRowInput } from "@/lib/buildWasteEvolutionSeries";
import type { LevelMealTotals } from "@/lib/buildLevelComparisonSeries";
import type { CantineServiceRow, CantineWasteDayRow } from "@/lib/cantinePulse";
import { GROUP_CARD_COLORS } from "@/lib/groupCardColors";
import { SCHOOL_LEVELS, schoolLevelLabelFr, type SchoolLevel } from "@/lib/schoolLevel";
import type { DashboardDayDetailRow } from "@/lib/buildDashboardDayDetailRows";

type Totals = {
  present: number;
  served: number;
  rab: number;
  refused: number;
};

type DashboardDayRow = DashboardDayDetailRow;

export type DashboardEcoGroupRow = {
  groupName: string;
  restesServisTargetPct: number | null;
  reductionTargetPct: number | null;
  ytd: { leftovers: number; served: number };
  priorYtdLeftovers: number;
};

export type DashboardEcoPayload = {
  groups: DashboardEcoGroupRow[];
  periodTitle: string;
  restesParen: string;
  priorPhrase: string;
};

export default function DashboardPanels({
  days,
  schoolNames,
  role,
  exportYear,
  levelFilter,
  pulseRows,
  pulseWasteRows,
  eco,
  totals,
  refusalRatePct,
  rabRatePct,
  servedVsPresentPct,
  totalWasteWeightG,
  totalWasteMaternelleG,
  totalWastePrimaireG,
  servicesWithWaste,
  wasteGramsPer100Served,
  perDayRows,
  mealFlowByLevel,
  wasteByLevel,
  levelComparisonTotals,
}: {
  days: 7 | 30;
  schoolNames: string[];
  role: "ADMIN" | "KITCHEN";
  exportYear: number;
  levelFilter: "all" | SchoolLevel;
  pulseRows: CantineServiceRow[];
  pulseWasteRows: CantineWasteDayRow[];
  eco: DashboardEcoPayload | null;
  totals: Totals;
  refusalRatePct: string;
  rabRatePct: string;
  servedVsPresentPct: string;
  totalWasteWeightG: number;
  totalWasteMaternelleG: number;
  totalWastePrimaireG: number;
  servicesWithWaste: number;
  wasteGramsPer100Served: number | null;
  perDayRows: DashboardDayRow[];
  mealFlowByLevel: Record<
    SchoolLevel,
    Array<{
      date: string;
      present: number;
      served: number;
      rab: number;
      refused: number;
    }>
  >;
  wasteByLevel: Record<SchoolLevel, WastePerDayRowInput[]>;
  levelComparisonTotals: Record<SchoolLevel, LevelMealTotals>;
}) {
  const isKitchen = role === "KITCHEN";
  const chartLevels =
    levelFilter === "all" ? SCHOOL_LEVELS : ([levelFilter] as SchoolLevel[]);

  function formatDelta(value: number | null) {
    if (value == null) return "—";
    if (value === 0) return "0";
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toLocaleString("fr-FR")}`;
  }

  const kpis = [
    {
      label: "Élèves présents",
      value: totals.present.toLocaleString("fr-FR"),
    },
    {
      label: "Servis",
      value: totals.served.toLocaleString("fr-FR"),
      sub: `vs présents : ${servedVsPresentPct}`,
    },
    {
      label: "RAB",
      value: totals.rab.toLocaleString("fr-FR"),
      sub: `vs servis : ${rabRatePct}`,
    },
    {
      label: "Refus",
      value: totals.refused.toLocaleString("fr-FR"),
      sub: `taux : ${refusalRatePct}`,
    },
    {
      label: "Déchets",
      value:
        totalWasteWeightG > 0
          ? `${Math.round(totalWasteWeightG).toLocaleString("fr-FR")} g`
          : "—",
      sub: (() => {
        const parts: string[] = [];
        if (
          levelFilter === "all" &&
          (totalWasteMaternelleG > 0 || totalWastePrimaireG > 0)
        ) {
          if (totalWasteMaternelleG > 0) {
            parts.push(
              `Mat. ${Math.round(totalWasteMaternelleG).toLocaleString("fr-FR")} g`,
            );
          }
          if (totalWastePrimaireG > 0) {
            parts.push(
              `Prim. ${Math.round(totalWastePrimaireG).toLocaleString("fr-FR")} g`,
            );
          }
        }
        if (wasteGramsPer100Served != null) {
          parts.push(
            `${wasteGramsPer100Served.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} g / 100 assiettes`,
          );
        } else if (parts.length === 0 && servicesWithWaste > 0) {
          parts.push(
            `${servicesWithWaste} service${servicesWithWaste > 1 ? "s" : ""} saisi${servicesWithWaste > 1 ? "s" : ""}`,
          );
        }
        return parts.length > 0 ? parts.join(" · ") : "saisir en fin de service";
      })(),
    },
  ];

  function levelHref(level: "all" | SchoolLevel) {
    const params = new URLSearchParams();
    params.set("days", String(days));
    if (level !== "all") params.set("level", level);
    return `/dashboard?${params.toString()}`;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {isKitchen ? "Tableau de bord cuisine" : "Bienvenue sur votre tableau de bord"}
          {schoolNames.length === 1 ? (
            <>
              <span aria-hidden> — </span>
              <span className="text-emerald-700">{schoolNames[0]}</span>
            </>
          ) : null}
        </h1>
        {schoolNames.length > 1 ? (
          <p className="mt-1 text-sm text-zinc-700 sm:text-base">
            <span className="font-medium text-zinc-600">Écoles suivies : </span>
            {schoolNames.map((name, index) => (
              <span key={name}>
                {index > 0 ? (
                  <span aria-hidden className="text-zinc-400">
                    {" "}
                    ·{" "}
                  </span>
                ) : null}
                <span className="font-semibold text-emerald-700">{name}</span>
              </span>
            ))}
          </p>
        ) : null}
        <p className="mt-1 text-muted-foreground">
          Indicateurs sur les {days} derniers jours
          {levelFilter !== "all"
            ? ` — ${schoolLevelLabelFr(levelFilter).toLowerCase()}`
            : ""}
        </p>
      </div>

      <p className="text-base font-semibold leading-snug text-zinc-900 sm:text-lg">
        {isKitchen
          ? `Aperçu du jour et évolution des déchets sur les ${days} derniers jours.`
          : `Aperçu — chiffres clés du déjeuner, note Cantine +, évolution des déchets et détail jour par jour sur les ${days} derniers jours.`}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button variant={days === 7 ? "default" : "outline"} asChild>
            <Link
              href={`/dashboard?days=7${levelFilter !== "all" ? `&level=${levelFilter}` : ""}`}
            >
              7 jours
            </Link>
          </Button>
          <Button variant={days === 30 ? "default" : "outline"} asChild>
            <Link
              href={`/dashboard?days=30${levelFilter !== "all" ? `&level=${levelFilter}` : ""}`}
            >
              30 jours
            </Link>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Button variant={levelFilter === "all" ? "default" : "outline"} asChild>
            <Link href={levelHref("all")}>Tous niveaux</Link>
          </Button>
          <Button
            variant={levelFilter === "MATERNELLE" ? "default" : "outline"}
            asChild
          >
            <Link href={levelHref("MATERNELLE")}>Maternelle</Link>
          </Button>
          <Button
            variant={levelFilter === "PRIMAIRE" ? "default" : "outline"}
            asChild
          >
            <Link href={levelHref("PRIMAIRE")}>Primaire</Link>
          </Button>
          {!isKitchen ? (
            <Button variant="outline" asChild>
              <a
                href={`/api/exports/commission-bilan?year=${exportYear}`}
                download
                className="inline-flex items-center gap-2"
              >
                <Download className="h-4 w-4" aria-hidden />
                Bilan commission (CSV)
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <div
        className={
          isKitchen
            ? "grid grid-cols-2 items-stretch gap-1.5 sm:grid-cols-3 sm:gap-2 lg:grid-cols-5"
            : "grid grid-cols-2 items-stretch gap-1.5 sm:grid-cols-3 sm:gap-2 lg:grid-cols-5"
        }
      >
        {kpis.map((item, i) => (
          <motion.div
            key={item.label}
            className="flex h-full flex-col"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <p className="mb-1.5 text-center text-sm font-bold leading-tight text-zinc-900 sm:mb-2 sm:text-base">
              {item.label}
            </p>
            <Card className="h-full w-full flex-1 gap-0 rounded-xl border-2 border-emerald-600 bg-card/50 py-0 shadow-none backdrop-blur-sm dark:border-emerald-500">
              <CardContent className="flex h-full flex-col justify-center p-1.5 sm:p-2.5 sm:px-3">
                <p className="text-xl font-bold tabular-nums leading-none tracking-tight text-foreground sm:text-2xl">
                  {item.value}
                </p>
                <p className="mt-0.5 min-h-[2rem] line-clamp-2 text-[11px] leading-snug text-muted-foreground sm:min-h-[2.25rem] sm:text-xs">
                  {"sub" in item && item.sub ? (
                    <span className="!font-bold">{item.sub}</span>
                  ) : (
                    <span className="invisible select-none" aria-hidden>
                      —
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {isKitchen ? (
        <div className="space-y-8 sm:space-y-10">
          <div className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Flux du repas
            </h2>
            <div className="relative space-y-4 pl-8 sm:pl-10">
              <div
                aria-hidden
                className="absolute bottom-0 left-0 top-0 w-1 rounded-full bg-yellow-400"
              />
              {chartLevels.map((level) => (
                <MealFlowChart
                  key={`meal-flow-${level}`}
                  days={days}
                  level={level}
                  perDayRows={mealFlowByLevel[level]}
                />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Évolution des déchets
            </h2>
            <div className="relative space-y-4 pl-8 sm:pl-10">
              <div
                aria-hidden
                className="absolute bottom-0 left-0 top-0 w-1 rounded-full bg-emerald-500"
              />
              {chartLevels.map((level) => (
                <WasteEvolutionChart
                  key={`waste-${level}`}
                  days={days}
                  level={level}
                  perDayRows={wasteByLevel[level]}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <CantinePlusSection>
          <CantinePulseCard
            rows={pulseRows}
            wasteRows={pulseWasteRows}
            mealType="LUNCH"
            days={days}
            showBrandTitle={false}
            levelFilter={levelFilter}
            eco={
              eco
                ? {
                    groups: eco.groups,
                    periodTitle: eco.periodTitle,
                    restesParen: eco.restesParen,
                    priorPhrase: eco.priorPhrase,
                  }
                : null
            }
          />
          <div className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Flux du repas
            </h2>
            <div className="relative space-y-4 pl-8 sm:pl-10">
              <div
                aria-hidden
                className="absolute bottom-0 left-0 top-0 w-1 rounded-full bg-yellow-400"
              />
              {chartLevels.map((level) => (
                <MealFlowChart
                  key={`meal-flow-${level}`}
                  days={days}
                  level={level}
                  perDayRows={mealFlowByLevel[level]}
                />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Taux du cycle
            </h2>
            <div className="relative space-y-4 pl-8 sm:pl-10">
              <div
                aria-hidden
                className="absolute bottom-0 left-0 top-0 w-1 rounded-full bg-zinc-900"
              />
              {chartLevels.map((level) => (
                <LevelComparisonChart
                  key={`level-rates-${level}`}
                  days={days}
                  level={level}
                  totals={levelComparisonTotals[level]}
                />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Évolution des déchets
            </h2>
            <div className="relative space-y-4 pl-8 sm:pl-10">
              <div
                aria-hidden
                className="absolute bottom-0 left-0 top-0 w-1 rounded-full bg-emerald-500"
              />
              {chartLevels.map((level) => (
                <WasteEvolutionChart
                  key={`waste-${level}`}
                  days={days}
                  level={level}
                  perDayRows={wasteByLevel[level]}
                />
              ))}
            </div>
          </div>
        </CantinePlusSection>
      )}

      <div className="flex flex-col gap-4">
        <Card
          className="flex h-full flex-col border-border/50 backdrop-blur-sm"
          style={{ backgroundColor: GROUP_CARD_COLORS[4] }}
        >
          <CardContent className="flex flex-1 flex-col p-6">
            <h2 className="text-lg font-semibold text-foreground">
              {isKitchen ? "Aperçu du jour" : "Détails par service"}
              {levelFilter !== "all" ? (
                <>
                  {" "}
                  —{" "}
                  <span className="text-emerald-700">
                    {schoolLevelLabelFr(levelFilter)}
                  </span>
                </>
              ) : null}
            </h2>
            {perDayRows.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Pas de données.</p>
            ) : (
              <div className="mt-4 max-h-80 overflow-y-auto overflow-x-auto rounded-xl border border-black/10 bg-white pr-1 [scrollbar-gutter:stable] sm:max-h-96">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-white text-left text-xs font-semibold text-muted-foreground shadow-[0_1px_0_0_rgba(0,0,0,0.08)]">
                    <tr>
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Présents</th>
                      <th className="py-2 pr-3">Servis</th>
                      <th className="py-2 pr-3">RAB</th>
                      <th className="py-2 pr-3">RAB %</th>
                      <th className="py-2 pr-3">Refus</th>
                      <th className="py-2 pr-3">Refus %</th>
                      {levelFilter === "all" ? (
                        <>
                          <th className="py-2 pr-3">Déchets mat. (g)</th>
                          <th className="py-2 pr-3">Déchets prim. (g)</th>
                        </>
                      ) : null}
                      <th className="py-2">
                        Déchets{levelFilter === "all" ? " total" : ""} (g)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground">
                    {perDayRows.map((row) => (
                      <tr key={row.date} className="border-t border-border/60">
                        <td className="py-2 pr-3 font-medium whitespace-nowrap">
                          {row.date}
                        </td>
                        <td className="py-2 pr-3">
                          {row.present.toLocaleString("fr-FR")}
                        </td>
                        <td className="py-2 pr-3">
                          {row.served.toLocaleString("fr-FR")}
                        </td>
                        <td className="py-2 pr-3">
                          {row.rab.toLocaleString("fr-FR")}
                        </td>
                        <td className="py-2 pr-3">
                          {row.rabRatePct != null
                            ? `${row.rabRatePct.toLocaleString("fr-FR")} %`
                            : "—"}
                        </td>
                        <td className="py-2 pr-3">
                          {row.refused.toLocaleString("fr-FR")}
                        </td>
                        <td className="py-2 pr-3">
                          {row.refusalRatePct != null
                            ? `${row.refusalRatePct.toLocaleString("fr-FR")} %`
                            : "—"}
                        </td>
                        {levelFilter === "all" ? (
                          <>
                            <td className="py-2 pr-3">
                              {row.wasteWeightMaternelleG > 0
                                ? row.wasteWeightMaternelleG.toLocaleString("fr-FR")
                                : "—"}
                            </td>
                            <td className="py-2 pr-3">
                              {row.wasteWeightPrimaireG > 0
                                ? row.wasteWeightPrimaireG.toLocaleString("fr-FR")
                                : "—"}
                            </td>
                          </>
                        ) : null}
                        <td className="py-2">
                          {row.wasteWeightG > 0
                            ? row.wasteWeightG.toLocaleString("fr-FR")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          className="flex h-full flex-col border-border/50 backdrop-blur-sm"
          style={{ backgroundColor: GROUP_CARD_COLORS[0] }}
        >
          <CardContent className="flex flex-1 flex-col p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Contexte du service
              {levelFilter !== "all" ? (
                <>
                  {" "}
                  —{" "}
                  <span className="text-emerald-700">
                    {schoolLevelLabelFr(levelFilter)}
                  </span>
                </>
              ) : null}
            </h2>
            {perDayRows.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Pas de données.</p>
            ) : (
              <div className="mt-4 max-h-80 overflow-y-auto overflow-x-auto rounded-xl border border-black/10 bg-white pr-1 [scrollbar-gutter:stable] sm:max-h-96">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-white text-left text-xs font-semibold text-muted-foreground shadow-[0_1px_0_0_rgba(0,0,0,0.08)]">
                    <tr>
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">g / 100</th>
                      <th className="py-2 pr-3">Pesée</th>
                      <th className="py-2 pr-3">Écoles</th>
                      <th className="py-2 pr-3">Classes</th>
                      <th className="py-2 pr-3">Menu</th>
                      <th className="py-2 pr-3">Élèves concernés</th>
                      <th className="py-2 pr-3">Δ servis</th>
                      <th className="py-2">Δ déchets</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground">
                    {perDayRows.map((row) => (
                      <tr
                        key={`ctx-${row.date}`}
                        className="border-t border-border/60 align-top"
                      >
                        <td className="py-2 pr-3 font-medium whitespace-nowrap">
                          {row.date}
                        </td>
                        <td className="py-2 pr-3">
                          {row.wasteGramsPer100 != null
                            ? row.wasteGramsPer100.toLocaleString("fr-FR", {
                                maximumFractionDigits: 1,
                              })
                            : "—"}
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap">{row.weighLabel}</td>
                        <td className="max-w-[10rem] py-2 pr-3 text-xs leading-snug">
                          {row.schools}
                        </td>
                        <td className="py-2 pr-3">{row.classCount}</td>
                        <td
                          className="max-w-[14rem] py-2 pr-3 text-xs leading-snug"
                          title={row.menuSummary}
                        >
                          {row.menuSummary}
                        </td>
                        <td className="py-2 pr-3">
                          {row.concernedStudents > 0
                            ? row.concernedStudents.toLocaleString("fr-FR")
                            : "—"}
                        </td>
                        <td className="py-2 pr-3 tabular-nums">
                          {formatDelta(row.servedDelta)}
                        </td>
                        <td className="py-2 tabular-nums">
                          {formatDelta(row.wasteDelta)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
