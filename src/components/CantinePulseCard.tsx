"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  ChevronDown,
  Percent,
  Target,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { computeCantinePulse, buildCantinePulseDailySeries, type CantinePulseWindowDays, type CantineServiceRow, type CantineWasteDayRow } from "@/lib/cantinePulse";
import { mealTypeLabelFr } from "@/lib/mealType";
import {
  leftoversReductionVsPriorPct,
  ratioRestesServisPct,
} from "@/lib/commissionBilan";
import { cn } from "@/lib/utils";
import { schoolLevelLabelFr, type SchoolLevel } from "@/lib/schoolLevel";
import { MenusCantineColorTitle } from "@/components/MenusCantineColorTitle";
import { ChildDrawnSun } from "@/components/service/ChildDrawnSun";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
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

const STAT_TILE = "border-zinc-200 bg-zinc-50";

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
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <span
        className="mt-0.5 w-1 shrink-0 self-stretch rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <div>
        <p className="text-sm text-zinc-500">{label}</p>
        <p className="text-xl font-bold tabular-nums tracking-tight text-zinc-900">{value}</p>
      </div>
    </div>
  );
}

function CantineChartLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-3 text-sm text-zinc-600">
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

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
      <p className="text-sm font-semibold text-zinc-700">Lecture globale</p>
      <div className="mt-4 space-y-4">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <p className="text-sm text-zinc-500">Note Cantine +</p>
              <p
                className={cn(
                  "text-4xl font-black tabular-nums leading-none sm:text-5xl",
                  MOOD_STYLES[mood].accent,
                )}
              >
                {score}
                <span className="text-base font-bold opacity-60 sm:text-lg">/100</span>
              </p>
            </div>
            <ChartLegendItem color={moodColor} label="Niveau actuel" value={`${score} %`} />
            <ChartLegendItem
              color="rgba(24,24,27,0.15)"
              label="Marge de progrès"
              value={`${rest} %`}
            />
            {totalWasteG > 0 ? (
              <ChartLegendItem
                color="#eab308"
                label="Déchets cumulés"
                value={`${Math.round(totalWasteG).toLocaleString("fr-FR")} g`}
              />
            ) : (
              <ChartLegendItem color="#eab308" label="Déchets cumulés" value="—" />
            )}
          </div>

          {!hasActivity ? (
            <p className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-600">
              Pas encore de données sur les {periodLabel} pour tracer le graphique.
            </p>
          ) : (
            <>
            <ChartContainer
              config={globalChartConfig}
              className="h-[min(19rem,48vw)] w-full min-h-[220px] aspect-auto"
            >
              <ComposedChart data={series} margin={{ top: 8, right: 44, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(24,24,27,0.08)" strokeDasharray="4 4" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={16}
                  tick={{ fill: "rgba(24,24,27,0.65)", fontSize: 13 }}
                />
                <YAxis
                  yAxisId="count"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={32}
                  tick={{ fill: "rgba(24,24,27,0.65)", fontSize: 13 }}
                />
                <YAxis
                  yAxisId="pct"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                  width={36}
                  domain={[0, "auto"]}
                  tick={{ fill: "rgba(24,24,27,0.65)", fontSize: 13 }}
                />
                <YAxis
                  yAxisId="waste"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v} g`}
                  width={40}
                  domain={[0, "auto"]}
                  tick={{ fill: "rgba(234,179,8,0.95)", fontSize: 13 }}
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
            </>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white px-3 py-3.5">
          <p className="text-base font-semibold leading-snug text-zinc-900">
            Comment lire ce graphique ?
          </p>
          <ul className="mt-2.5 grid gap-3 text-sm leading-relaxed text-zinc-600 sm:grid-cols-2 xl:grid-cols-4">
            <li>
              Les <strong className="text-zinc-900">barres vert d&apos;eau</strong> = portions
              servies sur <strong className="text-zinc-900">{periodLabel}</strong>.
            </li>
            <li>
              La <strong className="text-yellow-700">courbe jaune</strong> = poids des déchets
              (g, axe de droite). La{" "}
              <strong className="text-lime-700">courbe verte pointillée</strong> = g de déchets
              pour 100 assiettes.
            </li>
            <li>
              La <strong className="text-zinc-900">note sur 100</strong> ({score}/100) résume la
              période : plus elle est haute, mieux c&apos;est —{" "}
              <strong className="text-zinc-900">100 = objectif idéal</strong>.
            </li>
            <li>
              Le calcul repose surtout sur les grammes de déchets pour 100 assiettes, avec une
              petite pénalité si le RAB est élevé, et l&apos;évolution vs {priorLabel} dès
              qu&apos;il y a assez d&apos;historique.
            </li>
          </ul>
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

type StatProps = {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  tileClass: string;
};

function StatTile({ icon, label, value, hint, tileClass }: StatProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-2xl border px-3 py-3 shadow-sm transition-colors sm:min-h-[5.25rem]",
        tileClass,
      )}
    >
      <div className="flex items-center gap-1.5 text-zinc-600">
        <span className="text-emerald-600 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
        <dt className="text-sm font-semibold">{label}</dt>
      </div>
      <dd className="text-xl font-bold tabular-nums tracking-tight text-zinc-900">{value}</dd>
      {hint ? (
        <p className="text-xs leading-snug text-zinc-500">{hint}</p>
      ) : null}
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
  levelFilter = "all",
}: {
  rows: CantineServiceRow[];
  wasteRows?: CantineWasteDayRow[];
  mealType: "LUNCH";
  days?: CantinePulseWindowDays;
  eco?: CantinePulseEco | null;
  /** Masquer le titre CANTINE + si déjà affiché par la section parente. */
  showBrandTitle?: boolean;
  levelFilter?: "all" | SchoolLevel;
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
    <div className="w-full text-center">
      <p className="w-full text-base leading-relaxed text-zinc-800 sm:text-lg">
        Cantine+ suit le repas du quotidien : elle calcule une{" "}
        <span className="font-semibold text-zinc-950">note sur 100</span>, met en
        avant le RAB et le poids des déchets, et affiche les tendances pour
        aider cuisine et direction à{" "}
        <span className="font-semibold text-zinc-950">réduire le gaspillage</span>.
      </p>
      <p className="mt-2 w-full text-base text-zinc-600 sm:text-lg">
        RAB <span className="text-zinc-800">(assiettes adaptées ou resservies)</span> et
        déchets (poids) — {periodLabel}
      </p>
      {levelLabel ? (
        <p className="mt-1 text-sm font-semibold text-emerald-700 sm:text-base">
          {levelLabel}
        </p>
      ) : null}
    </div>
  ) : null;

  return (
    <div className="space-y-4">
      {brandTitle}
    <Card
      className="overflow-hidden border-zinc-200 bg-white text-zinc-900 shadow-md ring-1 ring-zinc-200 transition-shadow hover:shadow-lg"
    >
      <div className={cn("h-1.5 w-full shrink-0", s.topBar)} aria-hidden />
      <CardContent className="space-y-5 p-6 pt-4">
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

        <div className="flex items-start justify-between gap-4">
          {showBrandTitle ? (
            <div className="inline-flex shrink-0 items-center rounded-full bg-[#06101c] px-4 py-1.5 shadow-md ring-1 ring-zinc-200 sm:px-5 sm:py-2">
              <MenusCantineColorTitle
                text="CANTINE +"
                className="text-base tracking-[0.16em] sm:text-lg md:text-lg lg:text-lg"
              />
            </div>
          ) : null}
          <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-4">
            <MealIcon />
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-lg font-semibold text-zinc-800 sm:text-xl">
                <Activity className="h-5 w-5 shrink-0 text-emerald-600 sm:h-5 sm:w-5" aria-hidden />
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
        </div>

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

        <div>
          <p className="mb-3 text-sm font-semibold text-zinc-600">Les chiffres</p>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-3">
            <StatTile
              icon={<UtensilsCrossed className="h-3.5 w-3.5" />}
              label="Assiettes servies"
              value={String(curr.served)}
              hint={periodLabel}
              tileClass={STAT_TILE}
            />
            <StatTile
              icon={<Activity className="h-3.5 w-3.5" />}
              label="RAB"
              value={String(curr.rab)}
              hint={
                curr.served > 0
                  ? `${(curr.rabRate * 100).toFixed(1)} % des servis`
                  : periodLabel
              }
              tileClass={STAT_TILE}
            />
            <StatTile
              icon={<Trash2 className="h-3.5 w-3.5" />}
              label="Déchets (poids)"
              value={
                curr.wasteWeightG > 0
                  ? `${Math.round(curr.wasteWeightG).toLocaleString("fr-FR")} g`
                  : "—"
              }
              hint={
                curr.wasteWeightG > 0 && curr.served > 0
                  ? `${curr.wasteGramsPer100Served.toFixed(1)} g / 100 assiettes`
                  : curr.wasteWeightG > 0
                    ? periodLabel
                    : "saisir en fin de service"
              }
              tileClass={STAT_TILE}
            />
            <StatTile
              icon={<Percent className="h-3.5 w-3.5" />}
              label="Pour 100 assiettes"
              value={curr.served > 0 && curr.wasteWeightG > 0 ? `${wrCurr} g` : "—"}
              hint={
                curr.served > 0 && curr.wasteWeightG > 0
                  ? "déchets pour 100 servies"
                  : "pas encore de déchets"
              }
              tileClass={STAT_TILE}
            />
            <StatTile
              icon={<Activity className="h-3.5 w-3.5" />}
              label={days === 30 ? "Vs période d’avant" : "Vs semaine d’avant"}
              value={evolLabel}
              hint={evolHint}
              tileClass={STAT_TILE}
            />
          </dl>
        </div>

        <div
          className={cn(
            "rounded-2xl border px-4 py-3.5",
            pulse.mood === "attention" && "border-rose-200 bg-rose-50",
            pulse.mood === "great" && "border-emerald-200 bg-emerald-50",
            pulse.mood === "ok" && "border-amber-200 bg-amber-50",
            pulse.mood === "pending" && "border-zinc-200 bg-zinc-50",
          )}
        >
          <p
            className={cn(
              "text-lg font-bold leading-snug sm:text-xl",
              pulse.mood === "attention" && "text-rose-800",
              pulse.mood === "great" && "text-emerald-800",
              pulse.mood === "ok" && "text-amber-900",
              pulse.mood === "pending" && "text-zinc-900",
            )}
          >
            {pulse.headline}
          </p>
          <p
            className={cn(
              "mt-1.5 text-base font-medium leading-relaxed",
              pulse.mood === "attention" && "text-rose-700",
              pulse.mood === "great" && "text-emerald-700",
              pulse.mood === "ok" && "text-amber-800",
              pulse.mood === "pending" && "text-zinc-700",
            )}
          >
            {pulse.subline}
          </p>
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
      </CardContent>
    </Card>
    </div>
  );
}
