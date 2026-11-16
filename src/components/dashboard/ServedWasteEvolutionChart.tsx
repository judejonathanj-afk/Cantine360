"use client";

import {
  Bar,
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
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export const servedWasteChartConfig = {
  served: { label: "Servis", color: "#2dd4bf" },
  wasteWeightG: { label: "Déchets (g)", color: "#eab308" },
  gramsPer100Waste: { label: "g déchets / 100 assiettes", color: "#a3e635" },
} satisfies ChartConfig;

export type ServedWastePoint = {
  label: string;
  served: number;
  wasteWeightG: number;
  gramsPer100Waste: number | null;
};

export function ServedWasteChartLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-2 text-sm font-semibold text-black">
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

export function ServedWasteEvolutionChart({
  series,
  className,
}: {
  series: ServedWastePoint[];
  className?: string;
}) {
  return (
    <div className="space-y-2">
      <ChartContainer
        config={servedWasteChartConfig}
        className={cn(
          "aspect-auto h-[min(22rem,48vw)] w-full min-h-[220px] [&_.recharts-cartesian-axis-tick_text]:!fill-black [&_.recharts-cartesian-axis-tick_text]:font-semibold [&_.y-axis-grams_.recharts-cartesian-axis-tick_text]:!fill-[#eab308]",
          className,
        )}
      >
        <ComposedChart data={series} margin={{ top: 16, right: 12, left: 4, bottom: 8 }}>
          <CartesianGrid vertical={false} stroke="rgba(24,24,27,0.08)" strokeDasharray="4 4" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={16}
            tick={{ fill: "#000000", fontSize: 13, fontWeight: 600 }}
          />
          <YAxis
            yAxisId="count"
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={32}
            tick={{ fill: "#000000", fontSize: 13, fontWeight: 600 }}
          />
          <YAxis
            yAxisId="pct"
            orientation="right"
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
            width={58}
            domain={[0, "auto"]}
            tick={{ fill: "#000000", fontSize: 13, fontWeight: 600 }}
          />
          <YAxis
            yAxisId="waste"
            className="y-axis-grams"
            orientation="right"
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${Math.round(v)} g`}
            width={72}
            domain={[0, "auto"]}
            tick={{ fill: "#eab308", fontSize: 13, fontWeight: 600 }}
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
      <ServedWasteChartLegend />
    </div>
  );
}
