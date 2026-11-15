import { Recycle, Scale, TrendingUp, type LucideIcon } from "lucide-react";
import { buildDashboardFollowUpAdvice } from "@/lib/buildDashboardFollowUpAdvice";
import type { DashboardDayDetailRow } from "@/lib/buildDashboardDayDetailRows";
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
  const advice = buildDashboardFollowUpAdvice({
    days,
    rows: perDayRows,
    wasteGramsPer100,
    targetGPer100,
  });

  return (
    <article
      className={`avis-suivi avis-suivi--${advice.tone}`}
      aria-labelledby="avis-suivi-title"
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
    </article>
  );
}
