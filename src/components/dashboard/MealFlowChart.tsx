"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { UtensilsCrossed } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  buildMealFlowSeries,
  type MealFlowDayInput,
} from "@/lib/buildMealFlowSeries";
import {
  cantinePlusChartCardClass,
  cantinePlusChartPlotClass,
} from "@/lib/cantinePlusTheme";
import { schoolLevelLabelFr, type SchoolLevel } from "@/lib/schoolLevel";
import { cn } from "@/lib/utils";

const chartConfig = {
  present: {
    label: "Présents",
    color: "#0f766e",
  },
  served: {
    label: "Servis",
    color: "#10b981",
  },
  rab: {
    label: "RAB",
    color: "#d97706",
  },
  refused: {
    label: "Refus",
    color: "#e11d48",
  },
} satisfies ChartConfig;

type Props = {
  days: 7 | 30;
  perDayRows: MealFlowDayInput[];
  level?: SchoolLevel;
};

export function MealFlowChart({ days, perDayRows, level }: Props) {
  const series = useMemo(() => buildMealFlowSeries(perDayRows), [perDayRows]);
  const hasData = series.some(
    (p) => p.present > 0 || p.served > 0 || p.rab > 0 || p.refused > 0,
  );
  const levelLabel = level ? schoolLevelLabelFr(level) : null;

  return (
    <Card
      className={cn(
        cantinePlusChartCardClass,
        "border-2 border-yellow-400 shadow-yellow-400/15",
      )}
    >
      <CardContent className="p-0">
        <header className="border-b-2 border-yellow-400">
          <div className="flex flex-col md:flex-row md:items-stretch md:gap-0">
            <div className="relative flex shrink-0 items-center self-stretch overflow-hidden bg-teal-100 py-5 pl-14 pr-6 sm:pl-16 md:pl-20 md:pr-8">
              <div
                className="pointer-events-none absolute inset-y-0 left-0 w-12 overflow-hidden sm:w-14 md:w-16"
                aria-hidden
              >
                <UtensilsCrossed
                  className="absolute right-0 top-1/2 h-28 w-28 -translate-y-1/2 text-teal-800/35 sm:h-32 sm:w-32 md:h-36 md:w-36"
                  strokeWidth={1.25}
                />
              </div>
              <h2 className="relative z-10 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                Flux du repas
                {levelLabel ? (
                  <span className="block text-lg font-semibold text-teal-800 sm:text-xl lg:text-2xl">
                    {levelLabel}
                  </span>
                ) : null}
              </h2>
            </div>

            <div
              className="hidden w-px shrink-0 self-stretch bg-yellow-400/80 md:block"
              aria-hidden
            />
            <div className="h-px w-full shrink-0 bg-yellow-400/80 md:hidden" aria-hidden />

            <div className="min-w-0 space-y-2 px-6 py-5 md:flex-1 md:pl-6 md:pr-0">
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                Déjeuner
                {levelLabel ? ` ${levelLabel.toLowerCase()}` : ""} sur les{" "}
                {days} derniers jours — présents, assiettes servies, RAB et
                refus jour par jour.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                <strong className="font-semibold text-foreground">Présents</strong> →{" "}
                <strong className="font-semibold text-foreground">servis</strong> →{" "}
                <strong className="font-semibold text-foreground">RAB</strong> /{" "}
                <strong className="font-semibold text-foreground">refus</strong> : le
                parcours du repas en un coup d&apos;œil.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                <strong className="font-semibold text-foreground">En résumé :</strong>{" "}
                utile pour voir si l&apos;écart présents / servis se creuse, ou si
                RAB et refus montent un jour donné.
              </p>
            </div>
          </div>
        </header>

        {!hasData ? (
          <p className="mt-5 px-6 text-sm text-muted-foreground">
            Pas encore de compteurs saisis sur la période — ouvrez un service et
            renseignez présents / servis / RAB / refus pour voir le flux ici.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className={cantinePlusChartPlotClass}>
            <ComposedChart
              data={series}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={40}
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
              <Line
                type="monotone"
                dataKey="present"
                stroke="var(--color-present)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "var(--color-present)" }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="served"
                stroke="var(--color-served)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "var(--color-served)" }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="rab"
                stroke="var(--color-rab)"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={{ r: 2.5, fill: "var(--color-rab)" }}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="refused"
                stroke="var(--color-refused)"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={{ r: 2.5, fill: "var(--color-refused)" }}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
