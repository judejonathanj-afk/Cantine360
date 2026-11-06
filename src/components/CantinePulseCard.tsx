"use client";

import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart3,
  CalendarDays,
  Check,
  ChefHat,
  ChevronDown,
  Leaf,
  Lightbulb,
  Minus,
  Target,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import {
  buildCantinePulseDailySeries,
  buildCantinePulseSituationConclusion,
  computeCantinePulse,
  type CantinePulseWindowDays,
  type CantineServiceRow,
  type CantineWasteDayRow,
} from "@/lib/cantinePulse";
import { mealTypeLabelFr } from "@/lib/mealType";
import {
  leftoversReductionVsPriorPct,
  ratioRestesServisPct,
} from "@/lib/commissionBilan";
import { cn } from "@/lib/utils";
import { SCHOOL_LEVELS, schoolLevelLabelFr, type SchoolLevel } from "@/lib/schoolLevel";
import type { WastePerDayRowInput } from "@/lib/buildWasteEvolutionSeries";
import { ChildDrawnSun } from "@/components/service/ChildDrawnSun";
import type { CantineMood } from "@/lib/cantinePulse";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

const MOOD_STYLES = {
  great: {
    topBar: "bg-emerald-500",
    accent: "text-emerald-600",
    scoreBg: "bg-emerald-100 text-emerald-800",
    badge: "border-emerald-300 bg-emerald-50 text-emerald-800",
    label: "Ça va bien",
    barClass: "bg-emerald-500",
    track: "bg-zinc-200",
  },
  ok: {
    topBar: "bg-amber-500",
    accent: "text-amber-600",
    scoreBg: "bg-amber-100 text-amber-900",
    badge: "border-amber-300 bg-amber-50 text-amber-900",
    label: "À suivre",
    barClass: "bg-amber-500",
    track: "bg-zinc-200",
  },
  attention: {
    topBar: "bg-rose-500",
    accent: "text-rose-600",
    scoreBg: "bg-rose-100 text-rose-800",
    badge: "border-rose-300 bg-rose-50 text-rose-800",
    label: "À améliorer",
    barClass: "bg-rose-500",
    track: "bg-zinc-200",
  },
  pending: {
    topBar: "bg-zinc-400",
    accent: "text-zinc-700",
    scoreBg: "bg-zinc-100 text-zinc-700",
    badge: "border-zinc-300 bg-zinc-100 text-zinc-700",
    label: "En attente de données",
    barClass: "bg-zinc-400",
    track: "bg-zinc-200",
  },
} as const;

const MOOD_CHART_COLOR: Record<keyof typeof MOOD_STYLES, string> = {
  great: "#10b981",
  ok: "#f59e0b",
  attention: "#f43f5e",
  pending: "#71717a",
};

const globalChartConfig = {
  served: { label: "Servis", color: "#2dd4bf" },
  wasteWeightG: { label: "Déchets (g)", color: "#eab308" },
  gramsPer100Waste: { label: "g déchets / 100 assiettes", color: "#a3e635" },
} satisfies ChartConfig;

function ChartLegendItem({
  color,
  label,
  value,
  onDark = false,
}: {
  color: string;
  label: string;
  value: string;
  onDark?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <span
        className="mt-0.5 w-1 shrink-0 self-stretch rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <div>
        <p className={cn("text-sm", onDark ? "text-zinc-400" : "text-zinc-500")}>{label}</p>
        <p
          className={cn(
            "text-xl font-bold tabular-nums tracking-tight",
            onDark ? "text-white" : "text-zinc-900",
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function NoteCantineCounter({
  score,
  mood,
}: {
  score: number;
  mood: keyof typeof MOOD_STYLES;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, [score]);

  const color = MOOD_CHART_COLOR[mood];
  const uid = useId().replace(/:/g, "");
  const gradId = `note-cantine-grad-${uid}`;
  const glowId = `note-cantine-glow-${uid}`;
  const cx = 120;
  const cy = 118;
  const r = 88;
  const stroke = 22;
  const len = Math.PI * r;
  const frac = Math.min(Math.max(score / 100, 0), 1);
  const shownFrac = mounted ? frac : 0;
  const arcPath = `M ${cx - r},${cy} A ${r},${r} 0 0 1 ${cx + r},${cy}`;
  const bowlPath = `${arcPath} L ${cx + r - stroke},${cy} A ${r - stroke},${r - stroke} 0 0 0 ${cx - r + stroke},${cy} Z`;
  const angle = Math.PI * shownFrac;
  const end = {
    x: cx - r * Math.cos(angle),
    y: cy - r * Math.sin(angle),
  };
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const t = i / 10;
    const inner = r - stroke / 2 - 10;
    const outer = inner - (i % 5 === 0 ? 8 : 4);
    return {
      key: i,
      major: i % 5 === 0,
      x1: cx - inner * Math.cos(Math.PI * t),
      y1: cy - inner * Math.sin(Math.PI * t),
      x2: cx - outer * Math.cos(Math.PI * t),
      y2: cy - outer * Math.sin(Math.PI * t),
    };
  });

  return (
    <div className="flex w-[11.75rem] shrink-0 flex-col items-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
        Note Cantine +
      </p>
      <div className="relative mt-0.5 w-full">
        <svg
          viewBox="0 0 240 148"
          className="w-full"
          role="img"
          aria-label={`Note Cantine + ${score} sur 100`}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity="0.45" />
              <stop offset="55%" stopColor={color} />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path d={bowlPath} fill="#141414" />
          <path
            d={arcPath}
            fill="none"
            stroke="#52525b"
            strokeWidth={stroke + 6}
            strokeLinecap="round"
          />
          <path
            d={arcPath}
            fill="none"
            stroke="#27272a"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <path
            d={arcPath}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={len}
            strokeDashoffset={len * (1 - shownFrac)}
            filter={`url(#${glowId})`}
            style={{
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)",
            }}
          />
          {ticks.map((tick) => (
            <line
              key={tick.key}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke={tick.major ? "#a1a1aa" : "#52525b"}
              strokeWidth={tick.major ? 2 : 1.25}
              strokeLinecap="round"
            />
          ))}
          {shownFrac > 0.02 ? (
            <circle
              cx={end.x}
              cy={end.y}
              r="7.5"
              fill={color}
              stroke="#000000"
              strokeWidth="3"
              style={{
                transition: "cx 1.2s cubic-bezier(0.22,1,0.36,1), cy 1.2s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          ) : null}
          <text
            x={cx - r}
            y={cy + 18}
            textAnchor="middle"
            fill="#a1a1aa"
            fontSize="11"
            fontWeight="700"
          >
            0
          </text>
          <text
            x={cx + r}
            y={cy + 18}
            textAnchor="middle"
            fill="#a1a1aa"
            fontSize="11"
            fontWeight="700"
          >
            100
          </text>
        </svg>
        <div className="pointer-events-none absolute inset-x-0 top-[46%] flex flex-col items-center">
          <span
            className="text-[2.65rem] font-extrabold leading-none tracking-tight tabular-nums"
            style={{ color }}
          >
            {score}
          </span>
          <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
            / 100
          </span>
        </div>
      </div>
      <span className="mt-1 inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-900">
        {MOOD_STYLES[mood].label}
      </span>
    </div>
  );
}

function CantineChartLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-3 text-sm font-semibold text-black">
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-[2px] bg-[#2dd4bf]" aria-hidden />
        Servis
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-0.5 w-4 border-t-[3px] border-[#eab308]" aria-hidden />
        Déchets (g)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-0.5 w-4 border-t-2 border-dashed border-[#a3e635]" aria-hidden />
        g déchets / 100 assiettes
      </span>
    </div>
  );
}

function CantinePlusGlobalChart({
  rows,
  wasteRows,
  mealType,
  score,
  mood,
  days,
}: {
  rows: CantineServiceRow[];
  wasteRows: CantineWasteDayRow[];
  mealType: string;
  score: number;
  mood: keyof typeof MOOD_STYLES;
  days: CantinePulseWindowDays;
}) {
  const periodLabel = days === 30 ? "30 jours" : "7 jours";
  const priorLabel = days === 30 ? "les 30 jours d’avant" : "la semaine d’avant";
  const series = useMemo(
    () =>
      buildCantinePulseDailySeries(rows, mealType, {
        windowDays: days,
        wasteRows,
      }),
    [rows, wasteRows, mealType, days],
  );
  const hasActivity = series.some(
    (p) => p.served > 0 || p.wasteWeightG > 0,
  );
  const totalWasteG = series.reduce((sum, p) => sum + p.wasteWeightG, 0);
  const rest = Math.max(0, 100 - score);
  const moodColor = MOOD_CHART_COLOR[mood];
  const wasteLabel =
    totalWasteG > 0
      ? `${Math.round(totalWasteG).toLocaleString("fr-FR")} g`
      : "—";
  const pieConfig = {
    niveau: { label: "Niveau actuel", color: moodColor },
    marge: { label: "Marge de progrès", color: "#d4d4d8" },
    dechets: { label: "Déchets cumulés", color: "#eab308" },
  } satisfies ChartConfig;
  const pieData = [
    { key: "niveau", name: "Niveau actuel", value: Math.max(score, 0.01) },
    { key: "marge", name: "Marge de progrès", value: Math.max(rest, 0.01) },
  ];

  return (
    <div className="px-1 py-2 sm:px-2">
      <div
        className="rounded-3xl px-4 py-4 sm:px-5 sm:py-5"
        style={{ backgroundColor: "#000000" }}
      >
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-white">
          Lecture globale
        </p>
        <div className="mt-4 min-w-0">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex min-w-0 flex-col items-center gap-4 sm:flex-row sm:items-end sm:justify-start sm:gap-6">
              <NoteCantineCounter score={score} mood={mood} />
            <div className="flex min-w-0 flex-col items-center gap-3 sm:flex-row">
              <div className="relative size-[168px] shrink-0">
                <ChartContainer
                  config={pieConfig}
                  className="aspect-square h-[168px] w-[168px]"
                >
                  <PieChart>
                    <ChartTooltip
                      content={(tooltipProps) => (
                        <ChartTooltipContent
                          active={tooltipProps.active}
                          payload={tooltipProps.payload}
                          label={tooltipProps.label}
                          coordinate={tooltipProps.coordinate}
                          accessibilityLayer={tooltipProps.accessibilityLayer}
                          activeIndex={tooltipProps.activeIndex}
                          formatter={(value, name) =>
                            typeof value === "number" ? (
                              <div className="flex min-w-[8rem] flex-1 items-baseline justify-between gap-3">
                                <span className="font-medium text-zinc-800">
                                  {String(name)}
                                </span>
                                <span className="font-mono font-medium tabular-nums text-zinc-700">
                                  {name === "Déchets cumulés"
                                    ? wasteLabel
                                    : `${Math.round(value)} %`}
                                </span>
                              </div>
                            ) : (
                              value
                            )
                          }
                        />
                      )}
                    />
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={78}
                      stroke="#ffffff"
                      strokeWidth={3}
                    >
                      {pieData.map((slice) => (
                        <Cell
                          key={slice.key}
                          fill={`var(--color-${slice.key})`}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="pointer-events-none absolute inset-[22%] flex flex-col items-center justify-center text-center">
                  <p className="text-[9px] font-bold uppercase leading-[1.1] tracking-wide text-zinc-300">
                    Déchets
                    <br />
                    cumulés
                  </p>
                  <p className="mt-0.5 text-sm font-extrabold tabular-nums leading-none tracking-tight text-white">
                    {wasteLabel}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <ChartLegendItem
                  color={moodColor}
                  label="Niveau actuel"
                  value={`${score} %`}
                  onDark
                />
                <ChartLegendItem
                  color="#d4d4d8"
                  label="Marge de progrès"
                  value={`${rest} %`}
                  onDark
                />
                <ChartLegendItem
                  color="#eab308"
                  label="Déchets cumulés"
                  value={wasteLabel}
                  onDark
                />
              </div>
            </div>
            </div>
            <div className="shrink-0 sm:pr-1">
              <CantinePlusMealHeader mealType={mealType} mood={mood} onDark />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-4">
        <div className="rounded-[2rem] bg-[#efeaf8] p-3 sm:p-4">
          <div className="rounded-[1.5rem] bg-white px-5 py-5 sm:px-8 sm:py-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-extrabold tracking-tight text-zinc-950 sm:text-2xl">
                  Évolution des assiettes servies et des déchets
                </h3>
                <p className="mt-1 text-sm font-medium text-zinc-400 sm:text-base">
                  Portions servies, poids des déchets et g / 100 assiettes — {periodLabel}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-[#ece7fa] px-3 py-1 text-xs font-semibold text-[#7c6bb0]">
                Cantine+
              </span>
            </div>
          {!hasActivity ? (
            <p className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-600">
              Pas encore de données sur les {periodLabel} pour tracer le graphique.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
            <ChartContainer
              config={globalChartConfig}
              className="h-[min(22rem,48vw)] w-full min-h-[240px] aspect-auto [&_.recharts-cartesian-axis-tick_text]:!fill-black [&_.recharts-cartesian-axis-tick_text]:font-semibold [&_.y-axis-grams_.recharts-cartesian-axis-tick_text]:!fill-[#eab308]"
            >
              <ComposedChart data={series} margin={{ top: 16, right: 12, left: 4, bottom: 8 }}>
                <CartesianGrid vertical={false} stroke="rgba(24,24,27,0.08)" strokeDasharray="4 4" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={16}
                  tick={{ fill: "#000000", fontSize: 13, fontWeight: 600 }}
                />
                <YAxis
                  yAxisId="count"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={32}
                  tick={{ fill: "#000000", fontSize: 13, fontWeight: 600 }}
                />
                <YAxis
                  yAxisId="pct"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                  width={58}
                  domain={[0, "auto"]}
                  tick={{ fill: "#000000", fontSize: 13, fontWeight: 600 }}
                />
                <YAxis
                  yAxisId="waste"
                  className="y-axis-grams"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${Math.round(v)} g`}
                  width={72}
                  domain={[0, "auto"]}
                  tick={{ fill: "#eab308", fontSize: 13, fontWeight: 600 }}
                />
                <ChartTooltip
                  content={(tooltipProps) => (
                    <ChartTooltipContent
                      active={tooltipProps.active}
                      payload={tooltipProps.payload}
                      label={tooltipProps.label}
                      coordinate={tooltipProps.coordinate}
                      accessibilityLayer={tooltipProps.accessibilityLayer}
                      activeIndex={tooltipProps.activeIndex}
                    />
                  )}
                />
                <Bar
                  yAxisId="count"
                  dataKey="served"
                  fill="var(--color-served)"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={18}
                  legendType="none"
                />
                <Line
                  yAxisId="waste"
                  type="monotone"
                  dataKey="wasteWeightG"
                  name="Déchets (g)"
                  stroke="var(--color-wasteWeightG)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "var(--color-wasteWeightG)" }}
                  activeDot={{ r: 6 }}
                  connectNulls
                  legendType="none"
                />
                <Line
                  yAxisId="pct"
                  type="monotone"
                  dataKey="gramsPer100Waste"
                  name="g déchets / 100 assiettes"
                  stroke="var(--color-gramsPer100Waste)"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={false}
                  connectNulls
                  legendType="none"
                />
              </ComposedChart>
            </ChartContainer>
            <CantineChartLegend />
            </div>
          )}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white px-3 py-3.5">
          <p className="text-base font-semibold leading-snug text-zinc-900">
            Comment lire ce graphique ?
          </p>
          <p className="mt-2.5 w-full text-sm leading-relaxed text-zinc-600">
            <span>
              Les <strong className="text-zinc-900">barres vert d&apos;eau</strong> = portions
              servies sur <strong className="text-zinc-900">{periodLabel}</strong>.
            </span>{" "}
            <span>
              La <strong className="text-yellow-700">courbe jaune</strong> = poids des déchets
              (g, axe de droite). La{" "}
              <strong className="text-lime-700">courbe verte pointillée</strong> = g de déchets
              pour 100 assiettes.
            </span>{" "}
            <span>
              La <strong className="text-zinc-900">note sur 100</strong> ({score}/100) résume la
              période : plus elle est haute, mieux c&apos;est —{" "}
              <strong className="text-zinc-900">100 = objectif idéal</strong>.
            </span>{" "}
            <span>
              Le calcul repose surtout sur les grammes de déchets pour 100 assiettes, avec une
              petite pénalité si le RAB est élevé, et l&apos;évolution vs {priorLabel} dès
              qu&apos;il y a assez d&apos;historique.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const TREND_CHART_CONFIG = {
  primaire: { label: "Déchets primaire", color: "#0f7a4a" },
  maternelle: { label: "Déchets maternelle", color: "#9ed9c0" },
} satisfies ChartConfig;

function weekdayShortFr(isoDate: string) {
  const raw = new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(
    new Date(`${isoDate}T12:00:00`),
  );
  const cleaned = raw.replace(".", "").trim();
  return `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}.`;
}

function gramsPer100(wasteWeightG: number, served: number): number | null {
  if (served <= 0 || wasteWeightG <= 0) return null;
  return Math.round((wasteWeightG / served) * 100);
}

function TendancesAntigaspillageCard({
  wasteByLevel,
  levelFilter,
}: {
  wasteByLevel: Record<SchoolLevel, WastePerDayRowInput[]>;
  levelFilter: "all" | SchoolLevel;
}) {
  const { points, periodG, trend, recap } = useMemo(() => {
    const byLevel: Record<SchoolLevel, Map<string, WastePerDayRowInput>> = {
      MATERNELLE: new Map(),
      PRIMAIRE: new Map(),
    };
    const dates = new Set<string>();
    for (const level of SCHOOL_LEVELS) {
      for (const row of wasteByLevel[level] ?? []) {
        byLevel[level].set(row.date, row);
        if (row.served > 0 || row.wasteWeightG > 0) dates.add(row.date);
      }
    }
    const lastDates = Array.from(dates)
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 7)
      .reverse();

    const showMaternelle = levelFilter !== "PRIMAIRE";
    const showPrimaire = levelFilter !== "MATERNELLE";
    const points = lastDates.map((date) => {
      const mat = byLevel.MATERNELLE.get(date);
      const prim = byLevel.PRIMAIRE.get(date);
      return {
        date,
        label: weekdayShortFr(date),
        maternelle: showMaternelle
          ? gramsPer100(mat?.wasteWeightG ?? 0, mat?.served ?? 0)
          : null,
        primaire: showPrimaire
          ? gramsPer100(prim?.wasteWeightG ?? 0, prim?.served ?? 0)
          : null,
      };
    });

    let waste = 0;
    let served = 0;
    for (const date of lastDates) {
      for (const level of SCHOOL_LEVELS) {
        if (levelFilter !== "all" && level !== levelFilter) continue;
        const row = byLevel[level].get(date);
        if (!row) continue;
        waste += row.wasteWeightG;
        served += row.served;
      }
    }
    const periodG = gramsPer100(waste, served);

    const daily = lastDates
      .map((date) => {
        let w = 0;
        let s = 0;
        for (const level of SCHOOL_LEVELS) {
          if (levelFilter !== "all" && level !== levelFilter) continue;
          const row = byLevel[level].get(date);
          if (!row) continue;
          w += row.wasteWeightG;
          s += row.served;
        }
        return gramsPer100(w, s);
      })
      .filter((v): v is number => v != null);
    let trend: "down" | "up" | "flat" = "flat";
    if (daily.length >= 2) {
      const first = daily[0]!;
      const last = daily[daily.length - 1]!;
      if (last < first - 1) trend = "down";
      else if (last > first + 1) trend = "up";
    }

    const recapParts: string[] = [];
    const n = lastDates.length;
    if (n === 0 || periodG == null) {
      recapParts.push(
        "Pas encore assez de pesées sur les derniers services pour un récapitulatif.",
      );
    } else {
      recapParts.push(
        `Sur ${n} service${n > 1 ? "s" : ""}, ${periodG.toLocaleString("fr-FR")} g de déchets pour 100 assiettes.`,
      );
      if (daily.length < 2) {
        recapParts.push("Une seule pesée : trop tôt pour une tendance.");
      } else if (trend === "down") {
        recapParts.push("La tendance est à la baisse — le gaspillage recule.");
      } else if (trend === "up") {
        recapParts.push(
          "La tendance est à la hausse : surveillez portions et service.",
        );
      } else {
        recapParts.push("La tendance est plutôt stable.");
      }

      const peak = points.reduce<{
        date: string;
        level: string;
        value: number;
      } | null>((best, point) => {
        const candidates = [
          { date: point.date, level: "maternelle", value: point.maternelle },
          { date: point.date, level: "primaire", value: point.primaire },
        ];
        for (const c of candidates) {
          if (c.value == null || c.value <= 0) continue;
          if (!best || c.value > best.value) {
            best = { date: c.date, level: c.level, value: c.value };
          }
        }
        return best;
      }, null);
      if (peak) {
        const weekday = new Intl.DateTimeFormat("fr-FR", {
          weekday: "long",
        }).format(new Date(`${peak.date}T12:00:00`));
        recapParts.push(
          `Le pic est le ${weekday} en ${peak.level} (${peak.value.toLocaleString("fr-FR")} g / 100).`,
        );
      }

      if (showMaternelle && showPrimaire) {
        const avg = (key: "maternelle" | "primaire") => {
          const vals = points
            .map((p) => p[key])
            .filter((v): v is number => v != null && v > 0);
          if (vals.length === 0) return null;
          return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
        };
        const matAvg = avg("maternelle");
        const primAvg = avg("primaire");
        if (matAvg != null && primAvg != null) {
          if (Math.abs(matAvg - primAvg) < 20) {
            recapParts.push(
              "Maternelle et primaire sont proches sur ces services.",
            );
          } else if (matAvg < primAvg) {
            recapParts.push(
              "La maternelle reste plus légère que le primaire.",
            );
          } else {
            recapParts.push(
              "Le primaire reste plus léger que la maternelle.",
            );
          }
        }
      }
    }

    return { points, periodG, trend, recap: recapParts.join(" ") };
  }, [wasteByLevel, levelFilter]);

  const hasBars = points.some(
    (p) => (p.maternelle != null && p.maternelle > 0) || (p.primaire != null && p.primaire > 0),
  );
  const TrendIcon = trend === "down" ? ArrowDown : trend === "up" ? ArrowUp : Minus;
  const periodLabel =
    periodG != null ? periodG.toLocaleString("fr-FR") : "—";

  return (
    <div className="rounded-[2rem] bg-[#efeaf8] p-3 sm:p-4">
      <div className="rounded-[1.5rem] bg-white px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-zinc-950 sm:text-2xl">
              Tendances Antigaspillage
            </h2>
            <p className="mt-1 text-sm font-medium text-zinc-400 sm:text-base">
              Les 7 derniers services · déchets (g / 100 assiettes)
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-[#ece7fa] px-3 py-1 text-xs font-semibold text-[#7c6bb0]">
            Cantine+
          </span>
        </div>

        <div className="mt-5 flex items-center gap-4 rounded-[1.35rem] bg-[#e7f6ee] px-4 py-4 sm:px-5">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
            <Leaf className="h-7 w-7 text-[#1b8a54]" strokeWidth={2.1} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#6b8f7a]">Indicateur de la période</p>
            <p className="mt-0.5 text-3xl font-extrabold tabular-nums tracking-tight text-[#0f7a4a] sm:text-4xl">
              {periodLabel}
              {periodG != null ? (
                <span className="ml-1.5 text-base font-semibold sm:text-lg">
                  g / 100 assiettes
                </span>
              ) : null}
            </p>
            {periodG != null ? (
              <p className="mt-1 text-sm font-semibold leading-snug text-[#3d7a5c]">
                de déchets — moyenne des pesées, ramenée à 100 assiettes servies
              </p>
            ) : (
              <p className="mt-1 text-sm font-medium text-[#6b8f7a]">
                En attente de pesée des déchets
              </p>
            )}
          </div>
          <TrendIcon
            className="h-6 w-6 shrink-0 text-[#0f7a4a]"
            strokeWidth={2.4}
            aria-hidden
          />
        </div>

        <div className="mt-6">
          {!hasBars ? (
            <p className="py-8 text-center text-sm font-medium text-zinc-500">
              Les tendances s’afficheront ici dès les premières pesées.
            </p>
          ) : (
            <ChartContainer
              config={TREND_CHART_CONFIG}
              className="aspect-auto h-[220px] w-full"
            >
              <BarChart
                data={points}
                margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke="#ececec" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tick={{ fill: "#9ca3af", fontSize: 13 }}
                />
                <ChartTooltip
                  content={(tooltipProps) => (
                    <ChartTooltipContent
                      active={tooltipProps.active}
                      payload={tooltipProps.payload}
                      label={tooltipProps.label}
                      coordinate={tooltipProps.coordinate}
                      accessibilityLayer={tooltipProps.accessibilityLayer}
                      activeIndex={tooltipProps.activeIndex}
                      formatter={(value, name) =>
                        typeof value === "number" ? (
                          <div className="flex min-w-[9.5rem] flex-1 items-baseline justify-between gap-3">
                            <span className="font-medium text-zinc-800">
                              Déchets {String(name).toLowerCase()}
                            </span>
                            <span className="font-mono font-medium tabular-nums text-zinc-700">
                              {value.toLocaleString("fr-FR")} g / 100 assiettes
                            </span>
                          </div>
                        ) : (
                          value
                        )
                      }
                    />
                  )}
                />
                {levelFilter !== "PRIMAIRE" ? (
                  <Bar
                    dataKey="maternelle"
                    name="Maternelle"
                    fill="var(--color-maternelle)"
                    radius={[10, 10, 6, 6]}
                    maxBarSize={36}
                  />
                ) : null}
                {levelFilter !== "MATERNELLE" ? (
                  <Bar
                    dataKey="primaire"
                    name="Primaire"
                    fill="var(--color-primaire)"
                    radius={[10, 10, 6, 6]}
                    maxBarSize={36}
                  />
                ) : null}
              </BarChart>
            </ChartContainer>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-zinc-600">
          {levelFilter !== "MATERNELLE" ? (
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-[#0f7a4a]" aria-hidden />
              Primaire
            </span>
          ) : null}
          {levelFilter !== "PRIMAIRE" ? (
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-[#9ed9c0]" aria-hidden />
              Maternelle
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-xs font-medium text-zinc-400">
          g de déchets pour 100 assiettes servies
        </p>
        <div className="mt-4 rounded-[1.15rem] bg-[#e7f6ee] px-4 py-3.5 sm:px-5">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#0f7a4a]">
            Récapitulatif
          </p>
          <p className="mt-1.5 text-sm font-semibold leading-relaxed text-zinc-800 sm:text-[15px]">
            {recap}
          </p>
        </div>
      </div>
    </div>
  );
}

function mealLabel(mealType: string) {
  return mealTypeLabelFr(mealType);
}

function MealIcon() {
  return <ChildDrawnSun className="h-12 w-12 shrink-0 sm:h-14 sm:w-14" />;
}

export function CantinePlusMealHeader({
  mealType,
  mood,
  onDark = false,
}: {
  mealType: string;
  mood: CantineMood;
  onDark?: boolean;
}) {
  const s = MOOD_STYLES[mood];
  return (
    <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-start gap-3">
      <MealIcon />
      <div className="min-w-0">
        <p
          className={cn(
            "flex items-center gap-2 text-lg font-semibold sm:text-xl",
            onDark ? "text-white" : "text-zinc-800",
          )}
        >
          <Activity
            className="h-5 w-5 shrink-0 text-emerald-400 sm:h-5 sm:w-5"
            aria-hidden
          />
          {mealLabel(mealType)}
        </p>
        <Badge
          variant="outline"
          className={cn("mt-2.5 px-3 py-1 text-base font-semibold", s.badge)}
        >
          {s.label}
        </Badge>
      </div>
    </div>
  );
}

const SOFT_KPI_TONE = {
  mint: {
    card: "bg-[#e7f8ef]",
    icon: "bg-white text-emerald-600",
  },
  sky: {
    card: "bg-[#e7f3ff]",
    icon: "bg-white text-sky-600",
  },
  peach: {
    card: "bg-[#ffeedd]",
    icon: "bg-white text-orange-500",
  },
  lime: {
    card: "bg-[#e9f8e4]",
    icon: "bg-white text-lime-700",
  },
} as const;

function SoftKpi({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone: keyof typeof SOFT_KPI_TONE;
}) {
  const t = SOFT_KPI_TONE[tone];
  return (
    <div className={cn("flex items-center gap-3 rounded-[1.35rem] px-4 py-3.5", t.card)}>
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-full shadow-sm [&>svg]:h-6 [&>svg]:w-6",
          t.icon,
        )}
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-500">{label}</p>
        <p className="text-[1.65rem] font-extrabold leading-none tabular-nums tracking-tight text-zinc-950">
          {value}
        </p>
        {hint ? (
          <p className="mt-1 text-xs font-medium text-zinc-500">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

function RabRing({ pct }: { pct: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, pct));
  const dash = (clamped / 100) * c;
  return (
    <div className="relative size-[7.25rem] shrink-0">
      <svg viewBox="0 0 88 88" className="size-full -rotate-90" aria-hidden>
        <circle cx="44" cy="44" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="#16a34a"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-xl font-black tabular-nums leading-none text-zinc-900">
          {clamped.toFixed(1).replace(".", ",")} %
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-zinc-500">de RAB</p>
      </div>
    </div>
  );
}

export type CantinePulseEcoGroupRow = {
  groupName: string;
  restesServisTargetPct: number | null;
  reductionTargetPct: number | null;
  ytd: { leftovers: number; served: number };
  priorYtdLeftovers: number;
};

export type CantinePulseEco = {
  groups: CantinePulseEcoGroupRow[];
  periodTitle: string;
  restesParen: string;
  priorPhrase: string;
};

export function CantinePulseCard({
  rows,
  wasteRows = [],
  mealType,
  days = 7,
  eco = null,
  showBrandTitle = true,
  headerAction = null,
  levelFilter = "all",
  wasteByLevel,
  antiWasteModeEnabled = false,
  antiWasteTargetGPer100 = null,
}: {
  rows: CantineServiceRow[];
  wasteRows?: CantineWasteDayRow[];
  mealType: "LUNCH";
  days?: CantinePulseWindowDays;
  eco?: CantinePulseEco | null;
  /** Masquer le titre CANTINE + si déjà affiché par la section parente. */
  showBrandTitle?: boolean;
  headerAction?: ReactNode;
  levelFilter?: "all" | SchoolLevel;
  wasteByLevel?: Record<SchoolLevel, WastePerDayRowInput[]>;
  antiWasteModeEnabled?: boolean;
  antiWasteTargetGPer100?: number | null;
}) {
  const [ecoPanelOpen, setEcoPanelOpen] = useState(false);
  const periodLabel = days === 30 ? "30 jours" : "7 jours";
  const priorLabel = days === 30 ? "les 30 jours d’avant" : "la semaine d’avant";
  const levelLabel =
    levelFilter === "all" ? null : schoolLevelLabelFr(levelFilter);

  const pulse = useMemo(
    () => computeCantinePulse(rows, mealType, { windowDays: days, wasteRows }),
    [rows, wasteRows, mealType, days],
  );
  const situationConclusion = useMemo(
    () =>
      buildCantinePulseSituationConclusion(pulse, {
        windowDays: days,
        antiWasteModeEnabled,
        antiWasteTargetGPer100,
      }),
    [pulse, days, antiWasteModeEnabled, antiWasteTargetGPer100],
  );
  const s = MOOD_STYLES[pulse.mood];
  const wrCurr = pulse.meta.curr.wasteGramsPer100Served.toFixed(1);
  const dW = pulse.meta.deltas.wasteGramsPct;
  const { curr, prev } = pulse.meta;

  const sparseServings = curr.served === 0 && curr.rows > 0;
  const noActivity = curr.rows === 0;
  const scorePending = pulse.score === null;

  const evolLabel = Number.isFinite(dW)
    ? `${dW > 0 ? "+" : ""}${Math.round(dW)}%`
    : "—";
  const evolHint =
    prev.wasteWeightG > 0 || curr.wasteWeightG > 0
      ? `par rapport à ${priorLabel}`
      : "rien à comparer encore";

  const ecoGroups =
    eco?.groups.filter(
      (g) => g.restesServisTargetPct != null || g.reductionTargetPct != null,
    ) ?? [];
  const showEco = ecoGroups.length > 0;
  const periodTitle = eco?.periodTitle ?? "Objectifs";
  const restesParen = eco?.restesParen ?? "(période en cours)";
  const priorPhrase = eco?.priorPhrase ?? "vs la période précédente";

  const brandTitle = showBrandTitle ? (
    scorePending ? (
      headerAction ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CantinePlusMealHeader mealType={mealType} mood={pulse.mood} />
          {headerAction}
        </div>
      ) : (
        <CantinePlusMealHeader mealType={mealType} mood={pulse.mood} />
      )
    ) : headerAction ? (
      <div className="flex justify-end">{headerAction}</div>
    ) : null
  ) : null;

  const rabPct = curr.served > 0 ? curr.rabRate * 100 : 0;
  const situationDot = situationConclusion.situation.indexOf(". ");
  const situationLead =
    situationDot > 0
      ? situationConclusion.situation.slice(0, situationDot + 1)
      : situationConclusion.situation;
  const situationRest =
    situationDot > 0
      ? situationConclusion.situation.slice(situationDot + 2)
      : "";
  const periodBadge =
    days === 30 ? "30 derniers jours" : "7 derniers jours";

  return (
    <div className="space-y-4">
      {brandTitle}
      <div className="space-y-5">
        {showBrandTitle ? null : (
          <div className="text-center">
            <p className="text-sm text-zinc-600 sm:text-base">
              Score & lecture globale — RAB et déchets (poids) — {periodLabel}
            </p>
            {levelLabel ? (
              <p className="mt-1 text-sm font-semibold text-emerald-700 sm:text-base">
                {levelLabel}
              </p>
            ) : null}
          </div>
        )}

        {scorePending ? null : (
          <CantinePlusGlobalChart
            rows={rows}
            wasteRows={wasteRows}
            mealType={mealType}
            score={pulse.score!}
            mood={pulse.mood}
            days={days}
          />
        )}

        {wasteByLevel ? (
          <TendancesAntigaspillageCard
            wasteByLevel={wasteByLevel}
            levelFilter={levelFilter}
          />
        ) : null}

        {sparseServings ? (
          <p
            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm leading-relaxed text-amber-900"
            role="status"
          >
            <strong className="font-semibold">Pensez à remplir « servi ».</strong> Pour le{" "}
            {mealLabel(mealType).toLowerCase()}, il manque les portions servies alors qu’il y a
            déjà des lignes — sans « servi », les chiffres restent à zéro.
          </p>
        ) : null}

        {noActivity ? (
          <p
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-600"
            role="status"
          >
            Dès qu’il y aura des saisies pour ce créneau, les chiffres apparaîtront ici.
          </p>
        ) : null}

        <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-white p-4 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-[#0f766e] text-white shadow-sm">
                <BarChart3 className="h-5 w-5" strokeWidth={2.4} aria-hidden />
              </span>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-zinc-950 sm:text-2xl">
                  Les chiffres
                </h2>
                <p className="text-sm font-medium text-zinc-500">
                  Vue d’ensemble de la période
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              {periodBadge}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SoftKpi
              tone="mint"
              icon={<UtensilsCrossed strokeWidth={2.2} />}
              label="Assiettes servies"
              value={String(curr.served)}
              hint={periodLabel}
            />
            <SoftKpi
              tone="sky"
              icon={<ChefHat strokeWidth={2.2} />}
              label="RAB"
              value={String(curr.rab)}
              hint={
                curr.served > 0
                  ? `${(curr.rabRate * 100).toFixed(1).replace(".", ",")} % des servis`
                  : periodLabel
              }
            />
            <SoftKpi
              tone="peach"
              icon={<Trash2 strokeWidth={2.2} />}
              label="Déchets (poids)"
              value={
                curr.wasteWeightG > 0
                  ? `${Math.round(curr.wasteWeightG).toLocaleString("fr-FR")} g`
                  : "—"
              }
              hint={
                curr.wasteWeightG > 0 && curr.served > 0
                  ? `${curr.wasteGramsPer100Served.toFixed(1).replace(".", ",")} g / 100 assiettes`
                  : curr.wasteWeightG > 0
                    ? periodLabel
                    : "saisir en fin de service"
              }
            />
            <SoftKpi
              tone="lime"
              icon={<Leaf strokeWidth={2.2} />}
              label="Pour 100 assiettes"
              value={
                curr.served > 0 && curr.wasteWeightG > 0
                  ? `${wrCurr.replace(".", ",")} g`
                  : "—"
              }
              hint={
                curr.served > 0 && curr.wasteWeightG > 0
                  ? "déchets pour 100 servis"
                  : "pas encore de déchets"
              }
            />
          </div>
          {evolLabel !== "—" ? (
            <p className="mt-2 text-right text-xs font-semibold text-zinc-500">
              {days === 30 ? "Vs période d’avant" : "Vs semaine d’avant"} : {evolLabel}
              {evolHint ? ` · ${evolHint}` : ""}
            </p>
          ) : null}

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.9fr)]">
            <div className="rounded-[1.35rem] bg-white px-4 py-4 ring-1 ring-zinc-100 sm:px-5">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-orange-400 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white">
                <BarChart3 className="h-3.5 w-3.5" aria-hidden />
                Lecture de la période
              </p>
              <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <RabRing pct={rabPct} />
                <div className="min-w-0 space-y-3 text-sm font-medium leading-relaxed text-zinc-700 sm:text-base sm:leading-7">
                  <p>{situationLead}</p>
                  {situationRest ? <p>{situationRest}</p> : null}
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-[1.35rem] bg-[#e8f8ee] px-4 py-4 sm:px-5">
              <p className="inline-flex items-center gap-1.5 text-sm font-extrabold text-emerald-800">
                <Lightbulb className="h-4 w-4 text-emerald-600" aria-hidden />
                À retenir
              </p>
              {situationConclusion.antiWaste ? (
                <p className="mt-3 flex items-start gap-2 text-sm font-semibold leading-relaxed text-emerald-800 sm:text-[15px] sm:leading-6">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-emerald-500 p-0.5 text-white"
                    strokeWidth={3}
                    aria-hidden
                  />
                  <span>{situationConclusion.antiWaste}</span>
                </p>
              ) : (
                <p className="mt-3 text-sm font-medium text-emerald-800">
                  Les chiffres de la période s’afficheront ici dès les premières saisies.
                </p>
              )}
              <Trash2
                className="pointer-events-none absolute -bottom-2 -right-1 h-16 w-16 text-emerald-300/80"
                strokeWidth={1.5}
                aria-hidden
              />
            </div>
          </div>

          <div className="relative mt-3 overflow-hidden rounded-[1.35rem] bg-[#e8f8ee] px-4 py-4 sm:px-5">
            <span className="absolute left-0 top-0 h-full w-1.5 bg-emerald-500" aria-hidden />
            <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white">
              <Check className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden />
              Conclusion
            </p>
            <p className="mt-2.5 max-w-3xl text-xl font-extrabold leading-snug text-zinc-950 sm:text-2xl">
              {pulse.headline}
            </p>
            <p className="mt-1.5 max-w-3xl text-sm font-semibold leading-relaxed text-zinc-600 sm:text-base">
              {pulse.subline}
            </p>
            <BarChart3
              className="pointer-events-none absolute bottom-3 right-4 h-14 w-14 text-emerald-300/90"
              strokeWidth={1.6}
              aria-hidden
            />
          </div>
        </div>

        {showEco ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 shadow-sm sm:px-4 sm:py-3">
            <button
              type="button"
              onClick={() => setEcoPanelOpen((v) => !v)}
              aria-expanded={ecoPanelOpen}
              className="flex w-full items-start gap-2 rounded-xl px-1 py-1.5 text-left transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
            >
              <ChevronDown
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200",
                  ecoPanelOpen ? "rotate-0" : "-rotate-90",
                )}
                aria-hidden
              />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-zinc-900">
                  <Target className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                  <span className="text-balance">{periodTitle}</span>
                  <span className="rounded-md bg-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
                    {ecoGroups.length} classe{ecoGroups.length > 1 ? "s" : ""}
                  </span>
                </span>
                <span className="text-xs text-zinc-500">
                  {ecoPanelOpen ? "Masquer le détail" : "Afficher les objectifs par classe"}
                </span>
              </span>
            </button>
            {ecoPanelOpen ? (
              <>
            <p className="mb-3 mt-1 text-xs text-zinc-500">
              Objectifs par classe (même période pour toutes) — valeurs affichées = cible effective
              (surcharge classe ou défaut établissement).
            </p>
            <ul className="space-y-4 text-sm leading-relaxed text-zinc-800">
              {ecoGroups.map((gr) => {
                const ytdRatio = ratioRestesServisPct(gr.ytd.leftovers, gr.ytd.served);
                const ytdReduction = leftoversReductionVsPriorPct(
                  gr.ytd.leftovers,
                  gr.priorYtdLeftovers,
                );
                const ratioOnTrack =
                  gr.restesServisTargetPct != null &&
                  ytdRatio != null &&
                  ytdRatio <= gr.restesServisTargetPct;
                const reductionOnTrack =
                  gr.reductionTargetPct != null &&
                  ytdReduction != null &&
                  ytdReduction >= gr.reductionTargetPct;
                return (
                  <li key={gr.groupName} className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5">
                    <p className="font-semibold text-zinc-900">{gr.groupName}</p>
                    <ul className="mt-2 space-y-2 pl-0">
                      {gr.restesServisTargetPct != null ? (
                        <li>
                          {gr.ytd.served > 0 && ytdRatio != null ? (
                            <>
                              <span className="text-zinc-500">
                                Restes pour 100 assiettes servies {restesParen} :{" "}
                              </span>
                              <strong className="tabular-nums">{ytdRatio.toFixed(1)}</strong>
                              <span className="text-zinc-500"> — plafond </span>
                              <strong className="tabular-nums">
                                {gr.restesServisTargetPct.toLocaleString("fr-FR", {
                                  maximumFractionDigits: 1,
                                })}
                              </strong>
                              <span className="text-zinc-500"> pour 100.</span>
                              <span
                                className={cn(
                                  "ml-1.5 inline-block rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                                  ratioOnTrack
                                    ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                                    : "bg-rose-500/15 text-rose-800 dark:text-rose-200",
                                )}
                              >
                                {ratioOnTrack ? "OK" : "Au-dessus"}
                              </span>
                            </>
                          ) : (
                            <span className="text-zinc-500">
                              Pas assez de portions « servies » pour cette classe sur la période.
                            </span>
                          )}
                        </li>
                      ) : null}
                      {gr.reductionTargetPct != null ? (
                        <li>
                          {gr.priorYtdLeftovers > 0 && ytdReduction != null ? (
                            <>
                              <span className="text-zinc-500">
                                Baisse des restes {priorPhrase} :{" "}
                              </span>
                              <strong className="tabular-nums">{ytdReduction.toFixed(1)} %</strong>
                              <span className="text-zinc-500"> — objectif au moins </span>
                              <strong className="tabular-nums">
                                {gr.reductionTargetPct.toLocaleString("fr-FR", {
                                  maximumFractionDigits: 1,
                                })}{" "}
                                %
                              </strong>
                              <span className="text-zinc-500">.</span>
                              <span
                                className={cn(
                                  "ml-1.5 inline-block rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                                  reductionOnTrack
                                    ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                                    : "bg-amber-500/15 text-amber-900 dark:text-amber-100",
                                )}
                              >
                                {reductionOnTrack ? "OK" : "Encore du chemin"}
                              </span>
                            </>
                          ) : (
                            <span className="text-zinc-500">
                              Pas assez de données sur la période d’avant pour cette classe.
                            </span>
                          )}
                        </li>
                      ) : null}
                    </ul>
                  </li>
                );
              })}
            </ul>
              </>
            ) : null}
          </div>
        ) : null}

        <p className="border-t border-zinc-200 pt-4 text-sm leading-relaxed text-zinc-500">
          <span className="font-medium text-zinc-800">{pulse.actionLabel}</span>
          {" — "}
          Note /100 dès les <strong className="font-semibold text-zinc-900">premières portions servies</strong> ;
          basée surtout sur les grammes de déchets / 100 assiettes, avec une pénalité si le RAB
          est élevé, et sur l’évolution vs {priorLabel} dès qu’il y a assez d’historique.
        </p>
      </div>
    </div>
  );
}
