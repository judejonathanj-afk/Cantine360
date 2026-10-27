"use client";

import { useMemo, useState, type ReactNode } from "react";
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

/** Jaune repère régimes (capture produit) */
const DIET_PANEL_BG = "#FDEE5A";
const DIET_PANEL_BORDER = "#E8D84C";

export function useDietStudentsList({
  groups,
  hasMenu,
  groupLevelById,
}: {
  groups: GroupAllergenSummary[];
  hasMenu: boolean;
  groupLevelById?: Record<string, SchoolLevel>;
}) {
  return useMemo(() => {
    const dietGroups = groups
      .map((g) => ({
        ...g,
        concerned: g.students.filter((s) => s.dietAffectedByMenu),
      }))
      .filter((g) => g.concerned.length > 0);

    const total = dietGroups.reduce((n, g) => n + g.concerned.length, 0);

    const list = dietGroups.map((g) => {
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
    });

    return { total, list, visible: hasMenu && total > 0 };
  }, [groups, hasMenu, groupLevelById]);
}

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
  const { total, list, visible } = useDietStudentsList({
    groups,
    hasMenu,
    groupLevelById,
  });

  if (!visible) return null;

  return (
    <DietStudentsCollapsible total={total} className={className} list={list} />
  );
}

export function ServiceDietStudentsTrigger({
  total,
  open,
  className,
}: {
  total: number;
  open: boolean;
  className?: string;
}) {
  return (
    <CollapsibleTrigger
      className={cn(
        "flex w-fit max-w-full shrink-0 items-center gap-2 border px-4 shadow-sm outline-none transition-colors hover:brightness-[0.97]",
        open ? "rounded-t-2xl py-2.5" : "rounded-full py-2",
        className,
      )}
      style={{
        backgroundColor: DIET_PANEL_BG,
        borderColor: DIET_PANEL_BORDER,
      }}
    >
      <h2 className="text-left text-sm font-bold leading-snug text-amber-950">
        <span className="tabular-nums">{total}</span> régime
        {total > 1 ? "s" : ""} à adapter — détail
      </h2>
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 text-amber-950/80 transition-transform",
          open ? "rotate-180" : "",
        )}
      />
    </CollapsibleTrigger>
  );
}

export function ServiceDietStudentsExpandedContent({
  list,
  className,
}: {
  list: ReactNode;
  className?: string;
}) {
  return (
    <CollapsibleContent
      className={cn(
        "flex min-h-0 flex-col border border-t-0 border-[#E8D84C] bg-white pb-3 pt-2 text-zinc-900 sm:pb-4",
        className,
      )}
    >
      <p className="shrink-0 text-base font-extrabold text-zinc-950 sm:text-lg">
        Élèves concernés
      </p>
      <p className="mt-0.5 shrink-0 text-[10px] leading-snug text-zinc-600 sm:text-xs">
        Hors allergènes UE-14 — alternative sans porc / végétarienne.
      </p>
      <ul className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto sm:max-h-[20rem] lg:max-h-[22rem]">
        {list}
      </ul>
    </CollapsibleContent>
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
      <div className="flex flex-col overflow-hidden rounded-xl">
        <ServiceDietStudentsTrigger total={total} open={open} />
        <ServiceDietStudentsExpandedContent list={list} />
      </div>
    </Collapsible>
  );
}
