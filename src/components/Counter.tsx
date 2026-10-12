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
  /** Fond vert (primaire) ou bleu (maternelle) derrière les boutons + chiffre. */
  level?: SchoolLevel;
};

export function Counter({
  label,
  value,
  onChange,
  min = 0,
  max,
  className,
  level,
}: Props) {
  const clamp = (n: number) => {
    const lower = Math.max(min, n);
    return max == null ? lower : Math.min(max, lower);
  };

  const dec = () => onChange(clamp(value - 1));
  const inc = () => onChange(clamp(value + 1));

  return (
    <div
      className={[
        "rounded-2xl border-2 bg-white p-4",
        className ?? "border-zinc-200",
      ].join(" ")}
    >
      <div className="text-base font-semibold leading-snug text-black sm:text-lg">
        {label}
      </div>
      <div
        className={cn(
          "mt-3 flex items-center justify-between gap-4 rounded-xl px-2 py-2",
          !level && "px-0 py-0",
        )}
        style={level ? { backgroundColor: LEVEL_CARD_COLORS[level] } : undefined}
      >
        <button
          type="button"
          onClick={dec}
          className="h-12 w-12 rounded-2xl border border-zinc-300 bg-white/90 text-xl font-semibold hover:bg-white"
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
          className="w-28 rounded-xl border border-zinc-300/80 bg-white px-3 py-3 text-center text-xl font-semibold outline-none focus:border-zinc-900"
        />

        <button
          type="button"
          onClick={inc}
          className="h-12 w-12 rounded-2xl bg-zinc-900 text-xl font-semibold text-white hover:bg-zinc-800"
          aria-label={`${label} +1`}
        >
          +
        </button>
      </div>
    </div>
  );
}
