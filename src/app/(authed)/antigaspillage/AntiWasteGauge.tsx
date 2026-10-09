"use client";

import { useEffect, useState } from "react";
import { fmt1, type GaugeStatus } from "./antiWasteFormat";

const COLOR: Record<GaugeStatus, string> = {
  green: "var(--aw-primary)",
  amber: "var(--aw-amber)",
  red: "var(--aw-coral)",
  none: "var(--aw-primary)",
};

export function AntiWasteGauge({
  value,
  objective,
  status,
  emptyLabel = "—",
}: {
  value: number | null;
  objective: number | null;
  status: GaugeStatus;
  /** Affiché au centre quand aucune pesée sur la période. */
  emptyLabel?: string;
}) {
  const numericValue = value ?? 0;
  const showEmpty = value == null || value <= 0;
  const cx = 140;
  const cy = 140;
  const r = 118;
  const len = Math.PI * r;

  const scaleMax = objective
    ? objective * 2
    : Math.max(numericValue * 1.25, 100);
  const frac = showEmpty
    ? 0
    : Math.min(Math.max(numericValue / scaleMax, 0), 1);

  const objFrac = objective ? Math.min(objective / scaleMax, 1) : null;
  const point = (f: number) => ({
    x: cx - r * Math.cos(Math.PI * f),
    y: cy - r * Math.sin(Math.PI * f),
  });
  const objPoint = objFrac != null ? point(objFrac) : null;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const arcPath = `M ${cx - r},${cy} A ${r},${r} 0 0 1 ${cx + r},${cy}`;
  const color = COLOR[status];

  return (
    <div className="relative w-full max-w-[280px]">
      <svg
        viewBox="0 0 280 172"
        className="w-full"
        role="img"
        aria-label={
          showEmpty
            ? "Pas encore de pesée sur la période"
            : `${fmt1(numericValue)} grammes pour 100 assiettes`
        }
      >
        <defs>
          <linearGradient id="awGaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.55" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>

        <path
          d={arcPath}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="18"
          strokeLinecap="round"
        />

        <path
          d={arcPath}
          fill="none"
          stroke="url(#awGaugeGrad)"
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={mounted ? len * (1 - frac) : len}
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)",
          }}
        />

        {objPoint ? (
          <g>
            <circle cx={objPoint.x} cy={objPoint.y} r="10" fill="var(--card)" />
            <circle
              cx={objPoint.x}
              cy={objPoint.y}
              r="6"
              fill="var(--foreground)"
            />
          </g>
        ) : null}
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span
          className="font-display text-4xl font-bold leading-none tracking-tight"
          style={{ color }}
        >
          {showEmpty ? emptyLabel : fmt1(numericValue)}
        </span>
        <span className="mt-1 text-sm font-bold uppercase tracking-wider text-zinc-950">
          {showEmpty ? "en attente de pesée" : "g / 100 assiettes"}
        </span>
      </div>
    </div>
  );
}
