"use client";

import { useState } from "react";
import {
  Lightbulb,
  Recycle,
  Scale,
  TrendingUp,
  X,
  type LucideIcon,
} from "lucide-react";
import { buildDashboardFollowUpAdvice } from "@/lib/buildDashboardFollowUpAdvice";
import type { DashboardDayDetailRow } from "@/lib/buildDashboardDayDetailRows";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import "./AvisDuSuiviCard.css";

const ITEM_ICONS: Record<string, LucideIcon> = {
  waste: Recycle,
  service: Scale,
  trend: TrendingUp,
};

function LeafDecor({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden>
      <ellipse cx="118" cy="38" rx="42" ry="28" fill="#bbf7d0" />
      <ellipse cx="148" cy="18" rx="28" ry="20" fill="#86efac" />
      <path
        d="M22 108c18-28 48-38 72-22-8 22-32 34-56 28-8-2-14-4-16-6Z"
        fill="#bbf7d0"
      />
      <path
        d="M88 92c16-10 34-8 46 4-12 12-30 14-44 8-2-2-2-8-2-12Z"
        fill="#86efac"
      />
    </svg>
  );
}

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

  const iconWrap =
    advice.tone === "alert"
      ? "bg-rose-500"
      : advice.tone === "watch"
        ? "bg-orange-400"
        : "bg-[#0f9f4f]";

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
              <span className={cn("avis-suivi__title-icon", iconWrap)}>
                <Lightbulb className="size-4" strokeWidth={2.4} aria-hidden />
              </span>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          overlayClassName="z-[100]"
          className="z-[100] max-w-3xl gap-0 overflow-hidden rounded-3xl border-0 p-0 shadow-[0_24px_60px_-24px_rgba(15,60,40,0.45)] sm:max-w-3xl"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 z-30 flex size-8 items-center justify-center rounded-full bg-white text-zinc-500 shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50 hover:text-zinc-800"
            aria-label="Fermer"
          >
            <X className="size-4" />
          </button>

          <div className="relative overflow-hidden">
            <div className="relative px-5 pb-2 pt-5 sm:px-6">
              <LeafDecor className="pointer-events-none absolute -right-4 -top-6 h-28 w-40" />
              <div className="relative flex items-start gap-3 pr-10">
                <span
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-full text-white shadow-sm",
                    iconWrap,
                  )}
                >
                  <Lightbulb className="size-6" strokeWidth={2.4} aria-hidden />
                </span>
                <div className="min-w-0">
                  <DialogTitle className="text-[1.75rem] font-extrabold leading-none tracking-tight text-zinc-950">
                    Avis du suivi
                  </DialogTitle>
                  <DialogDescription className="mt-1.5 text-sm font-semibold text-zinc-800 sm:text-base">
                    {advice.lead} · {days} jours.
                  </DialogDescription>
                </div>
              </div>
            </div>

            <div className="max-h-[min(70vh,36rem)] space-y-3 overflow-y-auto px-5 pb-5 pt-3 sm:px-6">
              <div className="rounded-[1.25rem] bg-[#FAF6EE] px-4 py-3.5">
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#047857]">
                  {advice.badge}
                </p>
                <p className="mt-1 text-sm font-bold leading-relaxed text-[#052e16]">
                  {advice.detail}
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {advice.facts.map((fact) => (
                  <div
                    key={fact.key}
                    className={cn(
                      "rounded-[1.25rem] px-4 py-3.5",
                      fact.key === "alerte" ? "bg-rose-50" : "bg-[#FAF6EE]",
                    )}
                  >
                    <p
                      className={cn(
                        "text-xs font-extrabold uppercase tracking-wide",
                        fact.key === "alerte" ? "text-rose-700" : "text-[#047857]",
                      )}
                    >
                      {fact.pill}
                    </p>
                    <p className="mt-1 text-sm font-extrabold leading-snug text-zinc-950">
                      {fact.title}
                    </p>
                    <p className="mt-1 text-xs font-bold leading-snug text-zinc-700">
                      {fact.text}
                    </p>
                  </div>
                ))}
              </div>

              <div className="relative overflow-hidden rounded-[1.25rem] bg-[#FAF6EE] px-4 py-3.5">
                <LeafDecor className="pointer-events-none absolute -bottom-6 -right-4 h-20 w-28 opacity-80" />
                <div className="relative flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-[#0f9f4f] shadow-sm">
                    <Lightbulb className="size-4" strokeWidth={2.3} aria-hidden />
                  </span>
                  <div>
                    <p className="text-base font-extrabold text-[#047857]">
                      À retenir
                    </p>
                    <p className="mt-0.5 text-sm font-bold leading-snug text-[#052e16]">
                      {advice.hint}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
