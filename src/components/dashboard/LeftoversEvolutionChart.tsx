"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  Bar,
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
import { Card, CardContent } from "@/components/ui/card";
import {
  buildLeftoversEvolutionSeries,
  type PerDayRowInput,
} from "@/lib/buildLeftoversEvolutionSeries";

const chartConfig = {
  leftovers: {
    label: "Restes (déjeuner)",
    color: "#f59e0b",
  },
  ratioPct: {
    label: "% / 100 assiettes",
    color: "#d97706",
  },
} satisfies ChartConfig;

type Props = {
  days: 7 | 30;
  perDayRows: PerDayRowInput[];
};

export function LeftoversEvolutionChart({ days, perDayRows }: Props) {
  const series = useMemo(
    () => buildLeftoversEvolutionSeries(perDayRows),
    [perDayRows],
  );

  const useBars = days === 7;

  return (
    <Card className="overflow-hidden border-2 border-amber-400 bg-card/50 pb-6 pt-0 shadow-sm shadow-amber-400/10 backdrop-blur-sm">
      <CardContent className="p-0">
        <header className="border-b-2 border-amber-400">
          <div className="flex flex-col md:flex-row md:items-stretch md:gap-0">
            <div className="flex shrink-0 items-center self-stretch bg-pink-200 px-6 py-5 md:w-[11rem] md:px-5 lg:w-[13rem]">
              <h2 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                Évolution des restes
              </h2>
            </div>

            <div
              className="hidden w-px shrink-0 self-stretch bg-amber-400/70 md:block"
              aria-hidden
            />
            <div className="h-px w-full shrink-0 bg-amber-400/70 md:hidden" aria-hidden />

            <div className="min-w-0 space-y-2 px-6 py-5 md:flex-1 md:pl-6 md:pr-0">
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                Déjeuner sur les {days} derniers jours — restes par jour
                (barres sur 7 jours, courbes sur 30) et taux pour 100 assiettes
                servies en pointillés, comme sur la carte Cantine +.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                <strong className="font-semibold text-foreground">Barres</strong> = nombre de
                restes ·{" "}
                <strong className="font-semibold text-foreground">courbe en %</strong> = restes pour
                100 assiettes servies (pas le nombre d&apos;assiettes).
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                <strong className="font-semibold text-foreground">En résumé :</strong>{" "}
                c&apos;est la courbe dans le temps — utile pour repérer{" "}
                <strong className="font-semibold text-foreground">
                  « quel jour ça a augmenté ? »
                </strong>{" "}
                (menu, affluence, classe, etc.).
              </p>
            </div>
          </div>
        </header>

        {series.length === 0 ? (
          <p className="mt-5 px-6 text-sm text-muted-foreground">
            Pas assez de données sur la période pour afficher l&apos;évolution.
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mt-5 h-[min(22rem,50vw)] w-full min-h-[240px] aspect-auto px-6"
          >
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
                yAxisId="count"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={36}
              />
              <YAxis
                yAxisId="pct"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
                width={40}
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
                  />
                )}
              />
              <ChartLegend content={<ChartLegendContent />} />
              {useBars ? (
                <Bar
                  yAxisId="count"
                  dataKey="leftovers"
                  fill="var(--color-leftovers)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
              ) : (
                <Line
                  yAxisId="count"
                  type="monotone"
                  dataKey="leftovers"
                  stroke="var(--color-leftovers)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--color-leftovers)" }}
                  activeDot={{ r: 5 }}
                />
              )}
              <Line
                yAxisId="pct"
                type="monotone"
                dataKey="ratioPct"
                stroke="var(--color-ratioPct)"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
                connectNulls
              />
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
