"use client";

import type { SchoolLevel } from "@/lib/schoolLevel";

type LevelFilterCard = { level: SchoolLevel };

export function ServiceLevelFilter({
  cards,
  value,
  onChange,
}: {
  cards: LevelFilterCard[];
  value: "all" | SchoolLevel;
  onChange: (level: "all" | SchoolLevel) => void;
}) {
  if (cards.length === 0) return null;

  const maternelleCount = cards.filter((c) => c.level === "MATERNELLE").length;
  const primaireCount = cards.filter((c) => c.level === "PRIMAIRE").length;

  function toggle(level: SchoolLevel) {
    onChange(value === level ? "all" : level);
  }

  return (
    <div className="flex justify-center gap-3">
      <button
        type="button"
        disabled={primaireCount === 0}
        onClick={() => toggle("PRIMAIRE")}
        className={[
          "min-w-[8.5rem] rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
          value === "PRIMAIRE"
            ? "bg-emerald-600 text-white shadow-sm"
            : "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300 hover:bg-emerald-200",
        ].join(" ")}
      >
        Primaire
      </button>
      <button
        type="button"
        disabled={maternelleCount === 0}
        onClick={() => toggle("MATERNELLE")}
        className={[
          "min-w-[8.5rem] rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
          value === "MATERNELLE"
            ? "bg-sky-600 text-white shadow-sm"
            : "bg-sky-100 text-sky-900 ring-1 ring-sky-300 hover:bg-sky-200",
        ].join(" ")}
      >
        Maternelle
      </button>
    </div>
  );
}
