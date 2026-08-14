"use client";

import Link from "next/link";
import {
  Ban,
  ClipboardList,
  Download,
  FileSpreadsheet,
  GitCompareArrows,
  Layers,
  Repeat2,
  Table as TableIcon,
  Trash2,
  TriangleAlert,
  Users,
  Utensils,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { CantinePulseCard } from "@/components/CantinePulseCard";
import { WasteEvolutionChart } from "@/components/dashboard/WasteEvolutionChart";
import { MealFlowChart } from "@/components/dashboard/MealFlowChart";
import { LevelComparisonChart } from "@/components/dashboard/LevelComparisonChart";
import { DashboardHeroBanner } from "@/components/dashboard/DashboardHeroBanner";
import {
  DashboardInsightCard,
  DashboardSectionHeading,
} from "@/components/dashboard/DashboardDesignShell";
import type { WastePerDayRowInput } from "@/lib/buildWasteEvolutionSeries";
import type { LevelMealTotals } from "@/lib/buildLevelComparisonSeries";
import type { CantineServiceRow, CantineWasteDayRow } from "@/lib/cantinePulse";
import { SCHOOL_LEVELS, schoolLevelLabelFr, type SchoolLevel } from "@/lib/schoolLevel";
import type { DashboardDayDetailRow } from "@/lib/buildDashboardDayDetailRows";
import { downloadSuiviJourPdf } from "@/lib/downloadSuiviJourPdf";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Totals = {
  present: number;
  served: number;
  rab: number;
  refused: number;
};

type DashboardDayRow = DashboardDayDetailRow;

type Tone = "primary" | "teal" | "amber" | "coral" | "ink";

const toneMap: Record<Tone, string> = {
  primary: "text-primary bg-primary/10 ring-primary/15",
  teal: "text-[color:var(--chart-2)] bg-[color:var(--chart-2)]/10 ring-[color:var(--chart-2)]/15",
  amber:
    "text-[color:var(--accent-foreground)] bg-[color:var(--accent)]/25 ring-[color:var(--accent)]/40",
  coral: "text-destructive bg-destructive/10 ring-destructive/15",
  ink: "text-[color:var(--dash-ink)] bg-[color:var(--dash-ink)]/10 ring-[color:var(--dash-ink)]/15",
};

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: LucideIcon;
  tone: Tone;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-xl ring-1",
            toneMap[tone],
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
      <div className="mt-4">
        <div className="text-sm font-semibold text-black">{label}</div>
        <div className="mt-0.5 font-display text-3xl font-extrabold tracking-tight text-black tabular-nums">
          {value}
        </div>
        <div className="mt-1 text-xs font-semibold text-black">{sub}</div>
      </div>
    </div>
  );
}

function FilterSegmentLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-xl px-3.5 py-1.5 text-sm font-medium transition-all",
        active
          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
          : "text-black/80 hover:text-black",
      )}
    >
      {children}
    </Link>
  );
}

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
  establishmentId,
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
  establishmentId: string;
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
  const gridCols =
    chartLevels.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-1";

  function formatDelta(value: number | null) {
    if (value == null) return "—";
    if (value === 0) return "0";
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toLocaleString("fr-FR")}`;
  }

  function daysHref(nextDays: 7 | 30) {
    const params = new URLSearchParams();
    params.set("days", String(nextDays));
    if (levelFilter !== "all") params.set("level", levelFilter);
    return `/dashboard?${params.toString()}`;
  }

  function levelHref(level: "all" | SchoolLevel) {
    const params = new URLSearchParams();
    params.set("days", String(days));
    if (level !== "all") params.set("level", level);
    return `/dashboard?${params.toString()}`;
  }

  const wasteSub = (() => {
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
  })();

  const showWasteAlert =
    !isKitchen &&
    (totalWasteWeightG > 0 || totals.refused > 0 || totals.rab > 0);

  return (
    <div className="dashboard-v2 space-y-8">
      <DashboardHeroBanner
        schoolNames={schoolNames}
        days={days}
        isKitchen={isKitchen}
        establishmentId={establishmentId}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label="Période"
          className="inline-flex items-center gap-1 rounded-2xl border border-border bg-card/70 p-1 shadow-sm backdrop-blur"
        >
          <FilterSegmentLink href={daysHref(7)} active={days === 7}>
            7 jours
          </FilterSegmentLink>
          <FilterSegmentLink href={daysHref(30)} active={days === 30}>
            30 jours
          </FilterSegmentLink>
        </div>

        <div
          role="group"
          aria-label="Niveau"
          className="inline-flex items-center gap-1 rounded-2xl border border-border bg-card/70 p-1 shadow-sm backdrop-blur"
        >
          <FilterSegmentLink href={levelHref("all")} active={levelFilter === "all"}>
            Tous niveaux
          </FilterSegmentLink>
          <FilterSegmentLink
            href={levelHref("MATERNELLE")}
            active={levelFilter === "MATERNELLE"}
          >
            Maternelle
          </FilterSegmentLink>
          <FilterSegmentLink
            href={levelHref("PRIMAIRE")}
            active={levelFilter === "PRIMAIRE"}
          >
            Primaire
          </FilterSegmentLink>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {!isKitchen ? (
            <a
              href={`/api/exports/commission-bilan?year=${exportYear}`}
              download
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card/70 px-3.5 py-2 text-sm font-medium text-black shadow-sm backdrop-blur transition-colors hover:bg-secondary"
            >
              <FileSpreadsheet className="size-4 text-primary" />
              Bilan commission
              <span className="text-black/70">(CSV)</span>
            </a>
          ) : null}
          <button
            type="button"
            disabled={perDayRows.length === 0}
            onClick={() =>
              downloadSuiviJourPdf(perDayRows, {
                days,
                levelFilter,
                isKitchen,
              })
            }
            className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--dash-ink)] px-3.5 py-2 text-sm font-semibold text-[color:var(--dash-ink-fg)] shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="size-4" />
            PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          {
            icon: Users,
            tone: "ink" as const,
            label: "Élèves présents",
            value: totals.present.toLocaleString("fr-FR"),
            sub: "sur la période",
          },
          {
            icon: UtensilsCrossed,
            tone: "primary" as const,
            label: "Assiettes servies",
            value: totals.served.toLocaleString("fr-FR"),
            sub: `vs présents : ${servedVsPresentPct}`,
          },
          {
            icon: Repeat2,
            tone: "teal" as const,
            label: "RAB",
            value: totals.rab.toLocaleString("fr-FR"),
            sub: `vs servis : ${rabRatePct}`,
          },
          {
            icon: Ban,
            tone: "coral" as const,
            label: "Refus",
            value: totals.refused.toLocaleString("fr-FR"),
            sub: `taux : ${refusalRatePct}`,
          },
          {
            icon: Trash2,
            tone: "amber" as const,
            label: "Déchets (poids)",
            value:
              totalWasteWeightG > 0
                ? `${Math.round(totalWasteWeightG).toLocaleString("fr-FR")} g`
                : "—",
            sub: wasteSub,
          },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <StatCard {...item} />
          </motion.div>
        ))}
      </div>

      {showWasteAlert ? (
        <div className="relative overflow-hidden rounded-2xl border border-[color:var(--accent)]/40 bg-gradient-to-r from-[color:var(--accent)]/15 to-[color:var(--accent)]/5 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--accent)]/30 text-[color:var(--accent-foreground)] ring-1 ring-[color:var(--accent)]/40">
              <TriangleAlert className="size-5" />
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-black">
                Lecture déchets &amp; refus
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-black/90">
                {wasteGramsPer100Served != null ? (
                  <>
                    Taux actuel{" "}
                    <b className="font-semibold">
                      {wasteGramsPer100Served.toLocaleString("fr-FR", {
                        maximumFractionDigits: 1,
                      })}{" "}
                      g / 100 assiettes
                    </b>
                    .{" "}
                  </>
                ) : null}
                Refus sur la période :{" "}
                <b className="font-semibold">
                  {totals.refused.toLocaleString("fr-FR")}
                </b>
                . RAB :{" "}
                <b className="font-semibold">
                  {totals.rab.toLocaleString("fr-FR")} assiettes
                </b>{" "}
                ({rabRatePct} des servis).
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {!isKitchen ? (
        <CantinePulseCard
          rows={pulseRows}
          wasteRows={pulseWasteRows}
          mealType="LUNCH"
          days={days}
          showBrandTitle
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
      ) : null}

      <section>
        <DashboardSectionHeading
          icon={Utensils}
          title="Flux du repas"
          hint="Présents → servis → RAB / refus, jour par jour."
        />
        <div className={cn("grid grid-cols-1 gap-5", gridCols)}>
          {chartLevels.map((level) => (
            <DashboardInsightCard
              key={`meal-flow-${level}`}
              icon={Utensils}
              title="Flux du repas"
              level={schoolLevelLabelFr(level)}
              description="Le parcours du repas en un coup d'œil — utile pour voir si l'écart présents / servis se creuse."
            >
              <MealFlowChart
                days={days}
                level={level}
                perDayRows={mealFlowByLevel[level]}
                embedded
              />
            </DashboardInsightCard>
          ))}
        </div>
      </section>

      {!isKitchen ? (
        <section>
          <DashboardSectionHeading
            icon={GitCompareArrows}
            title="Taux du cycle"
            hint={`Taux de service, RAB et refus sur ${days} jours.`}
          />
          <div className={cn("grid grid-cols-1 gap-5", gridCols)}>
            {chartLevels.map((level) => (
              <DashboardInsightCard
                key={`level-rates-${level}`}
                icon={GitCompareArrows}
                title="Taux du cycle"
                level={schoolLevelLabelFr(level)}
                description="Service = servis / présents · RAB et refus = vs assiettes servies. Pour ajuster portions et menu."
              >
                <LevelComparisonChart
                  days={days}
                  level={level}
                  totals={levelComparisonTotals[level]}
                  embedded
                />
              </DashboardInsightCard>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <DashboardSectionHeading
          icon={Trash2}
          title="Évolution des déchets"
          hint="Poids des déchets et grammes pour 100 assiettes dans le temps."
        />
        <div className={cn("grid grid-cols-1 gap-5", gridCols)}>
          {chartLevels.map((level) => (
            <DashboardInsightCard
              key={`waste-${level}`}
              icon={Trash2}
              title="Évolution des déchets"
              level={schoolLevelLabelFr(level)}
              description="Courbe pleine = poids des déchets (g) · pointillés = g pour 100 assiettes. Pour repérer quel jour les déchets augmentent."
            >
              <WasteEvolutionChart
                days={days}
                level={level}
                perDayRows={wasteByLevel[level]}
                embedded
              />
            </DashboardInsightCard>
          ))}
        </div>
      </section>

      <section>
        <DashboardSectionHeading
          icon={Layers}
          title="Contexte du service"
          lineClassName="dashboard-section-line--red"
          hint={
            levelFilter !== "all"
              ? `Menus, pesées et écarts — ${schoolLevelLabelFr(levelFilter)}.`
              : "Menus, pesées et écarts par jour de service."
          }
        />
        <div className="overflow-hidden rounded-2xl border-[3px] border-[#c2185b] bg-card p-2 shadow-sm sm:p-3">
          {perDayRows.length === 0 ? (
            <p className="p-4 text-sm font-medium text-black">Pas de données.</p>
          ) : (
            <div className="max-h-[28rem] overflow-auto rounded-xl [scrollbar-gutter:stable] sm:max-h-[32rem]">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10 border-b-[3px] border-[#c2185b] bg-card text-left text-xs font-bold text-black">
                  <tr>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5">g / 100</th>
                    <th className="px-3 py-2.5">Pesée</th>
                    <th className="px-3 py-2.5">Écoles</th>
                    <th className="px-3 py-2.5">Classes</th>
                    <th className="px-3 py-2.5">Menu</th>
                    <th className="px-3 py-2.5">Élèves concernés</th>
                    <th className="px-3 py-2.5">Δ servis</th>
                    <th className="px-3 py-2.5">Δ déchets</th>
                  </tr>
                </thead>
                <tbody className="font-medium text-black">
                  {perDayRows.map((row) => (
                    <tr
                      key={`ctx-${row.date}`}
                      className="border-t border-border/60 align-top"
                    >
                      <td className="px-3 py-2.5 font-medium whitespace-nowrap">
                        {row.date}
                      </td>
                      <td className="px-3 py-2.5">
                        {row.wasteGramsPer100 != null
                          ? row.wasteGramsPer100.toLocaleString("fr-FR", {
                              maximumFractionDigits: 1,
                            })
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {row.weighLabel}
                      </td>
                      <td className="max-w-[10rem] px-3 py-2.5 text-xs leading-snug">
                        {row.schools}
                      </td>
                      <td className="px-3 py-2.5">{row.classCount}</td>
                      <td
                        className="max-w-[14rem] px-3 py-2.5 text-xs leading-snug"
                        title={row.menuSummary}
                      >
                        {row.menuSummary}
                      </td>
                      <td className="px-3 py-2.5">
                        {row.concernedStudents > 0
                          ? row.concernedStudents.toLocaleString("fr-FR")
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">
                        {formatDelta(row.servedDelta)}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">
                        {formatDelta(row.wasteDelta)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section>
        <DashboardSectionHeading
          icon={TableIcon}
          title="Suivi jour par jour"
          lineClassName="dashboard-section-line--blue"
          hint={
            isKitchen
              ? "Aperçu du jour — présents, servis, RAB, refus et déchets."
              : "Détail complet par service — présents, servis, RAB, refus et déchets."
          }
        />
        <div className="overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-sm sm:p-3">
          {perDayRows.length === 0 ? (
            <p className="p-4 text-sm font-medium text-black">Pas de données.</p>
          ) : (
            <div className="max-h-[28rem] overflow-auto rounded-xl [scrollbar-gutter:stable] sm:max-h-[32rem]">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 z-10 border-b-[3px] border-[#0ea5e9] bg-card text-left text-xs font-bold text-black">
                  <tr>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5">Présents</th>
                    <th className="px-3 py-2.5">Servis</th>
                    <th className="px-3 py-2.5">RAB</th>
                    <th className="px-3 py-2.5">RAB %</th>
                    <th className="px-3 py-2.5">Refus</th>
                    <th className="px-3 py-2.5">Refus %</th>
                    {levelFilter === "all" ? (
                      <>
                        <th className="px-3 py-2.5">Déchets mat. (g)</th>
                        <th className="px-3 py-2.5">Déchets prim. (g)</th>
                      </>
                    ) : null}
                    <th className="px-3 py-2.5">
                      Déchets{levelFilter === "all" ? " total" : ""} (g)
                    </th>
                  </tr>
                </thead>
                <tbody className="font-medium text-black">
                  {perDayRows.map((row) => (
                    <tr key={row.date} className="border-t border-border/60">
                      <td className="px-3 py-2.5 font-medium whitespace-nowrap">
                        {row.date}
                      </td>
                      <td className="px-3 py-2.5">
                        {row.present.toLocaleString("fr-FR")}
                      </td>
                      <td className="px-3 py-2.5">
                        {row.served.toLocaleString("fr-FR")}
                      </td>
                      <td className="px-3 py-2.5">
                        {row.rab.toLocaleString("fr-FR")}
                      </td>
                      <td className="px-3 py-2.5">
                        {row.rabRatePct != null
                          ? `${row.rabRatePct.toLocaleString("fr-FR")} %`
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        {row.refused.toLocaleString("fr-FR")}
                      </td>
                      <td className="px-3 py-2.5">
                        {row.refusalRatePct != null
                          ? `${row.refusalRatePct.toLocaleString("fr-FR")} %`
                          : "—"}
                      </td>
                      {levelFilter === "all" ? (
                        <>
                          <td className="px-3 py-2.5">
                            {row.wasteWeightMaternelleG > 0
                              ? row.wasteWeightMaternelleG.toLocaleString("fr-FR")
                              : "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            {row.wasteWeightPrimaireG > 0
                              ? row.wasteWeightPrimaireG.toLocaleString("fr-FR")
                              : "—"}
                          </td>
                        </>
                      ) : null}
                      <td className="px-3 py-2.5">
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
        </div>
      </section>

      {!isKitchen ? (
        <footer className="flex items-center justify-center gap-2 pt-2 text-xs font-medium text-black/80">
          <ClipboardList className="size-3.5" />
          Fonctions Cantine+ · inclus dans Cantine360
        </footer>
      ) : null}
    </div>
  );
}
