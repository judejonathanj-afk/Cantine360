"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  buildLevelComparisonBars,
  levelComparisonHasData,
  type LevelMealTotals,
} from "@/lib/buildLevelComparisonSeries";
import type { SchoolLevel } from "@/lib/schoolLevel";

const chartConfig = {
  maternelle: {
    label: "Maternelle",
    color: "#3b82f6",
  },
  primaire: {
    label: "Primaire",
    color: "#10b981",
  },
} satisfies ChartConfig;

type Props = {
  days: 7 | 30;
  byLevel: Record<SchoolLevel, LevelMealTotals>;
};

export function LevelComparisonChart({ days, byLevel }: Props) {
  const series = useMemo(() => buildLevelComparisonBars(byLevel), [byLevel]);
  const hasData = levelComparisonHasData(byLevel);

  return (
    <Card className="overflow-hidden border-2 border-sky-500 bg-card/50 pb-6 pt-0 shadow-sm shadow-sky-500/10 backdrop-blur-sm">
      <CardContent className="p-0">
        <header className="border-b-2 border-sky-500">
          <div className="flex flex-col md:flex-row md:items-stretch md:gap-0">
            <div className="relative flex shrink-0 items-center self-stretch overflow-hidden bg-sky-100 py-5 pl-14 pr-6 sm:pl-16 md:pl-20 md:pr-8">
              <div
                className="pointer-events-none absolute inset-y-0 left-0 w-12 overflow-hidden sm:w-14 md:w-16"
                aria-hidden
              >
                <GraduationCap
                  className="absolute right-0 top-1/2 h-28 w-28 -translate-y-1/2 text-sky-800/35 sm:h-32 sm:w-32 md:h-36 md:w-36"
                  strokeWidth={1.25}
                />
              </div>
              <h2 className="relative z-10 whitespace-nowrap text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                Maternelle / Primaire
              </h2>
            </div>

            <div
              className="hidden w-px shrink-0 self-stretch bg-sky-500/70 md:block"
              aria-hidden
            />
            <div className="h-px w-full shrink-0 bg-sky-500/70 md:hidden" aria-hidden />

            <div className="min-w-0 space-y-2 px-6 py-5 md:flex-1 md:pl-6 md:pr-0">
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                Déjeuner sur les {days} derniers jours — comparaison des deux
                cycles (indépendante du filtre niveau ci-dessus).
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                <strong className="font-semibold text-foreground">Barres</strong>{" "}
                = taux en % ·{" "}
                <strong className="font-semibold text-foreground">service</strong>{" "}
                = servis / présents ·{" "}
                <strong className="font-semibold text-foreground">RAB</strong> et{" "}
                <strong className="font-semibold text-foreground">refus</strong> =
                vs assiettes servies.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                <strong className="font-semibold text-foreground">En résumé :</strong>{" "}
                pour ajuster portions et menu par cycle, pas seulement à
                l&apos;échelle de l&apos;établissement.
              </p>
            </div>
          </div>
        </header>

        {!hasData ? (
          <p className="mt-5 px-6 text-sm text-muted-foreground">
            Pas encore de compteurs par classe sur la période — saisissez les
            présents / servis / RAB / refus pour comparer maternelle et primaire.
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mt-5 h-[min(22rem,50vw)] w-full min-h-[240px] aspect-auto px-6"
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
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="maternelle"
                fill="var(--color-maternelle)"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
              <Bar
                dataKey="primaire"
                fill="var(--color-primaire)"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
