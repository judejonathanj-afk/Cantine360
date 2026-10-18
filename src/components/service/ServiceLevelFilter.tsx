"use client";

import type { SchoolLevel } from "@/lib/schoolLevel";
import { schoolLevelLabelFr } from "@/lib/schoolLevel";

type LevelFilterCard = { level: SchoolLevel };

function levelButtonClass(active: boolean) {
  return [
    "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
    active
      ? "bg-zinc-900 text-white"
      : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50",
  ].join(" ");
}

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
    <div className="flex flex-wrap items-center gap-2">
      <span className="service-filter-label text-sm font-semibold text-zinc-700">
        Niveau :
      </span>
      <button
        type="button"
        disabled={primaireCount === 0}
        onClick={() => toggle("PRIMAIRE")}
        className={levelButtonClass(value === "PRIMAIRE")}
      >
        {schoolLevelLabelFr("PRIMAIRE")} ({primaireCount})
      </button>
      <button
        type="button"
        disabled={maternelleCount === 0}
        onClick={() => toggle("MATERNELLE")}
        className={levelButtonClass(value === "MATERNELLE")}
      >
        {schoolLevelLabelFr("MATERNELLE")} ({maternelleCount})
      </button>
    </div>
  );
}
