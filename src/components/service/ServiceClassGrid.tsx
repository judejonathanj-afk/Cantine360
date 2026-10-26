"use client";

import { useEffect, type ReactNode } from "react";
import { ChevronDown, GraduationCap } from "lucide-react";
import { GroupAllergenBadge } from "@/components/service/ServiceAllergenPanel";
import { ClassCardCounters } from "@/components/service/ClassCardCounters";
import { ServiceSaisieOverlay } from "@/components/service/ServiceSaisieOverlay";
import type { GroupAllergenSummary } from "@/server/serviceAllergenSummary";
import type { SchoolLevel } from "@/lib/schoolLevel";
import { LEVEL_CARD_COLORS, schoolLevelLabelFr } from "@/lib/schoolLevel";

export type ServiceClassCard = {
  groupId: string;
  groupName: string;
  schoolName: string;
  level: SchoolLevel;
  presentCount: number;
  servedCount: number;
  rabCount: number;
  refusedCount: number;
  groupSummary: GroupAllergenSummary | undefined;
};

function countDone(cards: ServiceClassCard[]) {
  return cards.filter(
    (m) =>
      m.presentCount > 0 ||
      m.servedCount > 0 ||
      m.rabCount > 0 ||
      m.refusedCount > 0,
  ).length;
}

export function ServiceClassGrid({
  serviceId,
  cards,
  summaryCards,
  hasMenu,
  open,
  onOpenChange,
  expandGroupId = null,
  toolbar,
}: {
  serviceId: string;
  cards: ServiceClassCard[];
  /** Totaux affichés sur la barre fermée (toutes classes, sans filtre). */
  summaryCards: ServiceClassCard[];
  hasMenu: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expandGroupId?: string | null;
  toolbar?: ReactNode;
}) {
  useEffect(() => {
    if (expandGroupId) onOpenChange(true);
  }, [expandGroupId, onOpenChange]);

  if (summaryCards.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-600">
        Aucune classe pour ce filtre.
      </p>
    );
  }

  const doneCount = countDone(summaryCards);

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-1 sm:px-2">
      <section className="overflow-hidden rounded-[28px] bg-[#0d3b2e] shadow-[0_12px_32px_rgba(13,59,46,0.28)] transition-transform duration-200 ease-out hover:z-10 hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100">
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/5 sm:px-5 sm:py-4"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3ddc84] text-[#0d3b2e] sm:h-11 sm:w-11"
            aria-hidden
          >
            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
              Saisie
            </span>
            <span
              id="saisie-classes-title"
              className="block text-base font-extrabold tracking-tight text-white sm:text-lg"
            >
              {open ? "Masquer les classes" : "Ouvrir les classes"}
            </span>
            <span className="mt-0.5 block text-sm leading-snug text-white/80">
              {!open ? (
                <>
                  {summaryCards.length} classe{summaryCards.length > 1 ? "s" : ""}
                  {doneCount > 0
                    ? ` · ${doneCount} saisie${doneCount > 1 ? "s" : ""}`
                    : ""}
                  {" — "}
                </>
              ) : null}
              Saisissez les compteurs sur chaque carte, puis Enregistrer.
            </span>
          </span>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-white/70 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
      </section>

      <ServiceSaisieOverlay
        open={open}
        onClose={() => onOpenChange(false)}
        labelledBy="saisie-classes-title"
        className="max-w-[92rem]"
      >
        <div className="flex h-[96vh] min-h-0 w-full flex-col gap-3 rounded-[24px] border border-zinc-200/80 bg-white p-2.5 shadow-[0_24px_60px_rgba(24,24,27,0.28)] sm:gap-3.5 sm:p-3">
          <div className="shrink-0">{toolbar}</div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] bg-white p-2.5 sm:p-3">
          {cards.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-600">
              Aucune classe pour ce filtre école / niveau.
            </p>
          ) : (
            <div
              className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pr-1.5 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-400 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-zinc-100"
            >
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
              {cards.map((m) => {
                const done =
                  m.presentCount > 0 ||
                  m.servedCount > 0 ||
                  m.rabCount > 0 ||
                  m.refusedCount > 0;
                const cardColor = LEVEL_CARD_COLORS[m.level] ?? LEVEL_CARD_COLORS.PRIMAIRE;

                return (
                  <article
                    key={m.groupId}
                    id={`group-${m.groupId}`}
                    className="relative rounded-[22px] border-2 p-5 shadow-sm"
                    style={{
                      backgroundColor: cardColor,
                      borderColor: cardColor,
                    }}
                  >
                    <div className="relative flex items-center gap-2 pr-16">
                      <p className="flex min-w-0 flex-1 items-center justify-center gap-2 truncate text-center text-base font-bold leading-none text-black">
                        {m.schoolName ? (
                          <span className="shrink truncate font-semibold uppercase tracking-wide text-black/70">
                            {m.schoolName}
                          </span>
                        ) : null}
                        <span className="inline-flex shrink-0 items-center rounded-full bg-black px-2.5 py-1 text-sm font-extrabold uppercase tracking-wide text-white sm:text-base">
                          {m.groupName}
                          <span className="mx-1.5 font-semibold text-white/50">·</span>
                          {schoolLevelLabelFr(m.level)}
                        </span>
                      </p>
                      <span
                        className={[
                          "absolute right-0 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-sm font-semibold",
                          done
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-white/70 text-zinc-800",
                        ].join(" ")}
                      >
                        {done ? "Saisi" : "À faire"}
                      </span>
                    </div>

                    <GroupAllergenBadge groupSummary={m.groupSummary} hasMenu={hasMenu} />

                    <ClassCardCounters
                      serviceId={serviceId}
                      groupId={m.groupId}
                      initial={{
                        presentCount: m.presentCount,
                        servedCount: m.servedCount,
                        rabCount: m.rabCount,
                        refusedCount: m.refusedCount,
                      }}
                    />
                  </article>
                );
              })}
            </div>
            </div>
          )}
          </div>

          <div className="flex shrink-0 justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-2xl bg-[#00c46a] px-8 py-2.5 text-sm font-bold text-white shadow-sm transition duration-200 hover:z-10 hover:scale-105 hover:bg-[#00b05f] active:scale-[0.98] active:bg-[#009e55] motion-reduce:hover:scale-100"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </ServiceSaisieOverlay>
    </div>
  );
}
