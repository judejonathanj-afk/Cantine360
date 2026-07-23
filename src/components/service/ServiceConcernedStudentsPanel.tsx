"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { CantinePlusBadge } from "@/components/dashboard/CantinePlusSection";
import { cn } from "@/lib/utils";

function kitchenAllergenDetail(notes: string | null | undefined): string {
  const trimmed = notes?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "à ne pas servir — allergie";
}

export function ServiceConcernedStudentsPanel({
  serviceId,
  groups,
  hasMenu,
  groupLevelById,
  className,
}: {
  serviceId: string;
  groups: GroupAllergenSummary[];
  hasMenu: boolean;
  groupLevelById?: Record<string, SchoolLevel>;
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
          "flex h-full flex-col overflow-hidden rounded-2xl border-2 border-yellow-400 bg-[#e8eef5] shadow-md scroll-mt-24",
          open ? "min-h-0" : "min-h-[10.5rem]",
        )}
      >
        <CollapsibleTrigger
          className={cn(
            "flex w-full shrink-0 flex-col px-4 outline-none hover:bg-[#dce6f0]/60",
            open ? "py-3.5" : "py-4",
          )}
        >
          <div className="relative flex items-center gap-3">
            <CantinePlusBadge className="relative z-10 shrink-0" />
            <h2
              className={cn(
                "absolute inset-x-0 text-center font-bold leading-snug text-[#0a1628]",
                open ? "text-lg sm:text-xl" : "text-xl sm:text-2xl",
              )}
            >
              <span className="tabular-nums">{total}</span> Élèves concernés par le menu
            </h2>
            <div className="relative z-10 ml-auto flex shrink-0 items-center">
              <ChevronDown
                className={cn(
                  "shrink-0 text-[#0a1628]/70 transition-transform",
                  open ? "h-5 w-5 rotate-180" : "h-5 w-5",
                )}
              />
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent
          className="flex min-h-0 flex-1 flex-col border-t border-[#1a2d4a]/15 bg-[#e8eef5] px-3 pb-3 pt-2 text-[#0a1628]"
        >
          <p className="shrink-0 rounded-md border border-[#1a2d4a]/15 bg-white/80 px-2 py-1 text-[10px] leading-snug text-[#0a1628]">
            <strong className="font-semibold">RGPD</strong> — personnel cantine uniquement.
          </p>
          <ul className="mt-2 min-h-0 flex-1 space-y-3 overflow-y-auto sm:max-h-[26rem]">
            {concernedGroups.map((g) => {
              const level = groupLevelById?.[g.groupId] ?? "PRIMAIRE";
              const cardColor = LEVEL_CARD_COLORS[level];
              return (
              <li key={g.groupId}>
                <p className="text-sm font-bold uppercase tracking-wide">{g.groupLabel}</p>
                <ul className="mt-1.5 space-y-1.5">
                  {g.concerned.map((s) => {
                    const detail = kitchenAllergenDetail(s.allergenNotes);
                    return (
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
                        <span className="rounded-full bg-[#0a1628] px-2 py-0.5 text-sm font-bold text-white">
                          Menu
                        </span>
                      </div>
                      <ul className="mt-1.5 space-y-1">
                        {s.allergens.map((allergen) => (
                          <li
                            key={allergen}
                            className="text-base leading-snug text-zinc-800 sm:text-lg"
                          >
                            Allergène :{" "}
                            <strong className="text-lg font-bold text-zinc-950 sm:text-xl">
                              {allergen}
                            </strong>{" "}
                            <span className="text-zinc-700">({detail})</span>
                          </li>
                        ))}
                      </ul>
                      {s.affectedDishes.length > 0 ? (
                        <div className="mt-1 text-sm font-medium text-zinc-900">
                          <span className="font-semibold">Plats :</span>{" "}
                          {s.affectedDishes.join(", ")}
                        </div>
                      ) : null}
                    </li>
                    );
                  })}
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
