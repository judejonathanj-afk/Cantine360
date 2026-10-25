"use client";

import Link from "next/link";
import { useEffect, type ReactNode, type WheelEvent } from "react";
import { Check, ChevronDown, GraduationCap } from "lucide-react";
import { GroupNameBadge } from "@/components/GroupNameBadge";
import { GroupAllergenBadge } from "@/components/service/ServiceAllergenPanel";
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

function chainPageScroll(event: WheelEvent<HTMLDivElement>) {
  const el = event.currentTarget;
  const atTop = el.scrollTop <= 0;
  const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
  if ((event.deltaY < 0 && atTop) || (event.deltaY > 0 && atBottom)) {
    window.scrollBy({ top: event.deltaY });
  }
}

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
      <section className="overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white shadow-[0_14px_40px_rgba(24,24,27,0.08)] transition-[transform,box-shadow] duration-200 ease-out hover:z-10 hover:scale-[1.015] hover:shadow-[0_22px_52px_rgba(24,24,27,0.14)] motion-reduce:transition-none motion-reduce:hover:scale-100">
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-zinc-50/80 sm:px-5 sm:py-5"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d2ff5a] text-zinc-900 sm:h-11 sm:w-11"
            aria-hidden
          >
            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
              Saisie
            </span>
            <span className="block text-base font-extrabold tracking-tight text-zinc-900 sm:text-lg">
              {open ? "Masquer les classes" : "Ouvrir les classes"}
            </span>
            {!open ? (
              <span className="mt-0.5 block text-sm text-zinc-500">
                {summaryCards.length} classe{summaryCards.length > 1 ? "s" : ""}
                {doneCount > 0
                  ? ` · ${doneCount} saisie${doneCount > 1 ? "s" : ""}`
                  : " · appuyez pour afficher la grille"}
              </span>
            ) : null}
          </span>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
      </section>

      {open ? (
        <div className="space-y-4 rounded-[24px] border border-zinc-200/80 bg-[#eef4ef] p-4 shadow-[0_10px_32px_rgba(24,24,27,0.06)] sm:p-5">
          {toolbar}
          {cards.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-600">
              Aucune classe pour ce filtre école / niveau.
            </p>
          ) : (
            <div
              onWheel={chainPageScroll}
              className="max-h-[calc(2*21.5rem+1.25rem)] overflow-y-auto overflow-x-hidden overscroll-y-auto pr-2 [scrollbar-gutter:stable] sm:max-h-[calc(2*22.5rem+1.5rem)] lg:max-h-[calc(2*24rem+2rem)] [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-400 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-zinc-200"
            >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
              {cards.map((m) => {
                const done =
                  m.presentCount > 0 ||
                  m.servedCount > 0 ||
                  m.rabCount > 0 ||
                  m.refusedCount > 0;
                const cardColor = LEVEL_CARD_COLORS[m.level] ?? LEVEL_CARD_COLORS.PRIMAIRE;

                return (
                  <Link
                    key={m.groupId}
                    id={`group-${m.groupId}`}
                    href={`/service/${serviceId}/group/${m.groupId}`}
                    className="relative scroll-my-24 rounded-2xl border-2 p-4 shadow-sm transition-all duration-200 ease-out hover:z-10 hover:scale-[1.04] hover:shadow-xl active:scale-[0.98]"
                    style={{
                      backgroundColor: cardColor,
                      borderColor: cardColor,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <GroupNameBadge name={m.groupName} schoolName={m.schoolName} />
                        <p className="inline-flex w-fit rounded-full border-2 border-zinc-900 bg-white px-2.5 py-0.5 text-xs font-bold text-zinc-950">
                          {schoolLevelLabelFr(m.level)}
                        </p>
                      </div>
                      <span
                        className={[
                          "rounded-full px-2 py-1 text-xs font-semibold",
                          done
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-white/70 text-zinc-800",
                        ].join(" ")}
                      >
                        {done ? "Saisi" : "À faire"}
                      </span>
                    </div>

                    <GroupAllergenBadge groupSummary={m.groupSummary} hasMenu={hasMenu} />

                    <div className="mt-3 grid grid-cols-2 gap-2.5 text-zinc-800">
                      <div className="rounded-xl bg-white px-3.5 py-3 shadow-sm">
                        <div className="text-sm font-medium text-zinc-600">Présents</div>
                        <div className="text-xl font-bold tabular-nums">{m.presentCount}</div>
                      </div>
                      <div className="rounded-xl bg-white px-3.5 py-3 shadow-sm">
                        <div className="text-sm font-medium text-zinc-600">Servis</div>
                        <div className="text-xl font-bold tabular-nums">{m.servedCount}</div>
                      </div>
                      <div className="rounded-xl bg-white px-3.5 py-3 shadow-sm">
                        <div className="text-sm font-medium text-zinc-600">RAB</div>
                        <div className="text-xl font-bold tabular-nums">{m.rabCount}</div>
                      </div>
                      <div className="rounded-xl bg-white px-3.5 py-3 shadow-sm">
                        <div className="text-sm font-medium text-zinc-600">Refus</div>
                        <div className="text-xl font-bold tabular-nums">{m.refusedCount}</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-[28px] bg-[#0d3b2e] px-4 py-3.5 shadow-[0_12px_32px_rgba(13,59,46,0.28)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3ddc84] text-[#0d3b2e]"
                aria-hidden
              >
                <Check className="h-5 w-5" strokeWidth={3} />
              </span>
              <div className="min-w-0">
                <p className="text-base font-extrabold leading-tight text-white">
                  Tout est prêt ?
                </p>
                <p className="mt-0.5 text-sm leading-snug text-white/80">
                  Un clic enregistre et referme la liste des classes.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="shrink-0 rounded-2xl bg-[#00c46a] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition duration-200 hover:scale-105 hover:bg-[#00b05f] active:scale-[0.98] active:bg-[#009e55] motion-reduce:hover:scale-100 sm:min-w-[11.5rem]"
            >
              Enregistrer
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
