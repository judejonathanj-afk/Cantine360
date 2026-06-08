"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  ChevronDown,
  Percent,
  Sun,
  Target,
  TrendingDown,
  UtensilsCrossed,
} from "lucide-react";
import { computeCantinePulse, type CantineServiceRow } from "@/lib/cantinePulse";
import { mealTypeLabelFr } from "@/lib/mealType";
import {
  leftoversReductionVsPriorPct,
  ratioRestesServisPct,
} from "@/lib/commissionBilan";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const MOOD_STYLES = {
  great: {
    topBar: "bg-emerald-500",
    ring: "ring-emerald-500/20 border-emerald-200/60",
    gradient: "from-emerald-50/90 via-card to-card dark:from-emerald-950/25",
    accent: "text-emerald-700 dark:text-emerald-300",
    scoreBg: "bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
    badge:
      "border-emerald-500/25 bg-emerald-500/12 text-emerald-900 dark:text-emerald-100",
    label: "Ça va bien",
    barClass: "bg-emerald-600",
    track: "bg-emerald-950/10",
    statTile: "border-emerald-100/80 bg-white/70 dark:border-emerald-900/40 dark:bg-emerald-950/20",
  },
  ok: {
    topBar: "bg-amber-500",
    ring: "ring-amber-500/20 border-amber-200/60",
    gradient: "from-amber-50/80 via-card to-card dark:from-amber-950/20",
    accent: "text-amber-800 dark:text-amber-200",
    scoreBg: "bg-amber-500/12 text-amber-950 dark:text-amber-50",
    badge:
      "border-amber-500/25 bg-amber-500/10 text-amber-950 dark:text-amber-100",
    label: "À suivre",
    barClass: "bg-amber-500",
    track: "bg-amber-950/10",
    statTile: "border-amber-100/80 bg-white/70 dark:border-amber-900/40 dark:bg-amber-950/15",
  },
  attention: {
    topBar: "bg-rose-500",
    ring: "ring-rose-500/20 border-rose-200/70",
    gradient: "from-rose-50/90 via-card to-card dark:from-rose-950/25",
    accent: "text-rose-700 dark:text-rose-300",
    scoreBg: "bg-rose-500/10 text-rose-950 dark:text-rose-50",
    badge:
      "border-rose-500/25 bg-rose-500/10 text-rose-950 dark:text-rose-100",
    label: "À améliorer",
    barClass: "bg-rose-600",
    track: "bg-rose-950/10",
    statTile: "border-rose-100/80 bg-white/70 dark:border-rose-900/40 dark:bg-rose-950/20",
  },
} as const;

function mealLabel(mealType: string) {
  return mealTypeLabelFr(mealType);
}

function MealIcon() {
  return (
    <div
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card shadow-sm",
      )}
    >
      <Sun className="h-5 w-5 text-primary" aria-hidden />
    </div>
  );
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
        "flex flex-col gap-1 rounded-2xl border px-3 py-3 shadow-sm backdrop-blur-sm transition-colors sm:min-h-[5.25rem]",
        tileClass,
      )}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <span className="text-primary/80 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
        <dt className="text-[11px] font-semibold">{label}</dt>
      </div>
      <dd className="text-lg font-bold tabular-nums tracking-tight text-foreground">
        {value}
      </dd>
      {hint ? (
        <p className="text-[10px] leading-snug text-muted-foreground">{hint}</p>
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
      className={cn(
        "overflow-hidden border bg-gradient-to-b shadow-md ring-1 transition-shadow hover:shadow-lg",
        s.gradient,
        s.ring,
      )}
    >
      <div className={cn("h-1.5 w-full shrink-0", s.topBar)} aria-hidden />
      <CardContent className="space-y-5 p-6 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 gap-3">
            <MealIcon />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Activity className="h-3.5 w-3.5 text-primary" aria-hidden />
                {mealLabel(mealType)}
              </p>
              <h2 className="mt-1.5 text-balance text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Les restes sur 7 jours
              </h2>
              <Badge variant="outline" className={cn("mt-2.5 font-semibold", s.badge)}>
                {s.label}
              </Badge>
            </div>
          </div>
          <div
            className={cn(
              "flex shrink-0 flex-col items-end rounded-2xl px-4 py-2.5 tabular-nums",
              s.scoreBg,
            )}
          >
            <p className={cn("text-3xl font-black leading-none sm:text-4xl", s.accent)}>
              {pulse.score}
              <span className="text-sm font-bold opacity-60">/100</span>
            </p>
            <span className="mt-1 text-[10px] font-medium text-muted-foreground">
              photo sur 7 jours
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Lecture globale</span>
            <span className="tabular-nums">{pulse.score}%</span>
          </div>
          <Progress
            value={pulse.score}
            className={cn("h-3 rounded-full", s.track)}
            indicatorClassName={cn("rounded-full", s.barClass)}
          />
        </div>

        <div className="rounded-2xl border border-border/50 bg-muted/30 px-4 py-3.5">
          <p className="text-sm font-semibold leading-snug text-foreground">
            {pulse.headline}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {pulse.subline}
          </p>
        </div>

        {sparseServings ? (
          <p
            className="rounded-xl border border-amber-200/90 bg-amber-50/95 px-3 py-2.5 text-sm leading-relaxed text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-50"
            role="status"
          >
            <strong className="font-semibold">Pensez à remplir « servi ».</strong> Pour le{" "}
            {mealLabel(mealType).toLowerCase()}, il manque les portions servies alors qu’il y a
            déjà des lignes — sans « servi », les chiffres restent à zéro.
          </p>
        ) : null}

        {noActivity ? (
          <p
            className="rounded-xl border border-border/60 bg-secondary/40 px-3 py-2.5 text-sm text-muted-foreground"
            role="status"
          >
            Dès qu’il y aura des saisies pour ce créneau sur deux semaines, les chiffres
            apparaîtront ici.
          </p>
        ) : null}

        <div>
          <p className="mb-3 text-xs font-semibold text-muted-foreground">Les chiffres</p>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3">
            <StatTile
              icon={<TrendingDown className="h-3.5 w-3.5" />}
              label="Restes cumulés"
              value={String(curr.leftovers)}
              hint="7 derniers jours"
              tileClass={s.statTile}
            />
            <StatTile
              icon={<UtensilsCrossed className="h-3.5 w-3.5" />}
              label="Assiettes servies"
              value={String(curr.served)}
              hint="7 derniers jours"
              tileClass={s.statTile}
            />
            <StatTile
              icon={<Percent className="h-3.5 w-3.5" />}
              label="Pour 100 assiettes"
              value={curr.served > 0 ? `${wrCurr} %` : "—"}
              hint={curr.served > 0 ? "restes pour 100 servies" : "pas encore de servis"}
              tileClass={s.statTile}
            />
            <StatTile
              icon={<Activity className="h-3.5 w-3.5" />}
              label="Vs semaine d’avant"
              value={evolLabel}
              hint={evolHint}
              tileClass={s.statTile}
            />
          </dl>
        </div>

        {showEco ? (
          <div className="rounded-2xl border border-border/50 bg-card/60 px-3 py-2 shadow-sm sm:px-4 sm:py-3">
            <button
              type="button"
              onClick={() => setEcoPanelOpen((v) => !v)}
              aria-expanded={ecoPanelOpen}
              className="flex w-full items-start gap-2 rounded-xl px-1 py-1.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronDown
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                  ecoPanelOpen ? "rotate-0" : "-rotate-90",
                )}
                aria-hidden
              />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                  <Target className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="text-balance">{periodTitle}</span>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {ecoGroups.length} classe{ecoGroups.length > 1 ? "s" : ""}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {ecoPanelOpen ? "Masquer le détail" : "Afficher les objectifs par classe"}
                </span>
              </span>
            </button>
            {ecoPanelOpen ? (
              <>
            <p className="mb-3 mt-1 text-xs text-muted-foreground">
              Objectifs par classe (même période pour toutes) — valeurs affichées = cible effective
              (surcharge classe ou défaut établissement).
            </p>
            <ul className="space-y-4 text-sm leading-relaxed text-foreground">
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
                  <li key={gr.groupName} className="rounded-xl border border-border/40 bg-background/40 px-3 py-2.5">
                    <p className="font-semibold text-foreground">{gr.groupName}</p>
                    <ul className="mt-2 space-y-2 pl-0">
                      {gr.restesServisTargetPct != null ? (
                        <li>
                          {gr.ytd.served > 0 && ytdRatio != null ? (
                            <>
                              <span className="text-muted-foreground">
                                Restes pour 100 assiettes servies {restesParen} :{" "}
                              </span>
                              <strong className="tabular-nums">{ytdRatio.toFixed(1)}</strong>
                              <span className="text-muted-foreground"> — plafond </span>
                              <strong className="tabular-nums">
                                {gr.restesServisTargetPct.toLocaleString("fr-FR", {
                                  maximumFractionDigits: 1,
                                })}
                              </strong>
                              <span className="text-muted-foreground"> pour 100.</span>
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
                            <span className="text-muted-foreground">
                              Pas assez de portions « servies » pour cette classe sur la période.
                            </span>
                          )}
                        </li>
                      ) : null}
                      {gr.reductionTargetPct != null ? (
                        <li>
                          {gr.priorYtdLeftovers > 0 && ytdReduction != null ? (
                            <>
                              <span className="text-muted-foreground">
                                Baisse des restes {priorPhrase} :{" "}
                              </span>
                              <strong className="tabular-nums">{ytdReduction.toFixed(1)} %</strong>
                              <span className="text-muted-foreground"> — objectif au moins </span>
                              <strong className="tabular-nums">
                                {gr.reductionTargetPct.toLocaleString("fr-FR", {
                                  maximumFractionDigits: 1,
                                })}{" "}
                                %
                              </strong>
                              <span className="text-muted-foreground">.</span>
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
                            <span className="text-muted-foreground">
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

        <p className="border-t border-border/50 pt-4 text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground/80">{pulse.actionLabel}</span>
          {" — "}
          Toujours la même règle : les 7 derniers jours comparés aux 7 jours d’avant.
        </p>
      </CardContent>
    </Card>
  );
}
