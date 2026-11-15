"use client";

import { useState } from "react";
import {
  Lightbulb,
  Recycle,
  Scale,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { buildDashboardFollowUpAdvice } from "@/lib/buildDashboardFollowUpAdvice";
import type { DashboardDayDetailRow } from "@/lib/buildDashboardDayDetailRows";
import { ServiceSaisieOverlay } from "@/components/service/ServiceSaisieOverlay";
import { cn } from "@/lib/utils";
import "./AvisDuSuiviCard.css";

const ITEM_ICONS: Record<string, LucideIcon> = {
  waste: Recycle,
  service: Scale,
  trend: TrendingUp,
};

export function AvisDuSuiviCard({
  days,
  perDayRows,
  wasteGramsPer100,
  targetGPer100,
}: {
  days: 7 | 30;
  perDayRows: DashboardDayDetailRow[];
  wasteGramsPer100: number | null;
  targetGPer100: number | null;
}) {
  const [open, setOpen] = useState(false);
  const advice = buildDashboardFollowUpAdvice({
    days,
    rows: perDayRows,
    wasteGramsPer100,
    targetGPer100,
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`avis-suivi avis-suivi--${advice.tone}`}
      >
        <header className="avis-suivi__header">
          <div>
            <p className="avis-suivi__kicker">
              <span className="avis-suivi__dot" aria-hidden />
              {advice.badge}
            </p>
            <h2 id="avis-suivi-title" className="avis-suivi__title">
              Avis du suivi
            </h2>
          </div>
          <p className="avis-suivi__period">Sur {days} jours</p>
        </header>

        <p className="avis-suivi__lead">{advice.lead}</p>

        <ul className="avis-suivi__list">
          {advice.items.map((item) => {
            const Icon = ITEM_ICONS[item.key] ?? Recycle;
            return (
              <li key={item.key} className="avis-suivi__item">
                <span className="avis-suivi__icon">
                  <Icon className="size-4" strokeWidth={2.25} aria-hidden />
                </span>
                <span className="avis-suivi__item-copy">
                  <span className="avis-suivi__item-label">{item.label}</span>
                  <span className="avis-suivi__item-hint">{item.hint}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </button>

      <ServiceSaisieOverlay
        open={open}
        onClose={() => setOpen(false)}
        labelledBy="avis-suivi-overlay-title"
        className="h-full min-h-0 rounded-2xl bg-white shadow-[0_18px_50px_rgba(0,0,0,0.16)]"
        chrome={
          <div className="min-w-0">
            <h2
              id="avis-suivi-overlay-title"
              className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-white sm:text-2xl"
            >
              <Lightbulb className="h-7 w-7 shrink-0" strokeWidth={2.25} aria-hidden />
              Avis du suivi
            </h2>
            <p className="mt-1 text-base font-semibold leading-snug text-white sm:text-lg">
              Lecture en direct des pesées, du dernier service et de la tendance.
            </p>
            <p className="mt-1 text-sm font-medium leading-snug text-white/85 sm:text-base">
              Détail sur {days} jours — {advice.badge.toLowerCase()}.
            </p>
          </div>
        }
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 rounded-2xl bg-[#00c46a] px-8 py-2.5 text-sm font-bold text-white shadow-sm transition duration-200 hover:scale-105 hover:bg-[#00b05f] active:scale-[0.98] motion-reduce:hover:scale-100"
            >
              Fermer
            </button>
          </div>
        }
      >
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-3 sm:p-4">
          <div
            className={cn(
              "rounded-2xl border p-4 sm:p-5",
              advice.tone === "ok"
                ? "border-emerald-200 bg-emerald-50"
                : advice.tone === "watch"
                  ? "border-amber-200 bg-amber-50"
                  : advice.tone === "alert"
                    ? "border-rose-200 bg-rose-50"
                    : "border-zinc-200 bg-zinc-50",
            )}
          >
            <p
              className={cn(
                "inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white",
                advice.tone === "ok"
                  ? "bg-emerald-600"
                  : advice.tone === "watch"
                    ? "bg-amber-500"
                    : advice.tone === "alert"
                      ? "bg-rose-600"
                      : "bg-zinc-600",
              )}
            >
              {advice.badge}
            </p>
            <p className="mt-3 font-display text-lg font-bold leading-snug text-zinc-950 sm:text-xl">
              {advice.lead}
            </p>
            <p className="mt-2 text-base font-medium leading-relaxed text-zinc-800">
              {advice.detail}
            </p>
            <p className="mt-3 text-base font-semibold leading-relaxed text-zinc-950">
              {advice.hint}
            </p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {advice.facts.map((fact) => (
              <div
                key={fact.key}
                className={cn(
                  "rounded-2xl border px-4 py-4",
                  fact.key === "alerte"
                    ? "border-rose-200 bg-rose-50"
                    : "border-zinc-200 bg-zinc-50",
                )}
              >
                <p className="inline-flex rounded-full bg-zinc-950 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white">
                  {fact.pill}
                </p>
                <p className="mt-3 text-base font-bold leading-snug text-zinc-950">
                  {fact.title}
                </p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-zinc-700">
                  {fact.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </ServiceSaisieOverlay>
    </>
  );
}
