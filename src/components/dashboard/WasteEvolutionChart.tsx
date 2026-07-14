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
  buildWasteEvolutionSeries,
  type WastePerDayRowInput,
} from "@/lib/buildWasteEvolutionSeries";

const chartConfig = {
  wasteWeightG: {
    label: "Déchets (déjeuner)",
    color: "#10b981",
  },
  gramsPer100Served: {
    label: "g / 100 assiettes",
    color: "#059669",
  },
} satisfies ChartConfig;

type Props = {
  days: 7 | 30;
  perDayRows: WastePerDayRowInput[];
};

export function WasteEvolutionChart({ days, perDayRows }: Props) {
  const series = useMemo(
    () => buildWasteEvolutionSeries(perDayRows),
    [perDayRows],
  );

  const useBars = days === 7;
  const hasWasteData = series.some((p) => p.wasteWeightG > 0);

  return (
    <Card className="overflow-hidden border-2 border-emerald-500 bg-card/50 pb-6 pt-0 shadow-sm shadow-emerald-500/10 backdrop-blur-sm">
      <CardContent className="p-0">
        <header className="border-b-2 border-emerald-500">
          <div className="flex flex-col md:flex-row md:items-stretch md:gap-0">
            <div className="flex shrink-0 items-center self-stretch bg-emerald-100 px-6 py-5 md:w-[11rem] md:px-5 lg:w-[13rem]">
              <h2 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                Évolution des déchets
              </h2>
            </div>

            <div
              className="hidden w-px shrink-0 self-stretch bg-emerald-500/70 md:block"
              aria-hidden
            />
            <div className="h-px w-full shrink-0 bg-emerald-500/70 md:hidden" aria-hidden />

            <div className="min-w-0 space-y-2 px-6 py-5 md:flex-1 md:pl-6 md:pr-0">
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                Déjeuner sur les {days} derniers jours — poids des déchets par jour
                (barres sur 7 jours, courbes sur 30) et grammes pour 100 assiettes servies en
                pointillés.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                <strong className="font-semibold text-foreground">Barres</strong> = poids total des
                déchets (g) ·{" "}
                <strong className="font-semibold text-foreground">courbe en g</strong> = déchets
                pour 100 assiettes servies (pas le nombre d&apos;assiettes).
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                <strong className="font-semibold text-foreground">En résumé :</strong>{" "}
                c&apos;est la courbe dans le temps — utile pour repérer{" "}
                <strong className="font-semibold text-foreground">
                  « quel jour les déchets ont augmenté ? »
                </strong>{" "}
                (menu, affluence, préparation, etc.).
              </p>
            </div>
          </div>
        </header>

        {series.length === 0 || !hasWasteData ? (
          <p className="mt-5 px-6 text-sm text-muted-foreground">
            Pas encore de poids déchets saisi sur la période — renseignez-le en fin de service
            pour voir l&apos;évolution ici.
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
                yAxisId="grams"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={44}
                tickFormatter={(v) => `${v} g`}
              />
              <YAxis
                yAxisId="ratio"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v} g`}
                width={44}
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
                  yAxisId="grams"
                  dataKey="wasteWeightG"
                  fill="var(--color-wasteWeightG)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
              ) : (
                <Line
                  yAxisId="grams"
                  type="monotone"
                  dataKey="wasteWeightG"
                  stroke="var(--color-wasteWeightG)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--color-wasteWeightG)" }}
                  activeDot={{ r: 5 }}
                />
              )}
              <Line
                yAxisId="ratio"
                type="monotone"
                dataKey="gramsPer100Served"
                stroke="var(--color-gramsPer100Served)"
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
