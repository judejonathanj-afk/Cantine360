"use client";

import { useState } from "react";
import { ChevronDown, ShieldAlert } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { formatStudentKitchenName } from "@/lib/studentDisplayName";
import type { GroupAllergenSummary } from "@/server/serviceAllergenSummary";
import { SERVICE_INSIGHT_TONES } from "@/components/service/serviceInsightTones";
import { cn } from "@/lib/utils";

const t = SERVICE_INSIGHT_TONES.violet;

export function ServiceConcernedStudentsPanel({
  groups,
  hasMenu,
  className,
}: {
  groups: GroupAllergenSummary[];
  hasMenu: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!hasMenu) return null;

  const concernedGroups = groups
    .map((g) => ({
      ...g,
      concerned: g.students.filter((s) => s.affectedByMenu),
    }))
    .filter((g) => g.concerned.length > 0);

  const total = concernedGroups.reduce((n, g) => n + g.concerned.length, 0);
  if (total === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn("group h-full", className)}>
      <div
        className={cn(
          "flex h-full min-h-[10.5rem] flex-col overflow-hidden rounded-2xl border shadow-md",
          t.shell,
        )}
      >
        <CollapsibleTrigger
          className={cn(
            "flex flex-1 flex-col px-4 py-4 text-left outline-none [&[data-state=open]]:flex-none",
            t.hover,
          )}
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                t.icon,
              )}
            >
              <ShieldAlert className="h-5 w-5" aria-hidden />
            </span>
            <div className={cn("min-w-0 flex-1", t.text)}>
              <h2 className="text-base font-semibold">Liste nominative</h2>
              <p className={cn("mt-1 text-sm", t.muted)}>
                {total} élève{total > 1 ? "s" : ""} concerné{total > 1 ? "s" : ""} par le menu
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight">{total}</p>
            </div>
            <ChevronDown
              className={cn(
                "h-5 w-5 shrink-0 transition-transform",
                t.chevron,
                open ? "rotate-180" : "",
              )}
            />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent
          className={cn("border-t px-4 pb-4 pt-3", t.expandBorder, t.expand, t.text)}
        >
          <p className={cn("rounded-xl px-3 py-2 text-sm leading-relaxed", t.nested)}>
            <strong className="font-semibold">Donnée de santé (RGPD)</strong> — réservée au
            personnel cantine connecté. Ne pas diffuser hors Cantine360.
          </p>
          <ul className="mt-3 max-h-64 space-y-3 overflow-y-auto">
            {concernedGroups.map((g) => (
              <li key={g.groupId}>
                <p className="text-sm font-bold uppercase tracking-wide">{g.groupLabel}</p>
                <ul className="mt-1.5 space-y-1.5">
                  {g.concerned.map((s) => (
                    <li key={s.id} className={cn("rounded-xl px-3 py-2 text-base", t.nested)}>
                      <div className="font-semibold">
                        {formatStudentKitchenName(s.firstName, s.lastName)}
                      </div>
                      <div className={cn("mt-0.5 text-sm", t.muted)}>
                        {s.allergens.join(" · ")}
                      </div>
                      {s.affectedDishes.length > 0 ? (
                        <div className="mt-0.5 text-sm font-medium">
                          Plats : {s.affectedDishes.join(", ")}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
