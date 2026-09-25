"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { formatStudentKitchenName } from "@/lib/studentDisplayName";
import { LEVEL_CARD_COLORS } from "@/lib/schoolLevel";
import type { SchoolLevel } from "@/lib/schoolLevel";
import type { GroupAllergenSummary } from "@/server/serviceAllergenSummary";
import { cn } from "@/lib/utils";

export function ServiceDietStudentsPanel({
  groups,
  hasMenu,
  groupLevelById,
  className,
}: {
  groups: GroupAllergenSummary[];
  hasMenu: boolean;
  groupLevelById?: Record<string, SchoolLevel>;
  className?: string;
}) {
  const dietGroups = groups
    .map((g) => ({
      ...g,
      concerned: g.students.filter((s) => s.dietAffectedByMenu),
    }))
    .filter((g) => g.concerned.length > 0);

  const total = dietGroups.reduce((n, g) => n + g.concerned.length, 0);
  const [open, setOpen] = useState(false);

  if (!hasMenu || total === 0) return null;

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn("group mx-auto w-full max-w-xl", className)}
    >
      <div className="flex flex-col overflow-hidden rounded-2xl border-2 border-sky-500 bg-sky-50 shadow-md">
        <CollapsibleTrigger
          className={cn(
            "flex w-full shrink-0 flex-col px-4 outline-none hover:bg-sky-100/80",
            open ? "py-3.5" : "py-4",
          )}
        >
          <div className="relative flex items-center gap-3">
            <h2
              className={cn(
                "flex-1 text-center font-bold leading-snug text-sky-950",
                open ? "text-lg sm:text-xl" : "text-xl sm:text-2xl",
              )}
            >
              <span className="tabular-nums text-sky-700">{total}</span> Régimes à
              adapter
            </h2>
            <ChevronDown
              className={cn(
                "shrink-0 text-sky-900/70 transition-transform",
                open ? "h-5 w-5 rotate-180" : "h-5 w-5",
              )}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="flex min-h-0 flex-1 flex-col border-t border-sky-200 bg-sky-50 px-3 pb-3 pt-2 text-sky-950">
          <p className="shrink-0 rounded-md border border-sky-200 bg-white/80 px-2 py-1 text-[10px] leading-snug">
            Hors allergènes UE-14 — alternative sans porc / végétarienne.
          </p>
          <ul className="mt-2 min-h-0 flex-1 space-y-3 overflow-y-auto sm:max-h-[26rem]">
            {dietGroups.map((g) => {
              const level = groupLevelById?.[g.groupId] ?? "PRIMAIRE";
              const cardColor = LEVEL_CARD_COLORS[level];
              return (
                <li key={g.groupId}>
                  <p className="text-sm font-bold uppercase tracking-wide">{g.groupLabel}</p>
                  <ul className="mt-1.5 space-y-1.5">
                    {g.concerned.map((s) => (
                      <li
                        key={s.id}
                        className="w-full rounded-xl border-2 px-4 py-2.5 text-base text-zinc-900 shadow-sm"
                        style={{
                          backgroundColor: cardColor,
                          borderColor: cardColor,
                        }}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-sm font-bold text-white sm:text-base">
                            {formatStudentKitchenName(s.firstName, s.lastName)}
                          </span>
                          {s.noPork ? (
                            <span className="rounded-full bg-sky-800 px-2 py-0.5 text-sm font-bold text-white">
                              Sans porc
                            </span>
                          ) : null}
                          {s.vegetarian ? (
                            <span className="rounded-full bg-emerald-800 px-2 py-0.5 text-sm font-bold text-white">
                              Végétarien
                            </span>
                          ) : null}
                        </div>
                        {s.dietDishes.length > 0 ? (
                          <div className="mt-1 text-sm font-medium text-zinc-900">
                            <span className="font-semibold">Plats :</span>{" "}
                            {s.dietDishes.join(", ")}
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
