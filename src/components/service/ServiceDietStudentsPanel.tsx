"use client";

import { useState, type ReactNode } from "react";
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

  if (!hasMenu || total === 0) return null;

  return (
    <DietStudentsCollapsible
      total={total}
      className={className}
      list={dietGroups.map((g) => {
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
                    <div className="mt-1.5 space-y-0.5 text-sm font-medium text-zinc-900">
                      <p>
                        <span className="font-semibold">Plats :</span>{" "}
                        {s.dietDishes.join(", ")}
                      </p>
                      {s.noPork ? (
                        <p>Ne pas servir (porc). Prévoir une alternative sans porc.</p>
                      ) : null}
                      {s.vegetarian ? (
                        <p>Ne pas servir (viande). Prévoir une alternative végétarienne.</p>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    />
  );
}

function DietStudentsCollapsible({
  total,
  className,
  list,
}: {
  total: number;
  className?: string;
  list: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      id="regimes-a-adapter"
      className={cn("group w-full scroll-mt-24", className)}
    >
      <div className="flex flex-col overflow-hidden rounded-xl border border-amber-200/90 bg-amber-50/90 shadow-sm">
        <CollapsibleTrigger
          className={cn(
            "flex w-full shrink-0 flex-col px-3 outline-none hover:bg-amber-100/80",
            open ? "py-2.5" : "py-2",
          )}
        >
          <div className="relative flex items-center gap-2">
            <h2 className="flex-1 text-left text-sm font-semibold leading-snug text-amber-950">
              <span className="tabular-nums font-bold text-amber-800">{total}</span> régime
              {total > 1 ? "s" : ""} à adapter — détail
            </h2>
            <ChevronDown
              className={cn(
                "shrink-0 text-amber-700/80 transition-transform",
                open ? "h-4 w-4 rotate-180" : "h-4 w-4",
              )}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="flex min-h-0 flex-1 flex-col border-t border-amber-200/80 bg-white px-2.5 pb-2.5 pt-2 text-zinc-900">
          <p className="shrink-0 text-[10px] leading-snug text-zinc-600">
            Hors allergènes UE-14 — alternative sans porc / végétarienne.
          </p>
          <ul className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto sm:max-h-[18rem]">
            {list}
          </ul>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
