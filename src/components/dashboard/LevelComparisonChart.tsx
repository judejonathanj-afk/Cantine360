"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  buildLevelRateBars,
  levelTotalsHasData,
  type LevelMealTotals,
} from "@/lib/buildLevelComparisonSeries";
import { schoolLevelLabelFr, type SchoolLevel } from "@/lib/schoolLevel";
import {
  cantinePlusChartCardClass,
  cantinePlusChartPlotClass,
} from "@/lib/cantinePlusTheme";
import { cn } from "@/lib/utils";

const LEVEL_CHART = {
  MATERNELLE: {
    color: "#3b82f6",
    headerBg: "bg-sky-100",
    icon: "text-sky-800/35",
    border: "border-sky-500 shadow-sky-500/10",
    headerBorder: "border-sky-500",
    divider: "bg-sky-500/70",
    titleAccent: "text-sky-800",
  },
  PRIMAIRE: {
    color: "#10b981",
    headerBg: "bg-emerald-100",
    icon: "text-emerald-800/35",
    border: "border-emerald-500 shadow-emerald-500/10",
    headerBorder: "border-emerald-500",
    divider: "bg-emerald-500/70",
    titleAccent: "text-emerald-800",
  },
} as const;

type Props = {
  days: 7 | 30;
  level: SchoolLevel;
  totals: LevelMealTotals;
  embedded?: boolean;
};

export function LevelComparisonChart({
  days,
  level,
  totals,
  embedded = false,
}: Props) {
  const theme = LEVEL_CHART[level];
  const levelLabel = schoolLevelLabelFr(level);
  const series = useMemo(() => buildLevelRateBars(totals), [totals]);
  const hasData = levelTotalsHasData(totals);

  const chartConfig = {
    rate: {
      label: levelLabel,
      color: theme.color,
    },
  } satisfies ChartConfig;

  const plot = !hasData ? (
    <p className={cn("text-sm text-muted-foreground", !embedded && "mt-5 px-6")}>
      Pas encore de compteurs {levelLabel.toLowerCase()} sur la période —
      saisissez les présents / servis / RAB / refus pour voir les taux ici.
    </p>
  ) : (
    <ChartContainer
      config={chartConfig}
      className={cn(cantinePlusChartPlotClass, embedded && "aspect-auto h-[260px] w-full")}
    >
      <BarChart
        data={series}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="metric"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={44}
          tickFormatter={(v) => `${v} %`}
          domain={[0, "auto"]}
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
              formatter={(value) =>
                typeof value === "number"
                  ? `${value.toLocaleString("fr-FR", {
                      maximumFractionDigits: 1,
                    })} %`
                  : value
              }
            />
          )}
        />
        <Bar
          dataKey="rate"
          fill="var(--color-rate)"
          radius={[4, 4, 0, 0]}
          maxBarSize={64}
        />
      </BarChart>
    </ChartContainer>
  );

  if (embedded) return plot;

  return (
    <Card
      className={cn(cantinePlusChartCardClass, "border-2", theme.border)}
    >
      <CardContent className="p-0">
        <header className={cn("border-b-2", theme.headerBorder)}>
          <div className="flex flex-col md:flex-row md:items-stretch md:gap-0">
            <div
              className={cn(
                "relative flex w-full shrink-0 items-center self-stretch overflow-hidden py-5 pl-14 pr-6 sm:pl-16 md:w-[16.5rem] md:max-w-[16.5rem] md:pl-16 md:pr-6",
                theme.headerBg,
              )}
            >
              <div
                className="pointer-events-none absolute inset-y-0 left-0 w-12 overflow-hidden sm:w-14 md:w-16"
                aria-hidden
              >
                <GraduationCap
                  className={cn(
                    "absolute right-0 top-1/2 h-28 w-28 -translate-y-1/2 sm:h-32 sm:w-32 md:h-36 md:w-36",
                    theme.icon,
                  )}
                  strokeWidth={1.25}
                />
              </div>
              <h2 className="relative z-10 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-[1.75rem] lg:leading-tight">
                Taux du cycle
                <span
                  className={cn(
                    "block text-lg font-semibold sm:text-xl lg:text-2xl",
                    theme.titleAccent,
                  )}
                >
                  {levelLabel}
                </span>
              </h2>
            </div>

            <div
              className={cn(
                "hidden w-px shrink-0 self-stretch md:block",
                theme.divider,
              )}
              aria-hidden
            />
            <div
              className={cn("h-px w-full shrink-0 md:hidden", theme.divider)}
              aria-hidden
            />

            <div className="min-w-0 space-y-2 px-6 py-5 md:flex-1 md:pl-6 md:pr-0">
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                Déjeuner {levelLabel.toLowerCase()} sur les {days} derniers jours —
                taux de service, RAB et refus.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                <strong className="font-semibold text-foreground">Barres</strong> =
                taux en % ·{" "}
                <strong className="font-semibold text-foreground">service</strong> =
                servis / présents ·{" "}
                <strong className="font-semibold text-foreground">RAB</strong> et{" "}
                <strong className="font-semibold text-foreground">refus</strong> = vs
                assiettes servies.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                <strong className="font-semibold text-foreground">En résumé :</strong>{" "}
                pour ajuster portions et menu de ce cycle.
              </p>
            </div>
          </div>
        </header>
        {plot}
      </CardContent>
    </Card>
  );
}
