"use client";

import type { SchoolLevel } from "@/lib/schoolLevel";
import { LEVEL_CARD_COLORS } from "@/lib/schoolLevel";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  /** Si omis, pas de plafond (seule la borne min s’applique). */
  max?: number;
  className?: string;
  /** Fond de carte vert (primaire) ou bleu (maternelle) ; boutons et chiffre restent blancs. */
  level?: SchoolLevel;
  size?: "default" | "compact";
};

export function Counter({
  label,
  value,
  onChange,
  min = 0,
  max,
  className,
  level,
  size = "default",
}: Props) {
  const compact = size === "compact";
  const clamp = (n: number) => {
    const lower = Math.max(min, n);
    return max == null ? lower : Math.min(max, lower);
  };

  const dec = () => onChange(clamp(value - 1));
  const inc = () => onChange(clamp(value + 1));

  return (
    <div
      className={cn(
        compact
          ? "rounded-xl border border-zinc-200/80 bg-white p-2.5 shadow-sm"
          : "rounded-2xl border-2 p-4",
        !compact && (level ? "bg-transparent" : "bg-white"),
        className ?? (!compact ? "border-zinc-200" : undefined),
      )}
      style={!compact && level ? { backgroundColor: LEVEL_CARD_COLORS[level] } : undefined}
    >
      <div
        className={cn(
          "font-semibold leading-snug text-black",
          compact ? "text-base text-zinc-600" : "text-base sm:text-lg",
        )}
      >
        {label}
      </div>
      <div className={cn("flex items-center justify-between", compact ? "mt-1.5 gap-2" : "mt-3 gap-4")}>
        <button
          type="button"
          onClick={dec}
          className={cn(
            "border border-zinc-300 bg-white/90 font-semibold hover:bg-white",
            compact
              ? "h-10 w-10 rounded-xl text-lg"
              : "h-12 w-12 rounded-2xl text-xl",
          )}
          aria-label={`${label} -1`}
        >
          −
        </button>

        <input
          value={String(value)}
          onChange={(e) => {
            const n = Number(e.target.value.replace(/[^\d]/g, ""));
            if (Number.isFinite(n)) onChange(clamp(n));
            else onChange(min);
          }}
          inputMode="numeric"
          className={cn(
            "rounded-xl border border-zinc-300/80 bg-white text-center font-semibold outline-none focus:border-zinc-900",
            compact ? "w-[4.5rem] px-1.5 py-2 text-xl" : "w-28 px-3 py-3 text-xl",
          )}
        />

        <button
          type="button"
          onClick={inc}
          className={cn(
            "bg-zinc-900 font-semibold text-white hover:bg-zinc-800",
            compact
              ? "h-10 w-10 rounded-xl text-lg"
              : "h-12 w-12 rounded-2xl text-xl",
          )}
          aria-label={`${label} +1`}
        >
          +
        </button>
      </div>
    </div>
  );
}
