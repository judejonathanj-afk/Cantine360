"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { Recycle, Scale, Target } from "lucide-react";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardDayDetailRow } from "@/lib/buildDashboardDayDetailRows";
import { cn } from "@/lib/utils";

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

      <section className="relative overflow-hidden rounded-[28px] bg-[#e7f8ee] p-5 shadow-[0_12px_28px_-18px_rgba(24,24,27,0.18)] min-h-[220px]">
        <div className="relative z-10 max-w-[16rem] sm:max-w-[58%]">
          <h2 className="font-display text-lg font-extrabold tracking-tight text-emerald-800">
            Nos engagements
          </h2>
          <p className="mt-1 text-sm font-semibold leading-snug text-emerald-900/80">
            Moins de gaspillage alimentaire, plus de plaisir dans l&apos;assiette&nbsp;!
          </p>
          <ul className="mt-4 space-y-3">
            <EngagementItem icon={Recycle} label="Réduire le gaspillage" />
            <EngagementItem icon={Scale} label="Adapter les portions" />
            <EngagementItem icon={Target} label="Mesurer pour progresser" />
          </ul>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/login-buffet-salade.jpg"
          alt=""
          className="pointer-events-none absolute -bottom-6 -right-8 h-[78%] w-auto max-w-[58%] rounded-[24px] object-cover shadow-md ring-4 ring-white/70"
        />
      </section>
    </div>
  );
}

function EngagementItem({
  icon: Icon,
  label,
}: {
  icon: typeof Recycle;
  label: string;
}) {
  return (
    <li className="flex items-center gap-2.5 text-sm font-bold text-emerald-950">
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm",
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      {label}
    </li>
  );
}
