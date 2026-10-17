"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
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

export function ServiceClassGrid({
  serviceId,
  cards,
  hasMenu,
  expandGroupId = null,
}: {
  serviceId: string;
  cards: ServiceClassCard[];
  hasMenu: boolean;
  expandGroupId?: string | null;
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!expandGroupId) return;
    setOpenGroups((prev) => ({ ...prev, [expandGroupId]: true }));
  }, [expandGroupId]);

  function toggleGroup(groupId: string) {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }

  function closeGroup(groupId: string) {
    setOpenGroups((prev) => ({ ...prev, [groupId]: false }));
  }

  if (cards.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-600">
        Aucune classe pour ce filtre.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-1 sm:px-2">
      {cards.map((m) => {
        const done =
          m.presentCount > 0 ||
          m.servedCount > 0 ||
          m.rabCount > 0 ||
          m.refusedCount > 0;
        const cardColor = LEVEL_CARD_COLORS[m.level] ?? LEVEL_CARD_COLORS.PRIMAIRE;
        const isOpen = Boolean(openGroups[m.groupId]);

        return (
          <section
            key={m.groupId}
            id={`group-${m.groupId}`}
            className="relative scroll-my-24 overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white shadow-[0_14px_40px_rgba(24,24,27,0.08)] transition-[transform,box-shadow] duration-200 ease-out hover:z-10 hover:scale-[1.025] hover:shadow-[0_22px_52px_rgba(24,24,27,0.14)] motion-reduce:transition-none motion-reduce:hover:scale-100"
          >
            <div className="flex items-stretch gap-2 border-b border-zinc-100 bg-white sm:gap-3">
              <button
                type="button"
                onClick={() => toggleGroup(m.groupId)}
                aria-expanded={isOpen}
                className="flex min-w-0 flex-1 items-center gap-3 px-4 py-4 text-left transition hover:bg-zinc-50/80 sm:px-5"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold text-zinc-900 sm:h-10 sm:w-10"
                  style={{ backgroundColor: cardColor }}
                  aria-hidden
                >
                  {schoolLevelLabelFr(m.level).slice(0, 3)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                    Classe
                  </span>
                  <span className="block truncate text-base font-extrabold tracking-tight text-zinc-900 sm:text-lg">
                    {m.groupName}
                  </span>
                  {!isOpen ? (
                    <span className="mt-0.5 block truncate text-sm text-zinc-500">
                      {m.schoolName}
                    </span>
                  ) : null}
                </span>
                <span
                  className={[
                    "hidden shrink-0 rounded-full px-2 py-1 text-xs font-semibold sm:inline",
                    done ? "bg-emerald-50 text-emerald-800" : "bg-zinc-100 text-zinc-800",
                  ].join(" ")}
                >
                  {done ? "Saisi" : "À faire"}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              <div className="flex shrink-0 items-center border-l border-zinc-100 px-3 sm:px-4">
                <Link
                  href={`/service/${serviceId}/group/${m.groupId}`}
                  className="rounded-xl border border-emerald-700 bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:bg-emerald-800 sm:text-sm"
                >
                  Saisir
                </Link>
              </div>
            </div>

            {isOpen ? (
              <div className="space-y-3 bg-zinc-100/80 p-3 sm:p-4">
                <Link
                  href={`/service/${serviceId}/group/${m.groupId}`}
                  className="relative block scroll-my-24 rounded-2xl border-2 p-4 shadow-sm transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-lg active:scale-[0.99]"
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
                        done ? "bg-emerald-50 text-emerald-800" : "bg-white/70 text-zinc-800",
                      ].join(" ")}
                    >
                      {done ? "Saisi" : "À faire"}
                    </span>
                  </div>

                  <GroupAllergenBadge groupSummary={m.groupSummary} hasMenu={hasMenu} />

                  <div className="mt-3 grid grid-cols-2 gap-2.5 text-zinc-800 sm:grid-cols-4">
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

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => closeGroup(m.groupId)}
                    className="rounded-xl border border-emerald-700 bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:scale-105 hover:bg-emerald-700 active:bg-emerald-800"
                  >
                    Valider
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
