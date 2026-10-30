"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Download,
  FileSpreadsheet,
  GitCompareArrows,
  Layers,
  Table as TableIcon,
  Trash2,
  Utensils,
} from "lucide-react";
import { CantinePulseCard } from "@/components/CantinePulseCard";
import { CantinePlusFold } from "@/components/dashboard/CantinePlusSection";
import { DashboardFoldOverlay } from "@/components/dashboard/DashboardFoldOverlay";
import { WasteEvolutionChart } from "@/components/dashboard/WasteEvolutionChart";
import { MealFlowChart } from "@/components/dashboard/MealFlowChart";
import { LevelComparisonChart } from "@/components/dashboard/LevelComparisonChart";
import { DashboardHeroBanner } from "@/components/dashboard/DashboardHeroBanner";
import { KitchenDashboardKpis } from "@/components/dashboard/KitchenDashboardKpis";
import { DashboardInsightCard } from "@/components/dashboard/DashboardDesignShell";
import {
  buildWasteEvolutionSeries,
  type WastePerDayRowInput,
} from "@/lib/buildWasteEvolutionSeries";
import { buildWasteEvolutionConclusion } from "@/lib/wasteEvolutionConclusion";
import { buildCycleRatesConclusion } from "@/lib/cycleRatesConclusion";
import {
  buildMealFlowSeries,
  type MealFlowDayInput,
} from "@/lib/buildMealFlowSeries";
import {
  buildMealFlowConclusion,
  mealFlowHasData,
} from "@/lib/mealFlowConclusion";
import {
  levelTotalsHasData,
  type LevelMealTotals,
} from "@/lib/buildLevelComparisonSeries";
import type { CantineServiceRow, CantineWasteDayRow } from "@/lib/cantinePulse";
import { SCHOOL_LEVELS, schoolLevelLabelFr, type SchoolLevel } from "@/lib/schoolLevel";
import type { DashboardDayDetailRow } from "@/lib/buildDashboardDayDetailRows";
import { downloadSuiviJourPdf } from "@/lib/downloadSuiviJourPdf";
import { downloadWasteEvolutionPdf } from "@/lib/downloadWasteEvolutionPdf";
import { downloadCycleRatesPdf } from "@/lib/downloadCycleRatesPdf";
import { downloadMealFlowPdf } from "@/lib/downloadMealFlowPdf";
import { downloadCantinePlusPdf } from "@/lib/downloadCantinePlusPdf";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { sessionRoleForPath } from "@/server/auth-cookies";

type Totals = {
  present: number;
  served: number;
  rab: number;
  refused: number;
};

type DashboardDayRow = DashboardDayDetailRow;

function OverlayFilterLink({
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
        "rounded-full px-3 py-1.5 text-xs font-bold transition-colors sm:px-3.5 sm:text-sm",
        active ? "bg-[#0d7a45] text-white shadow-sm" : "text-zinc-800 hover:text-zinc-950",
      )}
    >
      {children}
    </Link>
  );
}

function OverlayTableToolbar({
  days,
  levelFilter,
  daysHref,
  levelHref,
  downloadDisabled,
  onDownload,
}: {
  days: 7 | 30;
  levelFilter: "all" | SchoolLevel;
  daysHref: (nextDays: 7 | 30) => string;
  levelHref: (level: "all" | SchoolLevel) => string;
  downloadDisabled?: boolean;
  onDownload: () => void;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <div
        role="group"
        aria-label="Période"
        className="inline-flex items-center rounded-full bg-white p-1 shadow-sm"
      >
        <OverlayFilterLink href={daysHref(7)} active={days === 7}>
          7 jours
        </OverlayFilterLink>
        <OverlayFilterLink href={daysHref(30)} active={days === 30}>
          30 jours
        </OverlayFilterLink>
      </div>
      <div
        role="group"
        aria-label="Niveau"
        className="inline-flex items-center rounded-full bg-white p-1 shadow-sm"
      >
        <OverlayFilterLink href={levelHref("all")} active={levelFilter === "all"}>
          Tous niveaux
        </OverlayFilterLink>
        <OverlayFilterLink
          href={levelHref("MATERNELLE")}
          active={levelFilter === "MATERNELLE"}
        >
          Maternelle
        </OverlayFilterLink>
        <OverlayFilterLink
          href={levelHref("PRIMAIRE")}
          active={levelFilter === "PRIMAIRE"}
        >
          Primaire
        </OverlayFilterLink>
      </div>
      <button
        type="button"
        disabled={downloadDisabled}
        onClick={onDownload}
        className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-zinc-900 shadow-sm transition duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:hover:scale-100"
      >
        <Download className="size-4" aria-hidden />
        Télécharger
      </button>
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
  establishmentLabel = "",
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
  antiWasteModeEnabled = false,
  antiWasteTargetGPer100 = null,
}: {
  days: 7 | 30;
  schoolNames: string[];
  role: "ADMIN" | "KITCHEN";
  establishmentId: string;
  establishmentLabel?: string;
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
  mealFlowByLevel: Record<SchoolLevel, MealFlowDayInput[]>;
  wasteByLevel: Record<SchoolLevel, WastePerDayRowInput[]>;
  levelComparisonTotals: Record<SchoolLevel, LevelMealTotals>;
  antiWasteModeEnabled?: boolean;
  antiWasteTargetGPer100?: number | null;
}) {
  const pathname = usePathname();
  const viewRole = sessionRoleForPath(pathname) ?? role;
  const isKitchen = viewRole === "KITCHEN";
  /** Lecture globale / Cantine+ : admin seulement, jamais l’URL cuisine `/dashboard`. */
  const hideCantinePlus =
    isKitchen || pathname === "/dashboard" || pathname.startsWith("/dashboard/");
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

  const dashboardBase =
    viewRole === "ADMIN" ? "/admin/dashboard" : "/dashboard";

  function daysHref(nextDays: 7 | 30) {
    const params = new URLSearchParams();
    params.set("days", String(nextDays));
    if (levelFilter !== "all") params.set("level", levelFilter);
    return `${dashboardBase}?${params.toString()}`;
  }

  function levelHref(level: "all" | SchoolLevel) {
    const params = new URLSearchParams();
    params.set("days", String(days));
    if (level !== "all") params.set("level", level);
    return `${dashboardBase}?${params.toString()}`;
  }

  return (
    <div
      className={cn(
        "dashboard-v2 dashboard-v2--admin space-y-8",
      )}
    >
      <DashboardHeroBanner
        schoolNames={schoolNames}
        days={days}
        isKitchen={isKitchen}
        establishmentId={establishmentId}
        establishmentLabel={establishmentLabel}
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

      <div className="dashboard-v2-fade space-y-8">
      <KitchenDashboardKpis
        days={days}
        levelFilter={levelFilter}
        totals={totals}
        servedVsPresentPct={servedVsPresentPct}
        rabRatePct={rabRatePct}
        refusalRatePct={refusalRatePct}
        totalWasteWeightG={totalWasteWeightG}
        totalWasteMaternelleG={totalWasteMaternelleG}
        totalWastePrimaireG={totalWastePrimaireG}
        wasteGramsPer100Served={wasteGramsPer100Served}
        servicesWithWaste={servicesWithWaste}
        perDayRows={perDayRows}
      />

      {!hideCantinePlus ? (
        <CantinePlusFold
          subtitle="Cantine+ suit le repas du quotidien : elle calcule une note sur 100, met en avant le RAB et le poids des déchets, et affiche les tendances pour aider cuisine et direction à réduire le gaspillage."
          headerAction={
            <OverlayTableToolbar
              days={days}
              levelFilter={levelFilter}
              daysHref={daysHref}
              levelHref={levelHref}
              downloadDisabled={pulseRows.length === 0 && pulseWasteRows.length === 0}
              onDownload={() =>
                downloadCantinePlusPdf(pulseRows, pulseWasteRows, {
                  days,
                  levelFilter,
                })
              }
            />
          }
        >
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
            antiWasteModeEnabled={antiWasteModeEnabled}
            antiWasteTargetGPer100={antiWasteTargetGPer100}
          />
        </CantinePlusFold>
      ) : null}

      {!isKitchen ? (
      <DashboardFoldOverlay
        kicker="Flux du repas"
        openLabel="Ouvrir Flux du repas"
        overlayTitle="Flux du repas"
        subtitle="Suivez présents, servis, RAB et refus jour par jour, comparez les cycles, puis lisez la conclusion."
        hint="Présents → servis → RAB / refus, jour par jour. Filtrez, lisez, téléchargez."
        icon={Utensils}
        iconTileClassName="bg-[#f3d7a0] text-[#6b4a12]"
        labelledBy="meal-flow-overlay-title"
        closeButtonClassName="bg-[#37784a] hover:bg-[#2f6840]"
        headerAction={
          <OverlayTableToolbar
            days={days}
            levelFilter={levelFilter}
            daysHref={daysHref}
            levelHref={levelHref}
            downloadDisabled={chartLevels.every(
              (level) => !mealFlowHasData(mealFlowByLevel[level] ?? []),
            )}
            onDownload={() =>
              downloadMealFlowPdf(mealFlowByLevel, chartLevels, {
                days,
                levelFilter,
              })
            }
          />
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-5">
            {chartLevels.map((level) => (
              <DashboardInsightCard
                key={`meal-flow-${level}`}
                icon={Utensils}
                title="Flux du repas"
                level={schoolLevelLabelFr(level)}
                headerClassName={
                  level === "MATERNELLE" ? "bg-sky-200" : "bg-emerald-200"
                }
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
          <div
            className={cn(
              "grid grid-cols-1 gap-3",
              chartLevels.length === 2 && "lg:grid-cols-2",
            )}
          >
            {chartLevels.map((level) => (
              <div
                key={`meal-flow-conclusion-${level}`}
                className={cn(
                  "rounded-2xl px-4 py-3.5 ring-1",
                  level === "MATERNELLE"
                    ? "bg-sky-50 ring-sky-200"
                    : "bg-emerald-50 ring-emerald-200",
                )}
              >
                <p
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white",
                    level === "MATERNELLE" ? "bg-sky-600" : "bg-emerald-600",
                  )}
                >
                  Conclusion {schoolLevelLabelFr(level)}
                </p>
                <p className="mt-2 text-base font-semibold leading-relaxed text-zinc-950 sm:text-lg">
                  {buildMealFlowConclusion(
                    buildMealFlowSeries(mealFlowByLevel[level] ?? []),
                    { days, level },
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      </DashboardFoldOverlay>
      ) : null}

      {!isKitchen ? (
        <DashboardFoldOverlay
          kicker="Taux du cycle"
          openLabel="Ouvrir Taux du cycle"
          overlayTitle="Taux du cycle"
          subtitle="Comparez le service, le RAB et les refus par cycle, pour ajuster portions et menu."
          hint={`Taux de service = servis / présents · RAB et refus = vs assiettes servies · ${days} jours. Filtrez, lisez, téléchargez.`}
          icon={GitCompareArrows}
          iconTileClassName="bg-[#bfe4f5] text-[#0b4a66]"
          labelledBy="cycle-rates-overlay-title"
          closeButtonClassName="bg-[#37784a] hover:bg-[#2f6840]"
          headerAction={
            <OverlayTableToolbar
              days={days}
              levelFilter={levelFilter}
              daysHref={daysHref}
              levelHref={levelHref}
              downloadDisabled={chartLevels.every(
                (level) => !levelTotalsHasData(levelComparisonTotals[level]),
              )}
              onDownload={() =>
                downloadCycleRatesPdf(levelComparisonTotals, chartLevels, {
                  days,
                  levelFilter,
                })
              }
            />
          }
        >
          <div className="space-y-3">
            <div className={cn("grid grid-cols-1 gap-5", gridCols)}>
              {chartLevels.map((level) => (
                <DashboardInsightCard
                  key={`level-rates-${level}`}
                  icon={GitCompareArrows}
                  title="Taux du cycle"
                  level={schoolLevelLabelFr(level)}
                  headerClassName={
                    level === "MATERNELLE" ? "bg-sky-200" : "bg-emerald-200"
                  }
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
            <div
              className={cn(
                "grid grid-cols-1 gap-3",
                chartLevels.length === 2 && "lg:grid-cols-2",
              )}
            >
              {chartLevels.map((level) => (
                <div
                  key={`cycle-conclusion-${level}`}
                  className={cn(
                    "rounded-2xl px-4 py-3.5 ring-1",
                    level === "MATERNELLE"
                      ? "bg-sky-50 ring-sky-200"
                      : "bg-emerald-50 ring-emerald-200",
                  )}
                >
                  <p
                    className={cn(
                      "inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white",
                      level === "MATERNELLE" ? "bg-sky-600" : "bg-emerald-600",
                    )}
                  >
                    Conclusion {schoolLevelLabelFr(level)}
                  </p>
                  <p className="mt-2 text-base font-semibold leading-relaxed text-zinc-950 sm:text-lg">
                    {buildCycleRatesConclusion(levelComparisonTotals[level], {
                      days,
                      level,
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </DashboardFoldOverlay>
      ) : null}

      {!isKitchen ? (
      <DashboardFoldOverlay
        kicker="Évolution des déchets"
        openLabel="Ouvrir Évolution des déchets"
        overlayTitle="Évolution des déchets"
        subtitle="Suivez les pesées dans le temps, comparez maternelle et primaire, puis lisez la conclusion."
        hint="Courbe pleine = poids des déchets (g) · pointillés = g pour 100 assiettes. Filtrez, lisez, téléchargez."
        icon={Trash2}
        iconTileClassName="bg-[#f6c9d6] text-[#7a2d45]"
        labelledBy="waste-evolution-overlay-title"
        closeButtonClassName="bg-[#37784a] hover:bg-[#2f6840]"
        headerAction={
          <OverlayTableToolbar
            days={days}
            levelFilter={levelFilter}
            daysHref={daysHref}
            levelHref={levelHref}
            downloadDisabled={chartLevels.every(
              (level) =>
                !(wasteByLevel[level] ?? []).some((row) => row.wasteWeightG > 0),
            )}
            onDownload={() =>
              downloadWasteEvolutionPdf(wasteByLevel, chartLevels, {
                days,
                levelFilter,
              })
            }
          />
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {chartLevels.map((level) => (
              <DashboardInsightCard
                key={`waste-${level}`}
                icon={Trash2}
                title="Évolution des déchets"
                level={schoolLevelLabelFr(level)}
                headerClassName={
                  level === "MATERNELLE" ? "bg-sky-200" : "bg-emerald-200"
                }
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
          <div
            className={cn(
              "grid grid-cols-1 gap-3",
              chartLevels.length === 2 && "lg:grid-cols-2",
            )}
          >
            {chartLevels.map((level) => (
              <div
                key={`waste-conclusion-${level}`}
                className={cn(
                  "rounded-2xl px-4 py-3.5 ring-1",
                  level === "MATERNELLE"
                    ? "bg-sky-50 ring-sky-200"
                    : "bg-emerald-50 ring-emerald-200",
                )}
              >
                <p
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white",
                    level === "MATERNELLE" ? "bg-sky-600" : "bg-emerald-600",
                  )}
                >
                  Conclusion {schoolLevelLabelFr(level)}
                </p>
                <p className="mt-2 text-base font-semibold leading-relaxed text-zinc-950 sm:text-lg">
                  {buildWasteEvolutionConclusion(
                    buildWasteEvolutionSeries(wasteByLevel[level] ?? []),
                    { days, level },
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      </DashboardFoldOverlay>
      ) : null}

      {!isKitchen ? (
      <>
      <DashboardFoldOverlay
        kicker="Contexte du service"
        openLabel="Ouvrir Contexte du service"
        overlayTitle="Contexte du service"
        subtitle="Comprenez un jour de service : menu, écoles, pesée et écarts par rapport à la veille."
        hint={
          levelFilter !== "all"
            ? `g / 100, pesée, menu et Δ — ${schoolLevelLabelFr(levelFilter)}. Filtrez, lisez, téléchargez.`
            : "g / 100, pesée, menu et Δ, une ligne par jour. Filtrez, lisez, téléchargez."
        }
        titleClassName="text-[#c2185b]"
        icon={Layers}
        iconTileClassName="bg-[#ddc8f8] text-[#5b21b6]"
        labelledBy="service-context-overlay-title"
        dialogClassName="w-[calc(100vw-2rem)] max-w-[88rem] sm:w-[calc(100vw-2.75rem)]"
        panelClassName="gap-1.5 rounded-[20px] p-1 sm:p-1"
        closeButtonClassName="bg-[#37784a] hover:bg-[#2f6840]"
        headerAction={
          <OverlayTableToolbar
            days={days}
            levelFilter={levelFilter}
            daysHref={daysHref}
            levelHref={levelHref}
            downloadDisabled={perDayRows.length === 0}
            onDownload={() =>
              downloadSuiviJourPdf(perDayRows, {
                days,
                levelFilter,
                isKitchen,
                section: "contexte",
              })
            }
          />
        }
      >
        <div className="overflow-hidden rounded-2xl border-[3px] border-[#c2185b] bg-card">
          {perDayRows.length === 0 ? (
            <p className="p-4 text-base font-medium text-black">Pas de données.</p>
          ) : (
            <div className="max-h-[28rem] overflow-auto rounded-xl [scrollbar-gutter:stable] sm:max-h-[32rem]">
              <table className="min-w-full text-base">
                <thead className="sticky top-0 z-10 border-b-[3px] border-[#c2185b] bg-card text-left text-sm font-bold text-black">
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
                      <td className="max-w-[10rem] px-3 py-2.5 text-sm leading-snug">
                        {row.schools}
                      </td>
                      <td className="px-3 py-2.5">{row.classCount}</td>
                      <td
                        className="max-w-[14rem] px-3 py-2.5 text-sm leading-snug"
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
      </DashboardFoldOverlay>

      <DashboardFoldOverlay
        kicker="Suivi jour par jour"
        openLabel="Ouvrir Suivi jour par jour"
        overlayTitle="Suivi jour par jour"
        subtitle="Relisez les compteurs de chaque service, comparez les jours, puis téléchargez le tableau."
        hint="Présents, servis, RAB, refus et déchets — une ligne par jour. Filtrez, lisez, téléchargez."
        titleClassName="text-[#38bdf8]"
        icon={TableIcon}
        iconTileClassName="bg-[#d8f48a] text-[#0d3b2e]"
        labelledBy="day-tracking-overlay-title"
        dialogClassName="w-[calc(100vw-2rem)] max-w-[88rem] sm:w-[calc(100vw-2.75rem)]"
        panelClassName="gap-1.5 rounded-[20px] p-1 sm:p-1"
        closeButtonClassName="bg-[#37784a] hover:bg-[#2f6840]"
        headerAction={
          <OverlayTableToolbar
            days={days}
            levelFilter={levelFilter}
            daysHref={daysHref}
            levelHref={levelHref}
            downloadDisabled={perDayRows.length === 0}
            onDownload={() =>
              downloadSuiviJourPdf(perDayRows, {
                days,
                levelFilter,
                isKitchen,
                section: "suivi",
              })
            }
          />
        }
      >
        <div className="overflow-hidden rounded-2xl border-[3px] border-[#0ea5e9] bg-card">
          {perDayRows.length === 0 ? (
            <p className="p-4 text-base font-medium text-black">Pas de données.</p>
          ) : (
            <div className="max-h-[28rem] overflow-auto rounded-xl [scrollbar-gutter:stable] sm:max-h-[32rem]">
              <table className="min-w-full text-base">
                <thead className="sticky top-0 z-10 border-b-[3px] border-[#0ea5e9] bg-card text-left text-sm font-bold text-black">
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
      </DashboardFoldOverlay>
      </>
      ) : null}

      {!isKitchen ? (
        <footer className="flex items-center justify-center gap-2 pt-2 text-xs font-medium text-black/80">
          <ClipboardList className="size-3.5" />
          Fonctions Cantine+ · inclus dans Cantine360
        </footer>
      ) : null}
      </div>
    </div>
  );
}
