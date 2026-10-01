"use client";

import { useMemo, useRef, useState } from "react";
import { LineChart } from "lucide-react";
import { fmt, formatDayLabelFr } from "./antiWasteFormat";

const W = 820;
const H = 360;

/** Largeur de marge (unités du viewBox) pour que le libellé tienne dans la fenêtre. */
function sidePad(label: string) {
  const widthChars = [...label].reduce(
    (n, ch) => n + (ch === "\u202f" || ch === "\u00a0" || ch === " " ? 0.45 : 1),
    0,
  );
  const px = widthChars * 8 + 12;
  return Math.round(Math.min(190, Math.max(72, px * 2.2)));
}

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
    const pad = {
      top: 28,
      bottom: 44,
      left: sidePad(fmt(Math.round(maxWaste))),
      right: sidePad(fmt(Math.round(maxG100))),
    };
    const innerW = W - pad.left - pad.right;
    const innerH = H - pad.top - pad.bottom;
    const x = (i: number) =>
      pad.left + (data.length <= 1 ? 0 : (i / (data.length - 1)) * innerW);
    const yWaste = (v: number) => pad.top + innerH - (v / maxWaste) * innerH;
    const yG100 = (v: number) => pad.top + innerH - (v / maxG100) * innerH;

    const wastePts = data.map((d, i) => ({ x: x(i), y: yWaste(d.waste) }));
    const g100Pts = data.map((d, i) => ({ x: x(i), y: yG100(d.g100) }));

    return { data, maxWaste, maxG100, innerH, pad, x, wastePts, g100Pts };
  }, [points]);

  const wasteLine = smoothPath(geo.wastePts);
  const wasteArea =
    geo.wastePts.length >= 2
      ? `${wasteLine} L ${geo.wastePts.at(-1)!.x},${H - geo.pad.bottom} L ${geo.wastePts[0]!.x},${H - geo.pad.bottom} Z`
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
    <div className="aw-reveal flex h-full flex-col overflow-hidden rounded-3xl border-2 border-emerald-600 bg-card">
      <div className="flex items-start gap-3 border-b border-emerald-300 bg-emerald-100 p-6">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
          <LineChart className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-bold tracking-tight text-zinc-950">
            Évolution des déchets
          </h2>
          <p className="mt-1 text-base font-medium leading-snug text-zinc-800">
            Poids des déchets par jour et grammes pour 100 assiettes servies —
            pour repérer quel jour ça augmente ({days} jours).
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-b border-emerald-100 px-4 py-3 text-base">
        <Legend
          color="var(--aw-primary)"
          label="Déchets (g) — chiffres à gauche"
        />
        <Legend
          color="var(--aw-amber)"
          label="g / 100 assiettes — chiffres à droite"
          dashed
        />
      </div>

      {geo.data.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-muted-foreground">
          Pas encore de données sur la période.
        </p>
      ) : (
        <div className="relative w-full px-2 pb-3 pt-2">
          <div className="relative h-56 w-full sm:h-64">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full touch-none"
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
              const y = geo.pad.top + geo.innerH * (1 - t);
              return (
                <g key={t}>
                  <line
                    x1={geo.pad.left}
                    x2={W - geo.pad.right}
                    y1={y}
                    y2={y}
                    stroke="var(--border)"
                    strokeDasharray="2 6"
                  />
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
                y1={geo.pad.top}
                y2={H - geo.pad.bottom}
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

          </svg>

          {yTicks.map((t) => {
            const y = geo.pad.top + geo.innerH * (1 - t);
            return (
              <span key={t}>
                <span
                  className="pointer-events-none absolute -translate-x-full -translate-y-1/2 whitespace-nowrap pr-1.5 text-xs font-semibold tabular-nums leading-none text-zinc-950"
                  style={{
                    left: `${(geo.pad.left / W) * 100}%`,
                    top: `${(y / H) * 100}%`,
                  }}
                >
                  {fmt(Math.round(geo.maxWaste * t))}
                </span>
                <span
                  className="pointer-events-none absolute -translate-y-1/2 whitespace-nowrap pl-1.5 text-xs font-semibold tabular-nums leading-none text-zinc-950"
                  style={{
                    left: `${((W - geo.pad.right) / W) * 100}%`,
                    top: `${(y / H) * 100}%`,
                  }}
                >
                  {fmt(Math.round(geo.maxG100 * t))}
                </span>
              </span>
            );
          })}

          {geo.data.map((d, i) =>
            i % 2 === 0 ? (
              <span
                key={i}
                className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap text-xs font-semibold leading-none text-zinc-950"
                style={{
                  left: `${(geo.x(i) / W) * 100}%`,
                  top: `${((H - geo.pad.bottom + 18) / H) * 100}%`,
                }}
              >
                {d.label}
              </span>
            ) : null,
          )}

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
    <span className="flex items-center gap-2 font-semibold text-zinc-950">
      <span
        className="h-1 w-8 shrink-0 rounded-full"
        style={{
          background: dashed
            ? `repeating-linear-gradient(90deg, ${color} 0 6px, transparent 6px 10px)`
            : color,
        }}
      />
      {label}
    </span>
  );
}
