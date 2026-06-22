"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

const SUN_YELLOW = "#FFCC33";

const RAYS = Array.from({ length: 11 }, (_, i) => {
  const angle = ((i * 360) / 11 - 90) * (Math.PI / 180);
  const inner = 13.5 + (i % 3) * 0.35;
  const outer = 22 + (i % 2) * 0.8;
  const cx = 32;
  const cy = 32;
  return {
    x1: cx + inner * Math.cos(angle),
    y1: cy + inner * Math.sin(angle),
    x2: cx + outer * Math.cos(angle),
    y2: cy + outer * Math.sin(angle),
  };
});

/** Soleil jaune style dessin enfant — cercle + 11 rayons, effet crayon. */
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
          x="-15%"
          y="-15%"
          width="130%"
          height="130%"
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
          d="M32 18.8 C41 17.8 48.2 24.5 47.5 32.8 C46.8 41.2 39.5 47.5 32 47.2 C24.2 46.8 17.5 40.5 18 32.2 C18.5 24.2 24.8 18.5 32 18.8 Z"
          fill={SUN_YELLOW}
        />
      </g>
    </svg>
  );
}
