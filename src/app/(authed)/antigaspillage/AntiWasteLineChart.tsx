"use client";

import { useMemo, useRef, useState } from "react";
import { LineChart } from "lucide-react";
import { fmt, formatDayLabelFr } from "./antiWasteFormat";

const W = 820;
const H = 360;
const PAD = { top: 28, right: 56, bottom: 40, left: 56 };

type ChartPoint = {
  date: string;
  waste: number;
  g100: number;
};

function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0]!.x},${pts[0]!.y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export function AntiWasteLineChart({
  days,
  points,
}: {
  days: 7 | 30;
  points: ChartPoint[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const geo = useMemo(() => {
    const data = points.map((p) => ({
      label: formatDayLabelFr(p.date),
      waste: p.waste,
      g100: p.g100,
    }));
    const maxWaste = Math.max(...data.map((d) => d.waste), 1);
    const maxG100 = Math.max(...data.map((d) => d.g100), 1);
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const x = (i: number) =>
      PAD.left + (data.length <= 1 ? 0 : (i / (data.length - 1)) * innerW);
    const yWaste = (v: number) => PAD.top + innerH - (v / maxWaste) * innerH;
    const yG100 = (v: number) => PAD.top + innerH - (v / maxG100) * innerH;

    const wastePts = data.map((d, i) => ({ x: x(i), y: yWaste(d.waste) }));
    const g100Pts = data.map((d, i) => ({ x: x(i), y: yG100(d.g100) }));

    return { data, maxWaste, maxG100, innerH, x, wastePts, g100Pts };
  }, [points]);

  const wasteLine = smoothPath(geo.wastePts);
  const wasteArea =
    geo.wastePts.length >= 2
      ? `${wasteLine} L ${geo.wastePts.at(-1)!.x},${H - PAD.bottom} L ${geo.wastePts[0]!.x},${H - PAD.bottom} Z`
      : "";
  const g100Line = smoothPath(geo.g100Pts);
  const perimeter = 2600;
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!svgRef.current || geo.data.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestD = Infinity;
    geo.data.forEach((_, i) => {
      const d = Math.abs(geo.x(i) - px);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    setHover(best);
  }

  return (
    <div className="aw-reveal flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card">
      <div className="flex items-start gap-3 border-b border-border p-6">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
          <LineChart className="size-5" aria-hidden />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-lg font-bold tracking-tight">
            Évolution des déchets
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Poids des déchets par jour et grammes pour 100 assiettes servies —
            pour repérer quel jour ça augmente ({days} jours).
          </p>
        </div>
        <div className="hidden items-center gap-4 text-xs sm:flex">
          <Legend color="var(--aw-primary)" label="Déchets (g)" />
          <Legend color="var(--aw-amber)" label="g / 100" dashed />
        </div>
      </div>

      {geo.data.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-muted-foreground">
          Pas encore de données sur la période.
        </p>
      ) : (
        <div className="relative flex-1 p-2">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full touch-none"
            onPointerMove={handleMove}
            onPointerLeave={() => setHover(null)}
            role="img"
            aria-label="Graphique de l'évolution des déchets sur la période"
          >
            <defs>
              <linearGradient id="awWasteFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--aw-primary)"
                  stopOpacity="0.28"
                />
                <stop
                  offset="100%"
                  stopColor="var(--aw-primary)"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            {yTicks.map((t) => {
              const y = PAD.top + geo.innerH * (1 - t);
              return (
                <g key={t}>
                  <line
                    x1={PAD.left}
                    x2={W - PAD.right}
                    y1={y}
                    y2={y}
                    stroke="var(--border)"
                    strokeDasharray="2 6"
                  />
                  <text
                    x={PAD.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-muted-foreground"
                    fontSize="11"
                  >
                    {fmt(Math.round(geo.maxWaste * t))}
                  </text>
                  <text
                    x={W - PAD.right + 10}
                    y={y + 4}
                    textAnchor="start"
                    className="fill-muted-foreground"
                    fontSize="11"
                  >
                    {fmt(Math.round(geo.maxG100 * t))}
                  </text>
                </g>
              );
            })}

            {wasteArea ? <path d={wasteArea} fill="url(#awWasteFill)" /> : null}
            {wasteLine ? (
              <path
                d={wasteLine}
                fill="none"
                stroke="var(--aw-primary)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={perimeter}
                strokeDashoffset={perimeter}
                className="aw-draw-line"
              />
            ) : null}

            {g100Line ? (
              <path
                d={g100Line}
                fill="none"
                stroke="var(--aw-amber)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="6 6"
                opacity="0.9"
              />
            ) : null}

            {hover != null ? (
              <line
                x1={geo.x(hover)}
                x2={geo.x(hover)}
                y1={PAD.top}
                y2={H - PAD.bottom}
                stroke="var(--foreground)"
                strokeOpacity="0.25"
              />
            ) : null}

            {geo.wastePts.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={hover === i ? 6 : 3.5}
                fill="var(--card)"
                stroke="var(--aw-primary)"
                strokeWidth="2.5"
                className="transition-all"
              />
            ))}

            {geo.data.map((d, i) =>
              i % 2 === 0 ? (
                <text
                  key={i}
                  x={geo.x(i)}
                  y={H - PAD.bottom + 22}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  fontSize="11"
                >
                  {d.label}
                </text>
              ) : null,
            )}
          </svg>

          {hover != null && geo.data[hover] ? (
            <div
              className="pointer-events-none absolute -translate-x-1/2 rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-lg"
              style={{
                left: `${(geo.x(hover) / W) * 100}%`,
                top: 12,
              }}
            >
              <p className="font-semibold text-popover-foreground">
                {geo.data[hover]!.label}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2 rounded-full bg-primary" />
                {fmt(geo.data[hover]!.waste)} g de déchets
              </p>
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className="size-2 rounded-full"
                  style={{ background: "var(--aw-amber)" }}
                />
                {fmt(geo.data[hover]!.g100)} g / 100
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function Legend({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="flex items-center gap-2 text-muted-foreground">
      <span
        className="h-0.5 w-5 rounded-full"
        style={{
          background: dashed
            ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 7px)`
            : color,
        }}
      />
      {label}
    </span>
  );
}
