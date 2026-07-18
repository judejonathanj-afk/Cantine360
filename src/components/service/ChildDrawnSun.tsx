"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

const SUN_YELLOW = "#FFCC33";
const CLOUD_FILL = "#E8EEF5";
const CLOUD_STROKE = "#C5D0DE";

const RAYS = Array.from({ length: 11 }, (_, i) => {
  const angle = ((i * 360) / 11 - 90) * (Math.PI / 180);
  const inner = 13.5 + (i % 3) * 0.35;
  const outer = 22 + (i % 2) * 0.8;
  const cx = 34;
  const cy = 28;
  return {
    x1: cx + inner * Math.cos(angle),
    y1: cy + inner * Math.sin(angle),
    x2: cx + outer * Math.cos(angle),
    y2: cy + outer * Math.sin(angle),
  };
});

/** Soleil jaune style dessin enfant, avec nuage en arrière-plan. */
export function ChildDrawnSun({ className }: { className?: string }) {
  const filterId = useId().replace(/:/g, "");

  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <filter
          id={filterId}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" result="noise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="1.4"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      <g filter={`url(#${filterId})`}>
        {/* Nuage derrière le soleil */}
        <g>
          <ellipse cx="22" cy="42" rx="14" ry="9" fill={CLOUD_FILL} stroke={CLOUD_STROKE} strokeWidth="1.2" />
          <ellipse cx="34" cy="40" rx="16" ry="10" fill={CLOUD_FILL} stroke={CLOUD_STROKE} strokeWidth="1.2" />
          <ellipse cx="46" cy="43" rx="12" ry="8" fill={CLOUD_FILL} stroke={CLOUD_STROKE} strokeWidth="1.2" />
          <ellipse cx="28" cy="36" rx="10" ry="8" fill={CLOUD_FILL} />
          <ellipse cx="40" cy="35" rx="11" ry="9" fill={CLOUD_FILL} />
        </g>
        {RAYS.map((ray, i) => (
          <line
            key={i}
            x1={ray.x1}
            y1={ray.y1}
            x2={ray.x2}
            y2={ray.y2}
            stroke={SUN_YELLOW}
            strokeWidth="5"
            strokeLinecap="round"
          />
        ))}
        <path
          d="M34 14.8 C43 13.8 50.2 20.5 49.5 28.8 C48.8 37.2 41.5 43.5 34 43.2 C26.2 42.8 19.5 36.5 20 28.2 C20.5 20.2 26.8 14.5 34 14.8 Z"
          fill={SUN_YELLOW}
        />
      </g>
    </svg>
  );
}
