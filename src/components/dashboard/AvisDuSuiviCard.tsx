import { Recycle, Scale, TrendingUp, type LucideIcon } from "lucide-react";
import { buildDashboardFollowUpAdvice } from "@/lib/buildDashboardFollowUpAdvice";
import type { DashboardDayDetailRow } from "@/lib/buildDashboardDayDetailRows";
import "./AvisDuSuiviCard.css";

const ITEM_ICONS: Record<string, LucideIcon> = {
  waste: Recycle,
  service: Scale,
  trend: TrendingUp,
};

function LeafMark({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 64 80" fill="none" aria-hidden>
      <path
        d="M32 4C18 22 10 40 14 62c8-6 16-8 18-24 2 16 10 18 18 24 4-22-4-40-18-58Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M32 18v46"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

function BranchMark({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 220 90" fill="none" aria-hidden>
      <path
        d="M8 78C46 70 58 40 92 36c18-2 22 14 40 12 22-2 28-22 52-28"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M92 36c-6 10-4 22 6 30"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M70 8c22 18 18 34 8 46C66 42 62 26 70 8Z"
        fill="currentColor"
      />
      <path
        d="M128 8c20 14 16 30 6 42-16-12-18-28-6-42Z"
        fill="currentColor"
      />
      <path
        d="M176 12c18 12 14 26 4 38-14-10-16-24-4-38Z"
        fill="currentColor"
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
  const advice = buildDashboardFollowUpAdvice({
    days,
    rows: perDayRows,
    wasteGramsPer100,
    targetGPer100,
  });

  return (
    <article className="avis-suivi" aria-labelledby="avis-suivi-title">
      <LeafMark className="avis-suivi__leaf avis-suivi__leaf--top" />
      <BranchMark className="avis-suivi__leaf avis-suivi__leaf--bottom" />

      <div className="avis-suivi__content">
        <p className="avis-suivi__kicker">
          <span
            className={`avis-suivi__dot avis-suivi__dot--${advice.tone}`}
            aria-hidden
          />
          {advice.badge}
        </p>
        <h2 id="avis-suivi-title" className="avis-suivi__title">
          Avis du suivi
        </h2>
        <p className="avis-suivi__lead">{advice.lead}</p>
        <ul className="avis-suivi__list">
          {advice.items.map((item) => {
            const Icon = ITEM_ICONS[item.key] ?? Recycle;
            return (
              <li key={item.key}>
                <div className="avis-suivi__item">
                  <span className="avis-suivi__icon">
                    <Icon className="size-4" strokeWidth={2.25} aria-hidden />
                  </span>
                  <span className="avis-suivi__item-copy">
                    <span className="avis-suivi__item-label">{item.label}</span>
                    <span className="avis-suivi__item-hint">{item.hint}</span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="avis-suivi__visual">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/nos-engagements.png"
          alt=""
        />
      </div>
    </article>
  );
}
