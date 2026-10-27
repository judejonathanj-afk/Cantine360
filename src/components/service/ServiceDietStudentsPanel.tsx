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
/** Vert capture pour entourer « Élèves concernés » */
const CONCERNED_GREEN = "#DFF59A";
const CONCERNED_GREEN_BORDER = "#C8E86A";

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
          <p
            className="inline-flex rounded-full border-2 px-3 py-1 text-base font-extrabold uppercase tracking-wide text-zinc-950"
            style={{
              backgroundColor: CONCERNED_GREEN,
              borderColor: CONCERNED_GREEN_BORDER,
            }}
          >
            {g.groupLabel}
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {g.concerned.map((s) => (
              <li
                key={s.id}
                className="w-full rounded-xl border-2 px-4 py-3 text-lg text-zinc-950 shadow-sm"
                style={{
                  backgroundColor: cardColor,
                  borderColor: cardColor,
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-zinc-900 px-3 py-1 text-base font-extrabold text-white sm:text-lg">
                    {formatStudentKitchenName(s.firstName, s.lastName)}
                  </span>
                  {s.noPork ? (
                    <span className="rounded-full bg-sky-800 px-2.5 py-1 text-sm font-extrabold text-white sm:text-base">
                      Sans porc
                    </span>
                  ) : null}
                  {s.vegetarian ? (
                    <span className="rounded-full bg-emerald-800 px-2.5 py-1 text-sm font-extrabold text-white sm:text-base">
                      Végétarien
                    </span>
                  ) : null}
                </div>
                {s.dietDishes.length > 0 ? (
                  <div className="mt-2 space-y-1 text-base font-bold leading-snug text-zinc-950">
                    <p>
                      <span className="font-extrabold">Plats :</span>{" "}
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
      <h2 className="text-left text-base font-extrabold leading-snug text-amber-950 sm:text-lg">
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
      <p
        className="inline-flex w-fit shrink-0 rounded-2xl border-2 px-4 py-2 text-xl font-extrabold text-zinc-950 sm:text-2xl"
        style={{
          backgroundColor: CONCERNED_GREEN,
          borderColor: CONCERNED_GREEN_BORDER,
        }}
      >
        Élèves concernés
      </p>
      <p className="mt-1 shrink-0 text-base font-bold leading-snug text-zinc-950">
        Régimes sans porc et végétarien — ce n’est pas la liste des allergies.
      </p>
      <ul className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto sm:max-h-[20rem] lg:max-h-[22rem]">
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
