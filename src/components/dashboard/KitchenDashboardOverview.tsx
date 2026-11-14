"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { NosEngagementsCard } from "@/components/dashboard/NosEngagementsCard";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardDayDetailRow } from "@/lib/buildDashboardDayDetailRows";

const chartConfig = {
  wasteKg: { label: "Déchets (kg)", color: "#f4c44a" },
  rab: { label: "RAB", color: "#3d9a5f" },
  refused: { label: "Refus", color: "#f0a04a" },
} satisfies ChartConfig;

function formatDayLabel(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(d);
}

export function KitchenDashboardOverview({
  days,
  perDayRows,
}: {
  days: 7 | 30;
  perDayRows: DashboardDayDetailRow[];
}) {
  const series = useMemo(
    () =>
      perDayRows.map((row) => ({
        label: formatDayLabel(row.date),
        wasteKg: Math.round((row.wasteWeightG / 1000) * 10) / 10,
        rab: row.rab,
        refused: row.refused,
      })),
    [perDayRows],
  );
  const hasData = series.some(
    (row) => row.wasteKg > 0 || row.rab > 0 || row.refused > 0,
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(17rem,0.85fr)]">
      <section className="rounded-[28px] bg-white p-5 shadow-[0_12px_28px_-18px_rgba(24,24,27,0.22)] ring-1 ring-zinc-100">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-extrabold tracking-tight text-zinc-950">
              Évolution des déchets
            </h2>
            <p className="text-sm font-medium text-zinc-500">
              Sur les {days} derniers jours
            </p>
          </div>
        </div>
        {!hasData ? (
          <p className="py-10 text-sm font-medium text-zinc-500">
            Pas encore de pesée ni de RAB / refus sur la période.
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[220px] w-full"
          >
            <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#eef2f0" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11, fill: "#71717a" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={36}
                tick={{ fontSize: 11, fill: "#71717a" }}
                allowDecimals={false}
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
              <Bar dataKey="wasteKg" fill="var(--color-wasteKg)" radius={[6, 6, 0, 0]} maxBarSize={14} />
              <Bar dataKey="rab" fill="var(--color-rab)" radius={[6, 6, 0, 0]} maxBarSize={14} />
              <Bar dataKey="refused" fill="var(--color-refused)" radius={[6, 6, 0, 0]} maxBarSize={14} />
            </BarChart>
          </ChartContainer>
        )}
      </section>

      <NosEngagementsCard />
    </div>
  );
}

