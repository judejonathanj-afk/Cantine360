"use client";

import type { SchoolLevel } from "@/lib/schoolLevel";
import { schoolLevelLabelFr } from "@/lib/schoolLevel";

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
  const maternelleCount = cards.filter((c) => c.level === "MATERNELLE").length;
  const primaireCount = cards.filter((c) => c.level === "PRIMAIRE").length;

  if (maternelleCount === 0 || primaireCount === 0) return null;

  const options: { key: "all" | SchoolLevel; label: string; count: number }[] = [
    { key: "all", label: "Tous", count: cards.length },
    { key: "MATERNELLE", label: schoolLevelLabelFr("MATERNELLE"), count: maternelleCount },
    { key: "PRIMAIRE", label: schoolLevelLabelFr("PRIMAIRE"), count: primaireCount },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-zinc-700">Niveau :</span>
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={[
              "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
              active
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50",
            ].join(" ")}
          >
            {opt.label} ({opt.count})
          </button>
        );
      })}
    </div>
  );
}
