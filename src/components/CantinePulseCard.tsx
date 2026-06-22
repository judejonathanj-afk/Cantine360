"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  ChevronDown,
  Percent,
  Target,
  TrendingDown,
  UtensilsCrossed,
} from "lucide-react";
import { computeCantinePulse, buildCantinePulseDailySeries, type CantineServiceRow } from "@/lib/cantinePulse";
import { mealTypeLabelFr } from "@/lib/mealType";
import {
  leftoversReductionVsPriorPct,
  ratioRestesServisPct,
} from "@/lib/commissionBilan";
import { cn } from "@/lib/utils";
import { MenusCantineColorTitle } from "@/components/MenusCantineColorTitle";
import { ChildDrawnSun } from "@/components/service/ChildDrawnSun";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
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
    accent: "text-emerald-400",
    scoreBg: "bg-emerald-500/20 text-white",
    badge: "border-emerald-400/40 bg-emerald-500/20 text-emerald-100",
    label: "Ça va bien",
    barClass: "bg-emerald-500",
    track: "bg-white/10",
  },
  ok: {
    topBar: "bg-amber-500",
    accent: "text-amber-400",
    scoreBg: "bg-amber-500/20 text-white",
    badge: "border-amber-400/40 bg-amber-500/20 text-amber-100",
    label: "À suivre",
    barClass: "bg-amber-500",
    track: "bg-white/10",
  },
  attention: {
    topBar: "bg-rose-500",
    accent: "text-rose-400",
    scoreBg: "bg-rose-500/20 text-white",
    badge: "border-rose-400/40 bg-rose-500/20 text-rose-100",
    label: "À améliorer",
    barClass: "bg-rose-500",
    track: "bg-white/10",
  },
  pending: {
    topBar: "bg-zinc-500",
    accent: "text-white",
    scoreBg: "bg-white/10 text-white/80",
    badge: "border-white/25 bg-white/10 text-white/90",
    label: "En attente de données",
    barClass: "bg-white/30",
    track: "bg-white/10",
  },
} as const;

const STAT_TILE = "border-white/15 bg-white/10";

const MOOD_CHART_COLOR: Record<keyof typeof MOOD_STYLES, string> = {
  great: "#10b981",
  ok: "#f59e0b",
  attention: "#f43f5e",
  pending: "#71717a",
};

const globalChartConfig = {
  leftovers: { label: "Restes", color: "#3b82f6" },
  served: { label: "Servis", color: "#2dd4bf" },
  ratioPct: { label: "% / 100 assiettes", color: "#fafafa" },
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
        <p className="text-xs text-white/60">{label}</p>
        <p className="text-xl font-bold tabular-nums tracking-tight text-white">{value}</p>
      </div>
    </div>
  );
}

function CantinePlusGlobalChart({
  rows,
  mealType,
  score,
  mood,
}: {
  rows: CantineServiceRow[];
  mealType: string;
  score: number;
  mood: keyof typeof MOOD_STYLES;
}) {
  const series = useMemo(
    () => buildCantinePulseDailySeries(rows, mealType),
    [rows, mealType],
  );
  const hasActivity = series.some((p) => p.leftovers > 0 || p.served > 0);
  const rest = Math.max(0, 100 - score);
  const moodColor = MOOD_CHART_COLOR[mood];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-xs font-semibold text-white/70">Lecture globale</p>
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <p className="text-xs text-white/60">Note Cantine +</p>
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
              color="rgba(255,255,255,0.15)"
              label="Marge de progrès"
              value={`${rest} %`}
            />
          </div>

          {!hasActivity ? (
            <p className="rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 text-sm text-white/75">
              Pas encore de données sur les 7 derniers jours pour tracer le graphique.
            </p>
          ) : (
            <ChartContainer
              config={globalChartConfig}
              className="h-[min(16rem,45vw)] w-full min-h-[200px] aspect-auto"
            >
              <ComposedChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={16}
                  tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }}
                />
                <YAxis
                  yAxisId="count"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={32}
                  tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }}
                />
                <YAxis
                  yAxisId="pct"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                  width={36}
                  domain={[0, "auto"]}
                  tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }}
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
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  yAxisId="count"
                  dataKey="leftovers"
                  fill="var(--color-leftovers)"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={18}
                />
                <Bar
                  yAxisId="count"
                  dataKey="served"
                  fill="var(--color-served)"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={18}
                />
                <Line
                  yAxisId="pct"
                  type="monotone"
                  dataKey="ratioPct"
                  stroke="var(--color-ratioPct)"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={false}
                  connectNulls
                />
              </ComposedChart>
            </ChartContainer>
          )}
        </div>

        <div className="rounded-xl border border-white/15 bg-black/20 px-4 py-3.5">
          <p className="text-sm font-semibold text-white">Comment lire ce graphique ?</p>
          <ul className="mt-2.5 space-y-2 text-xs leading-relaxed text-white/75 sm:text-sm">
            <li>
              Les <strong className="text-white">barres bleues</strong> = restes dans
              l&apos;assiette, les <strong className="text-white">barres vert d&apos;eau</strong>{" "}
              = portions servies, jour par jour sur{" "}
              <strong className="text-white">7 jours</strong>.
            </li>
            <li>
              La <strong className="text-white">courbe pointillée</strong> = taux restes pour{" "}
              <strong className="text-white">100 assiettes servies</strong> (axe de droite).
            </li>
            <li>
              La <strong className="text-white">note sur 100</strong> ({score}/100) résume la
              semaine : plus elle est haute, mieux c&apos;est —{" "}
              <strong className="text-white">100 = objectif idéal</strong>.
            </li>
            <li>
              Le calcul repose surtout sur le taux restes ÷ servis, avec une petite pénalité si
              le RAB est élevé, et l&apos;évolution vs la semaine d&apos;avant dès qu&apos;il y a
              assez d&apos;historique.
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
      <div className="flex items-center gap-1.5 text-white/70">
        <span className="text-emerald-400 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
        <dt className="text-[11px] font-semibold">{label}</dt>
      </div>
      <dd className="text-lg font-bold tabular-nums tracking-tight text-white">{value}</dd>
      {hint ? (
        <p className="text-[10px] leading-snug text-white/60">{hint}</p>
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
  mealType,
  eco = null,
}: {
  rows: CantineServiceRow[];
  mealType: "LUNCH";
  eco?: CantinePulseEco | null;
}) {
  const [ecoPanelOpen, setEcoPanelOpen] = useState(false);

  const pulse = useMemo(
    () => computeCantinePulse(rows, mealType),
    [rows, mealType],
  );
  const s = MOOD_STYLES[pulse.mood];
  const wrCurr = (pulse.meta.curr.wasteRate * 100).toFixed(1);
  const dL = pulse.meta.deltas.leftoversPct;
  const { curr, prev } = pulse.meta;

  const sparseServings = curr.served === 0 && curr.rows > 0;
  const noActivity = curr.rows === 0;
  const scorePending = pulse.score === null;

  const evolLabel = Number.isFinite(dL)
    ? `${dL > 0 ? "+" : ""}${Math.round(dL)}%`
    : "—";
  const evolHint =
    prev.leftovers > 0 || curr.leftovers > 0
      ? "par rapport aux 7 jours d’avant"
      : "rien à comparer encore";

  const ecoGroups =
    eco?.groups.filter(
      (g) => g.restesServisTargetPct != null || g.reductionTargetPct != null,
    ) ?? [];
  const showEco = ecoGroups.length > 0;
  const periodTitle = eco?.periodTitle ?? "Objectifs";
  const restesParen = eco?.restesParen ?? "(période en cours)";
  const priorPhrase = eco?.priorPhrase ?? "vs la période précédente";

  return (
    <Card
      className="overflow-hidden border-zinc-800 bg-zinc-950 text-white shadow-md ring-1 ring-zinc-800 transition-shadow hover:shadow-lg"
    >
      <div className={cn("h-1.5 w-full shrink-0", s.topBar)} aria-hidden />
      <CardContent className="space-y-5 p-6 pt-4">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="inline-flex rounded-xl bg-black px-5 py-2 shadow-lg ring-1 ring-white/10 sm:rounded-2xl sm:px-6 sm:py-2.5">
              <MenusCantineColorTitle
                text="CANTINE +"
                className="text-2xl sm:text-3xl lg:text-4xl"
              />
            </div>
          </div>
          <p className="mx-auto mt-2 max-w-2xl text-balance text-sm text-white/75 sm:text-base">
            Restes dans l&apos;assiette et RAB{" "}
            <span className="text-white/90">(assiettes adaptées ou resservies)</span> — 7 jours
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <MealIcon />
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-base font-semibold text-white/85 sm:text-lg">
              <Activity className="h-5 w-5 shrink-0 text-emerald-400 sm:h-5 sm:w-5" aria-hidden />
              {mealLabel(mealType)}
            </p>
            <Badge
              variant="outline"
              className={cn("mt-2.5 px-3 py-1 text-sm font-semibold sm:text-base", s.badge)}
            >
              {s.label}
            </Badge>
          </div>
        </div>

        {scorePending ? null : (
          <CantinePlusGlobalChart
            rows={rows}
            mealType={mealType}
            score={pulse.score!}
            mood={pulse.mood}
          />
        )}

        <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5">
          <p className="text-sm font-semibold leading-snug text-white">{pulse.headline}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-white/75">{pulse.subline}</p>
        </div>

        {sparseServings ? (
          <p
            className="rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-2.5 text-sm leading-relaxed text-amber-100"
            role="status"
          >
            <strong className="font-semibold">Pensez à remplir « servi ».</strong> Pour le{" "}
            {mealLabel(mealType).toLowerCase()}, il manque les portions servies alors qu’il y a
            déjà des lignes — sans « servi », les chiffres restent à zéro.
          </p>
        ) : null}

        {noActivity ? (
          <p
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white/75"
            role="status"
          >
            Dès qu’il y aura des saisies pour ce créneau, les chiffres apparaîtront ici.
          </p>
        ) : null}

        <div>
          <p className="mb-3 text-xs font-semibold text-white/70">Les chiffres</p>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-3">
            <StatTile
              icon={<TrendingDown className="h-3.5 w-3.5" />}
              label="Restes cumulés"
              value={String(curr.leftovers)}
              hint="7 derniers jours"
              tileClass={STAT_TILE}
            />
            <StatTile
              icon={<UtensilsCrossed className="h-3.5 w-3.5" />}
              label="Assiettes servies"
              value={String(curr.served)}
              hint="7 derniers jours"
              tileClass={STAT_TILE}
            />
            <StatTile
              icon={<Activity className="h-3.5 w-3.5" />}
              label="RAB"
              value={String(curr.rab)}
              hint={
                curr.served > 0
                  ? `${(curr.rabRate * 100).toFixed(1)} % des servis`
                  : "7 derniers jours"
              }
              tileClass={STAT_TILE}
            />
            <StatTile
              icon={<Percent className="h-3.5 w-3.5" />}
              label="Pour 100 assiettes"
              value={curr.served > 0 ? `${wrCurr} %` : "—"}
              hint={curr.served > 0 ? "restes pour 100 servies" : "pas encore de servis"}
              tileClass={STAT_TILE}
            />
            <StatTile
              icon={<Activity className="h-3.5 w-3.5" />}
              label="Vs semaine d’avant"
              value={evolLabel}
              hint={evolHint}
              tileClass={STAT_TILE}
            />
          </dl>
        </div>

        {showEco ? (
          <div className="rounded-2xl border border-white/15 bg-white/5 px-3 py-2 shadow-sm sm:px-4 sm:py-3">
            <button
              type="button"
              onClick={() => setEcoPanelOpen((v) => !v)}
              aria-expanded={ecoPanelOpen}
              className="flex w-full items-start gap-2 rounded-xl px-1 py-1.5 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              <ChevronDown
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0 text-white/70 transition-transform duration-200",
                  ecoPanelOpen ? "rotate-0" : "-rotate-90",
                )}
                aria-hidden
              />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
                  <Target className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                  <span className="text-balance">{periodTitle}</span>
                  <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/70">
                    {ecoGroups.length} classe{ecoGroups.length > 1 ? "s" : ""}
                  </span>
                </span>
                <span className="text-xs text-white/60">
                  {ecoPanelOpen ? "Masquer le détail" : "Afficher les objectifs par classe"}
                </span>
              </span>
            </button>
            {ecoPanelOpen ? (
              <>
            <p className="mb-3 mt-1 text-xs text-white/65">
              Objectifs par classe (même période pour toutes) — valeurs affichées = cible effective
              (surcharge classe ou défaut établissement).
            </p>
            <ul className="space-y-4 text-sm leading-relaxed text-white/90">
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
                  <li key={gr.groupName} className="rounded-xl border border-white/15 bg-white/5 px-3 py-2.5">
                    <p className="font-semibold text-white">{gr.groupName}</p>
                    <ul className="mt-2 space-y-2 pl-0">
                      {gr.restesServisTargetPct != null ? (
                        <li>
                          {gr.ytd.served > 0 && ytdRatio != null ? (
                            <>
                              <span className="text-white/65">
                                Restes pour 100 assiettes servies {restesParen} :{" "}
                              </span>
                              <strong className="tabular-nums">{ytdRatio.toFixed(1)}</strong>
                              <span className="text-white/65"> — plafond </span>
                              <strong className="tabular-nums">
                                {gr.restesServisTargetPct.toLocaleString("fr-FR", {
                                  maximumFractionDigits: 1,
                                })}
                              </strong>
                              <span className="text-white/65"> pour 100.</span>
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
                            <span className="text-white/65">
                              Pas assez de portions « servies » pour cette classe sur la période.
                            </span>
                          )}
                        </li>
                      ) : null}
                      {gr.reductionTargetPct != null ? (
                        <li>
                          {gr.priorYtdLeftovers > 0 && ytdReduction != null ? (
                            <>
                              <span className="text-white/65">
                                Baisse des restes {priorPhrase} :{" "}
                              </span>
                              <strong className="tabular-nums">{ytdReduction.toFixed(1)} %</strong>
                              <span className="text-white/65"> — objectif au moins </span>
                              <strong className="tabular-nums">
                                {gr.reductionTargetPct.toLocaleString("fr-FR", {
                                  maximumFractionDigits: 1,
                                })}{" "}
                                %
                              </strong>
                              <span className="text-white/65">.</span>
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
                            <span className="text-white/65">
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

        <p className="border-t border-white/15 pt-4 text-[11px] leading-relaxed text-white/60">
          <span className="font-medium text-white/85">{pulse.actionLabel}</span>
          {" — "}
          Note /100 dès les <strong className="font-semibold text-white/90">premières portions servies</strong> ;
          basée surtout sur le taux restes / servis, et sur l’évolution vs la semaine d’avant dès
          qu’il y a assez d’historique.
        </p>
      </CardContent>
    </Card>
  );
}
