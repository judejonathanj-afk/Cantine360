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
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Évolution des restes
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Déjeuner sur les {days} derniers jours — restes par jour
            (barres sur 7 jours, courbes sur 30) et taux pour 100 assiettes
            servies en pointillés, comme sur la carte Cantine Pulse.
          </p>
        </div>
        {series.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Pas assez de données sur la période pour afficher l&apos;évolution.
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mt-6 h-[min(22rem,50vw)] w-full min-h-[240px] aspect-auto"
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
