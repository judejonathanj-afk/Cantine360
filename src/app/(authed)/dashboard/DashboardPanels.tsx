"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
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
import { MenusCantineColorTitle } from "@/components/MenusCantineColorTitle";
import { CantinePlusFold } from "@/components/dashboard/CantinePlusSection";
import { FloatingCloseButton } from "@/components/dashboard/FloatingCloseButton";
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
import { schoolLevelLabelFr, type SchoolLevel } from "@/lib/schoolLevel";
import type { DashboardDayDetailRow } from "@/lib/buildDashboardDayDetailRows";
import { downloadSuiviJourPdf } from "@/lib/downloadSuiviJourPdf";
import { downloadWasteEvolutionPdf } from "@/lib/downloadWasteEvolutionPdf";
import { downloadCycleRatesPdf } from "@/lib/downloadCycleRatesPdf";
import { downloadMealFlowPdf } from "@/lib/downloadMealFlowPdf";
import { downloadCantinePlusPdf } from "@/lib/downloadCantinePlusPdf";
import { cn } from "@/lib/utils";
import {
  levelsForFilter,
  useScopedLevelFilter,
  type LevelFilterValue,
} from "@/lib/scopedLevelFilter";
import type { ReactNode } from "react";

type Totals = {
  present: number;
  served: number;
  rab: number;
  refused: number;
};

type DashboardDayRow = DashboardDayDetailRow;

function overlayChipClass(active: boolean) {
  return cn(
    "rounded-full px-3 py-1.5 text-xs font-bold transition-colors sm:px-3.5 sm:text-sm",
    active ? "bg-[#0d7a45] text-white shadow-sm" : "text-zinc-800 hover:text-zinc-950",
  );
}

function OverlayTableToolbar({
  days,
  levelFilter,
  daysHref,
  onLevelChange,
  downloadDisabled,
  onDownload,
}: {
  days: 7 | 30;
  levelFilter: LevelFilterValue;
  daysHref: (nextDays: 7 | 30) => string;
  onLevelChange: (level: LevelFilterValue) => void;
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
        <Link href={daysHref(7)} aria-current={days === 7 ? "page" : undefined} className={overlayChipClass(days === 7)}>
          7 jours
        </Link>
        <Link href={daysHref(30)} aria-current={days === 30 ? "page" : undefined} className={overlayChipClass(days === 30)}>
          30 jours
        </Link>
      </div>
      <div
        role="group"
        aria-label="Niveau"
        className="inline-flex items-center rounded-full bg-white p-1 shadow-sm"
      >
        <button type="button" aria-pressed={levelFilter === "all"} onClick={() => onLevelChange("all")} className={overlayChipClass(levelFilter === "all")}>
          Tous niveaux
        </button>
        <button type="button" aria-pressed={levelFilter === "MATERNELLE"} onClick={() => onLevelChange("MATERNELLE")} className={overlayChipClass(levelFilter === "MATERNELLE")}>
          Maternelle
        </button>
        <button type="button" aria-pressed={levelFilter === "PRIMAIRE"} onClick={() => onLevelChange("PRIMAIRE")} className={overlayChipClass(levelFilter === "PRIMAIRE")}>
          Primaire
        </button>
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
        "rounded-full px-3.5 py-1.5 text-sm font-bold transition-all",
        active
          ? "bg-[#0d7a45] text-white shadow-sm"
          : "text-zinc-900 hover:bg-zinc-100",
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

const CANTINE_PLUS_OPEN_KEY = "cantine360-cantine-plus-open";

export default function DashboardPanels({
  days,
  schoolNames,
  role,
  establishmentId,
  establishmentLabel = "",
  exportYear,
  levelFilter,
  cantinePlusRequested = false,
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
  perDayRowsByLevel,
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
  /** Ouverture Cantine+ via l’URL, jamais au simple login. */
  cantinePlusRequested?: boolean;
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
  perDayRowsByLevel: Record<LevelFilterValue, DashboardDayRow[]>;
  mealFlowByLevel: Record<SchoolLevel, MealFlowDayInput[]>;
  wasteByLevel: Record<SchoolLevel, WastePerDayRowInput[]>;
  levelComparisonTotals: Record<SchoolLevel, LevelMealTotals>;
  antiWasteModeEnabled?: boolean;
  antiWasteTargetGPer100?: number | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isKitchen = role === "KITCHEN";
  /** Lecture globale / Cantine+ : admin seulement, jamais l’URL cuisine `/dashboard`. */
  const hideCantinePlus =
    isKitchen || pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const cantinePlusOpen = !hideCantinePlus && cantinePlusRequested;

  useEffect(() => {
    try {
      sessionStorage.removeItem(CANTINE_PLUS_OPEN_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const [cantinePlusLevel, setCantinePlusLevel] = useScopedLevelFilter(
    "dashboard-cantine-plus",
  );
  const [mealFlowLevel, setMealFlowLevel] = useScopedLevelFilter(
    "dashboard-meal-flow",
  );
  const [cycleLevel, setCycleLevel] = useScopedLevelFilter("dashboard-cycle");
  const [wasteLevel, setWasteLevel] = useScopedLevelFilter("dashboard-waste");
  const [contextLevel, setContextLevel] = useScopedLevelFilter(
    "dashboard-context",
  );
  const [suiviLevel, setSuiviLevel] = useScopedLevelFilter("dashboard-suivi");

  const dashboardBase =
    role === "ADMIN" ? "/admin/dashboard" : "/dashboard";

  function dashboardHref(opts?: {
    days?: 7 | 30;
    level?: "all" | SchoolLevel;
    cantinePlus?: boolean;
  }) {
    const params = new URLSearchParams();
    const nextDays = opts?.days ?? days;
    const nextLevel = opts?.level ?? levelFilter;
    const nextOpen = opts?.cantinePlus ?? cantinePlusOpen;
    params.set("days", String(nextDays));
    if (nextLevel !== "all") params.set("level", nextLevel);
    if (nextOpen) params.set("view", "cantine-plus");
    return `${dashboardBase}?${params.toString()}`;
  }

  function setCantinePlusFold(next: boolean) {
    router.replace(dashboardHref({ cantinePlus: next }), { scroll: false });
  }
  function formatDelta(value: number | null) {
    if (value == null) return "—";
    if (value === 0) return "0";
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toLocaleString("fr-FR")}`;
  }

  function daysHref(nextDays: 7 | 30) {
    return dashboardHref({ days: nextDays });
  }

  function levelHref(level: "all" | SchoolLevel) {
    return dashboardHref({ level });
  }

  const lectureFilters = (
    <OverlayTableToolbar
      days={days}
      levelFilter={cantinePlusLevel}
      daysHref={daysHref}
      onLevelChange={setCantinePlusLevel}
      downloadDisabled={pulseRows.length === 0 && pulseWasteRows.length === 0}
      onDownload={() =>
        downloadCantinePlusPdf(pulseRows, pulseWasteRows, {
          days,
          levelFilter: cantinePlusLevel,
        })
      }
    />
  );

  const lecturePulse = (
    <CantinePulseCard
      rows={pulseRows}
      wasteRows={pulseWasteRows}
      mealType="LUNCH"
      days={days}
      showBrandTitle
      levelFilter={cantinePlusLevel}
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
      wasteByLevel={wasteByLevel}
      antiWasteModeEnabled={antiWasteModeEnabled}
      antiWasteTargetGPer100={antiWasteTargetGPer100}
      headerAction={lectureFilters}
    />
  );

  if (!hideCantinePlus && cantinePlusOpen) {
    return (
      <div className="space-y-6 pb-24 sm:pb-28">
        <div className="min-w-0 space-y-3">
          <div className="flex justify-center sm:justify-start">
            <div className="inline-flex rounded-xl bg-zinc-900 px-5 py-2.5 shadow-lg md:rounded-2xl md:px-7 md:py-3">
              <MenusCantineColorTitle
                text="CANTINE +"
                className="text-xl md:text-2xl lg:text-3xl"
              />
            </div>
          </div>
          <h2
            id="cantine-plus-inline-title"
            className="font-display text-3xl font-bold leading-tight tracking-tight text-zinc-950 sm:text-4xl"
          >
            Lecture globale graphique / chiffres
          </h2>
          <p className="max-w-3xl text-sm font-medium leading-snug text-zinc-600 sm:text-base">
            Cantine+ suit le repas du quotidien : elle calcule une note sur 100,
            met en avant le RAB et le poids des déchets, et affiche les tendances
            pour aider cuisine et direction à réduire le gaspillage.
          </p>
          <p className="mt-3 whitespace-nowrap text-base text-zinc-600 sm:text-lg">
            RAB{" "}
            <span className="text-zinc-800">(assiettes adaptées ou resservies)</span>
            {" "}et déchets (poids) — {days === 30 ? "30 jours" : "7 jours"}
            {cantinePlusLevel !== "all" ? ` — ${schoolLevelLabelFr(cantinePlusLevel)}` : ""}
          </p>
        </div>
        {lecturePulse}
        <FloatingCloseButton onClick={() => setCantinePlusFold(false)} />
      </div>
    );
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
          className="inline-flex items-center rounded-full bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
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
          className="inline-flex items-center rounded-full bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
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
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-zinc-900 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-colors hover:bg-zinc-50"
            >
              <FileSpreadsheet className="size-4 text-[#0d7a45]" />
              Bilan commission
              <span className="font-semibold text-zinc-600">(CSV)</span>
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
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-zinc-900 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="size-4" />
            PDF
          </button>
        </div>
      </div>

      <div className="dashboard-v2-fade space-y-8">
      <div
        className={cn(
          !isKitchen &&
            "lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:items-start lg:gap-5",
        )}
      >
      <div className="min-w-0">
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
      </div>

      {!isKitchen ? (
      <aside className="mt-8 flex min-w-0 flex-col gap-3 overflow-visible lg:mt-0">
      {!hideCantinePlus ? (
        <CantinePlusFold compact onOpen={() => setCantinePlusFold(true)} />
      ) : null}

      <DashboardFoldOverlay
        compact
        kicker="Flux du repas"
        openLabel="Ouvrir Flux du repas"
        overlayTitle="Flux du repas"
        subtitle="Suivez présents, servis, RAB et refus jour par jour, comparez les cycles, puis lisez la conclusion."
        hint="Présents → servis → RAB / refus, jour par jour. Filtrez, lisez, téléchargez."
        icon={Utensils}
        iconTileClassName="bg-[#f3d7a0] text-[#6b4a12]"
        labelledBy="meal-flow-overlay-title"
        tight
        closeButtonClassName="bg-[#37784a] hover:bg-[#2f6840]"
        headerAction={
          <OverlayTableToolbar
            days={days}
            levelFilter={mealFlowLevel}
            daysHref={daysHref}
            onLevelChange={setMealFlowLevel}
            downloadDisabled={levelsForFilter(mealFlowLevel).every(
              (level) => !mealFlowHasData(mealFlowByLevel[level] ?? []),
            )}
            onDownload={() =>
              downloadMealFlowPdf(mealFlowByLevel, levelsForFilter(mealFlowLevel), {
                days,
                levelFilter: mealFlowLevel,
              })
            }
          />
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-5">
            {levelsForFilter(mealFlowLevel).map((level) => (
              <DashboardInsightCard
                key={`meal-flow-${level}`}
                icon={Utensils}
                title="Flux du repas"
                compact
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
            className=            {cn(
              "grid grid-cols-1 gap-3",
              levelsForFilter(mealFlowLevel).length === 2 && "lg:grid-cols-2",
            )}
          >
            {levelsForFilter(mealFlowLevel).map((level) => (
              <div
                key={`meal-flow-conclusion-${level}`}
                className={cn(
                  "rounded-xl px-3 py-2.5",
                  level === "MATERNELLE"
                    ? "bg-sky-50"
                    : "bg-emerald-50",
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

        <DashboardFoldOverlay
          compact
          kicker="Taux du cycle"
          openLabel="Ouvrir Taux du cycle"
          overlayTitle="Taux du cycle"
          subtitle="Comparez le service, le RAB et les refus par cycle, pour ajuster portions et menu."
          hint={`Taux de service = servis / présents · RAB et refus = vs assiettes servies · ${days} jours. Filtrez, lisez, téléchargez.`}
          icon={GitCompareArrows}
          iconTileClassName="bg-[#bfe4f5] text-[#0b4a66]"
          labelledBy="cycle-rates-overlay-title"
          tight
          closeButtonClassName="bg-[#37784a] hover:bg-[#2f6840]"
          headerAction={
            <OverlayTableToolbar
              days={days}
              levelFilter={cycleLevel}
              daysHref={daysHref}
              onLevelChange={setCycleLevel}
              downloadDisabled={levelsForFilter(cycleLevel).every(
                (level) => !levelTotalsHasData(levelComparisonTotals[level]),
              )}
              onDownload={() =>
                downloadCycleRatesPdf(
                  levelComparisonTotals,
                  levelsForFilter(cycleLevel),
                  {
                    days,
                    levelFilter: cycleLevel,
                  },
                )
              }
            />
          }
        >
          <div className="space-y-3">
            <div
              className={cn(
                "grid grid-cols-1 gap-5",
                levelsForFilter(cycleLevel).length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-1",
              )}
            >
              {levelsForFilter(cycleLevel).map((level) => (
                <DashboardInsightCard
                  key={`level-rates-${level}`}
                  icon={GitCompareArrows}
                  title="Taux du cycle"
                  compact
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
                levelsForFilter(cycleLevel).length === 2 && "lg:grid-cols-2",
              )}
            >
              {levelsForFilter(cycleLevel).map((level) => (
                <div
                  key={`cycle-conclusion-${level}`}
                  className={cn(
                  "rounded-xl px-3 py-2.5",
                  level === "MATERNELLE"
                    ? "bg-sky-50"
                    : "bg-emerald-50",
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

      <DashboardFoldOverlay
        compact
        kicker="Évolution des déchets"
        openLabel="Ouvrir Évolution des déchets"
        overlayTitle="Évolution des déchets"
        subtitle="Suivez les pesées dans le temps, comparez maternelle et primaire, puis lisez la conclusion."
        hint="Courbe pleine = poids des déchets (g) · pointillés = g pour 100 assiettes. Filtrez, lisez, téléchargez."
        icon={Trash2}
        iconTileClassName="bg-[#f6c9d6] text-[#7a2d45]"
        labelledBy="waste-evolution-overlay-title"
        tight
        closeButtonClassName="bg-[#37784a] hover:bg-[#2f6840]"
        headerAction={
          <OverlayTableToolbar
            days={days}
            levelFilter={wasteLevel}
            daysHref={daysHref}
            onLevelChange={setWasteLevel}
            downloadDisabled={levelsForFilter(wasteLevel).every(
              (level) =>
                !(wasteByLevel[level] ?? []).some((row) => row.wasteWeightG > 0),
            )}
            onDownload={() =>
              downloadWasteEvolutionPdf(
                wasteByLevel,
                levelsForFilter(wasteLevel),
                {
                  days,
                  levelFilter: wasteLevel,
                },
              )
            }
          />
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {levelsForFilter(wasteLevel).map((level) => (
              <DashboardInsightCard
                key={`waste-${level}`}
                icon={Trash2}
                title="Évolution des déchets"
                compact
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
              levelsForFilter(wasteLevel).length === 2 && "lg:grid-cols-2",
            )}
          >
            {levelsForFilter(wasteLevel).map((level) => (
              <div
                key={`waste-conclusion-${level}`}
                className={cn(
                  "rounded-xl px-3 py-2.5",
                  level === "MATERNELLE"
                    ? "bg-sky-50"
                    : "bg-emerald-50",
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

      <DashboardFoldOverlay
        compact
        kicker="Contexte du service"
        openLabel="Ouvrir Contexte du service"
        overlayTitle="Contexte du service"
        subtitle="Comprenez un jour de service : menu, écoles, pesée et écarts par rapport à la veille."
        hint={
          contextLevel !== "all"
            ? `g / 100, pesée, menu et Δ — ${schoolLevelLabelFr(contextLevel)}. Filtrez, lisez, téléchargez.`
            : "g / 100, pesée, menu et Δ, une ligne par jour. Filtrez, lisez, téléchargez."
        }
        titleClassName="text-[#c2185b]"
        icon={Layers}
        iconTileClassName="bg-[#ddc8f8] text-[#5b21b6]"
        labelledBy="service-context-overlay-title"
        panelClassName="gap-1.5 rounded-[20px] p-1 sm:p-1"
        closeButtonClassName="bg-[#37784a] hover:bg-[#2f6840]"
        headerAction={
          <OverlayTableToolbar
            days={days}
            levelFilter={contextLevel}
            daysHref={daysHref}
            onLevelChange={setContextLevel}
            downloadDisabled={perDayRowsByLevel[contextLevel].length === 0}
            onDownload={() =>
              downloadSuiviJourPdf(perDayRowsByLevel[contextLevel], {
                days,
                levelFilter: contextLevel,
                isKitchen,
                section: "contexte",
              })
            }
          />
        }
      >
        <div className="overflow-hidden rounded-2xl border-[3px] border-[#c2185b] bg-card">
          {perDayRowsByLevel[contextLevel].length === 0 ? (
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
                  {perDayRowsByLevel[contextLevel].map((row) => (
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
      </aside>
      ) : null}
      </div>

      {!isKitchen ? (
      <DashboardFoldOverlay
        kicker="Suivi jour par jour"
        openLabel="Ouvrir Suivi jour par jour"
        overlayTitle="Suivi jour par jour"
        subtitle="Relisez les compteurs de chaque service, comparez les jours, puis téléchargez le tableau."
        hint="Présents, servis, RAB, refus et déchets — une ligne par jour. Filtrez, lisez, téléchargez."
        titleClassName="text-sky-200"
        icon={TableIcon}
        iconTileClassName="bg-[#d8f48a] text-[#0d3b2e]"
        labelledBy="day-tracking-overlay-title"
        panelClassName="gap-1.5 rounded-[20px] p-1 sm:p-1"
        closeButtonClassName="bg-[#37784a] hover:bg-[#2f6840]"
        headerAction={
          <OverlayTableToolbar
            days={days}
            levelFilter={suiviLevel}
            daysHref={daysHref}
            onLevelChange={setSuiviLevel}
            downloadDisabled={perDayRowsByLevel[suiviLevel].length === 0}
            onDownload={() =>
              downloadSuiviJourPdf(perDayRowsByLevel[suiviLevel], {
                days,
                levelFilter: suiviLevel,
                isKitchen,
                section: "suivi",
              })
            }
          />
        }
      >
        <div className="overflow-hidden rounded-2xl border-[3px] border-[#0ea5e9] bg-card">
          {perDayRowsByLevel[suiviLevel].length === 0 ? (
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
                    {suiviLevel === "all" ? (
                      <>
                        <th className="px-3 py-2.5">Déchets mat. (g)</th>
                        <th className="px-3 py-2.5">Déchets prim. (g)</th>
                      </>
                    ) : null}
                    <th className="px-3 py-2.5">
                      Déchets{suiviLevel === "all" ? " total" : ""} (g)
                    </th>
                  </tr>
                </thead>
                <tbody className="font-medium text-black">
                  {perDayRowsByLevel[suiviLevel].map((row) => (
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
                      {suiviLevel === "all" ? (
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
