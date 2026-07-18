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
import { LEVEL_CARD_COLORS } from "@/lib/schoolLevel";
import type { SchoolLevel } from "@/lib/schoolLevel";
import type { GroupAllergenSummary } from "@/server/serviceAllergenSummary";
import { SERVICE_INSIGHT_TONES } from "@/components/service/serviceInsightTones";
import { cn } from "@/lib/utils";

const t = SERVICE_INSIGHT_TONES.black;

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
          "flex h-full flex-col overflow-hidden rounded-2xl border shadow-md scroll-mt-24",
          open ? "min-h-0" : "min-h-[10.5rem]",
          t.shell,
        )}
      >
        <CollapsibleTrigger
          className={cn(
            "flex w-full shrink-0 flex-col px-4 text-left outline-none",
            open ? "py-2" : "py-4",
            t.hover,
          )}
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-400 ring-1 ring-red-400/40",
                open ? "h-7 w-7 rounded-lg" : "h-10 w-10",
              )}
            >
              <ShieldAlert className={open ? "h-3.5 w-3.5" : "h-5 w-5"} aria-hidden />
            </span>
            <div className={cn("min-w-0 flex-1", t.text)}>
              <h2 className={cn("font-semibold leading-snug", open ? "text-sm" : "text-base", t.title)}>
                Élèves concernés par le menu
              </h2>
            </div>
            {open ? (
              <span className={cn("shrink-0 text-sm font-bold tabular-nums", t.text)}>
                {total}
              </span>
            ) : null}
            <ChevronDown
              className={cn(
                "shrink-0 transition-transform",
                open ? "h-4 w-4 rotate-180" : "h-5 w-5",
                t.chevron,
              )}
            />
          </div>
          {!open ? (
            <p className={cn("mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl", t.text)}>
              {total}
            </p>
          ) : null}
        </CollapsibleTrigger>
        <CollapsibleContent
          className={cn(
            "flex min-h-0 flex-1 flex-col border-t px-3 pb-3 pt-2",
            t.expandBorder,
            t.expand,
            t.text,
          )}
        >
          <p className={cn("shrink-0 rounded-md px-2 py-1 text-[10px] leading-snug", t.nested)}>
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
                  {g.concerned.map((s) => (
                    <li
                      key={s.id}
                      className="w-full rounded-xl border-2 px-4 py-2.5 text-base text-zinc-900 shadow-sm"
                      style={{
                        backgroundColor: cardColor,
                        borderColor: cardColor,
                      }}
                    >
                      <div className="text-base font-bold text-zinc-900">
                        {formatStudentKitchenName(s.firstName, s.lastName)}
                      </div>
                      <div className="mt-1 text-sm font-medium text-zinc-800">
                        {s.allergens.join(" · ")}
                      </div>
                      {s.affectedDishes.length > 0 ? (
                        <div className="mt-1 text-sm font-medium text-zinc-900">
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
