"use client";

import type { SchoolLevel } from "@/lib/schoolLevel";
import { schoolLevelLabelFr } from "@/lib/schoolLevel";
import { cn } from "@/lib/utils";

type LevelFilterCard = { level: SchoolLevel };

function SegmentButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "bg-[#0d7a45] text-white shadow-sm"
          : "text-zinc-900 hover:bg-zinc-100",
      )}
    >
      {children}
    </button>
  );
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

  return (
    <div
      role="group"
      aria-label="Niveau"
      className="inline-flex shrink-0 items-center rounded-full bg-white p-1 shadow-sm"
    >
      <SegmentButton active={value === "all"} onClick={() => onChange("all")}>
        Tous niveaux
      </SegmentButton>
      <SegmentButton
        active={value === "MATERNELLE"}
        disabled={maternelleCount === 0}
        onClick={() => onChange("MATERNELLE")}
      >
        {schoolLevelLabelFr("MATERNELLE")}
      </SegmentButton>
      <SegmentButton
        active={value === "PRIMAIRE"}
        disabled={primaireCount === 0}
        onClick={() => onChange("PRIMAIRE")}
      >
        {schoolLevelLabelFr("PRIMAIRE")}
      </SegmentButton>
    </div>
  );
}
