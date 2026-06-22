"use client";

import Link from "next/link";
import { GroupNameBadge } from "@/components/GroupNameBadge";
import { GroupAllergenBadge } from "@/components/service/ServiceAllergenPanel";
import { groupCardColorForIndex } from "@/lib/groupCardColors";
import type { GroupAllergenSummary } from "@/server/serviceAllergenSummary";

export type ServiceClassCard = {
  groupId: string;
  groupName: string;
  schoolName: string;
  presentCount: number;
  servedCount: number;
  rabCount: number;
  refusedCount: number;
  leftoversCount: number;
  groupSummary: GroupAllergenSummary | undefined;
};

export function ServiceClassGrid({
  serviceId,
  cards,
  hasMenu,
}: {
  serviceId: string;
  cards: ServiceClassCard[];
  hasMenu: boolean;
}) {
  if (cards.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-600">
        Aucune classe pour cette école.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
      {cards.map((m, index) => {
        const done =
          m.presentCount > 0 ||
          m.servedCount > 0 ||
          m.rabCount > 0 ||
          m.refusedCount > 0 ||
          m.leftoversCount > 0;
        const cardColor = groupCardColorForIndex(index);
        return (
          <Link
            key={m.groupId}
            href={`/service/${serviceId}/group/${m.groupId}`}
            className="relative rounded-2xl border-2 p-4 shadow-sm transition-all duration-200 ease-out hover:z-10 hover:scale-[1.04] hover:shadow-xl active:scale-[0.98]"
            style={{
              backgroundColor: cardColor,
              borderColor: cardColor,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <GroupNameBadge name={m.groupName} schoolName={m.schoolName} />
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
              <div className="rounded-xl bg-white px-3.5 py-3 shadow-sm">
                <div className="text-sm font-medium text-zinc-600">Restes</div>
                <div className="text-xl font-bold tabular-nums">{m.leftoversCount}</div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
