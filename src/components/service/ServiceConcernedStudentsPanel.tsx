"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ShieldAlert } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { formatStudentKitchenName } from "@/lib/studentDisplayName";
import { groupCardColorForIndex } from "@/lib/groupCardColors";
import type { GroupAllergenSummary } from "@/server/serviceAllergenSummary";
import { SERVICE_INSIGHT_TONES } from "@/components/service/serviceInsightTones";
import { cn } from "@/lib/utils";

const t = SERVICE_INSIGHT_TONES.black;

export function ServiceConcernedStudentsPanel({
  serviceId,
  groups,
  hasMenu,
  groupColorIndexById,
  className,
}: {
  serviceId: string;
  groups: GroupAllergenSummary[];
  hasMenu: boolean;
  groupColorIndexById?: Record<string, number>;
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openFromSave = searchParams.get("liste") === "1";
  const panelRef = useRef<HTMLDivElement>(null);
  const handledListeScroll = useRef(false);

  const concernedGroups = groups
    .map((g) => ({
      ...g,
      concerned: g.students.filter((s) => s.affectedByMenu),
    }))
    .filter((g) => g.concerned.length > 0);

  const total = concernedGroups.reduce((n, g) => n + g.concerned.length, 0);

  const [open, setOpen] = useState(() => total > 0);

  useEffect(() => {
    if (total > 0) setOpen(true);
  }, [total]);

  useEffect(() => {
    if (!openFromSave || handledListeScroll.current || total === 0) return;

    handledListeScroll.current = true;
    setOpen(true);

    requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    const timeout = window.setTimeout(() => {
      router.replace(`/service/${serviceId}`, { scroll: false });
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [openFromSave, router, serviceId, total]);

  if (!hasMenu) return null;
  if (total === 0) return null;

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn("group h-full", className)}
    >
      <div
        ref={panelRef}
        id="liste-nominative"
        className={cn(
          "flex h-full min-h-[10.5rem] flex-col overflow-hidden rounded-2xl border shadow-md scroll-mt-24",
          t.shell,
        )}
      >
        <CollapsibleTrigger
          className={cn(
            "flex w-full flex-1 flex-col justify-center px-3 py-2.5 text-left outline-none [&[data-state=open]]:flex-none [&[data-state=open]]:justify-start",
            t.hover,
          )}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                t.icon,
              )}
            >
              <ShieldAlert className="h-4 w-4" aria-hidden />
            </span>
            <h2 className={cn("min-w-0 flex-1 text-sm font-semibold", t.title)}>
              Liste nominative
            </h2>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                t.chevron,
                open ? "rotate-180" : "",
              )}
            />
          </div>
          <p className="mt-2 text-center text-5xl font-bold leading-none tracking-tight sm:text-6xl">
            {total}
          </p>
          <p className={cn("mt-1 text-center text-xs", t.muted)}>
            élève{total > 1 ? "s" : ""} concerné{total > 1 ? "s" : ""} par le menu
          </p>
        </CollapsibleTrigger>
        <CollapsibleContent
          className={cn("border-t px-4 pb-4 pt-3", t.expandBorder, t.expand, t.text)}
        >
          <p className={cn("rounded-lg px-2.5 py-1.5 text-xs leading-snug", t.nested)}>
            <strong className="font-semibold">Donnée de santé (RGPD)</strong> — réservée au
            personnel cantine connecté. Ne pas diffuser hors Cantine360.
          </p>
          <ul className="mt-3 max-h-64 space-y-3 overflow-y-auto">
            {concernedGroups.map((g) => {
              const cardColor = groupCardColorForIndex(groupColorIndexById?.[g.groupId] ?? 0);
              return (
              <li key={g.groupId}>
                <p className="text-sm font-bold uppercase tracking-wide">{g.groupLabel}</p>
                <ul className="mt-1.5 space-y-1.5">
                  {g.concerned.map((s) => (
                    <li
                      key={s.id}
                      className="rounded-xl border-2 px-3 py-2.5 text-base text-zinc-900 shadow-sm"
                      style={{
                        backgroundColor: cardColor,
                        borderColor: cardColor,
                      }}
                    >
                      <div className="font-semibold text-zinc-900">
                        {formatStudentKitchenName(s.firstName, s.lastName)}
                      </div>
                      <div className="mt-0.5 text-sm font-medium text-zinc-700">
                        {s.allergens.join(" · ")}
                      </div>
                      {s.affectedDishes.length > 0 ? (
                        <div className="mt-0.5 text-sm font-medium text-zinc-800">
                          Plats : {s.affectedDishes.join(", ")}
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
