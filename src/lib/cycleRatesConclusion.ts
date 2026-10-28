import {
  levelTotalsHasData,
  type LevelMealTotals,
} from "@/lib/buildLevelComparisonSeries";
import { schoolLevelLabelFr, type SchoolLevel } from "@/lib/schoolLevel";

function ratePct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function formatPct(value: number) {
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

export function buildCycleRatesConclusion(
  totals: LevelMealTotals,
  opts: { days: 7 | 30; level: SchoolLevel },
): string {
  const levelName = schoolLevelLabelFr(opts.level).toLowerCase();

  if (!levelTotalsHasData(totals)) {
    return `Pas encore de compteurs en ${levelName} sur les ${opts.days} derniers jours. Saisissez présents, servis, RAB et refus pour obtenir une conclusion.`;
  }

  const service = ratePct(totals.served, totals.present);
  const rab = ratePct(totals.rab, totals.served);
  const refused = ratePct(totals.refused, totals.served);

  const parts = [
    `En ${levelName}, le taux de service est de ${formatPct(service)} (${totals.served.toLocaleString("fr-FR")} servis pour ${totals.present.toLocaleString("fr-FR")} présents).`,
    `RAB : ${formatPct(rab)} · refus : ${formatPct(refused)}.`,
  ];

  if (service >= 90 && rab <= 15 && refused <= 10) {
    parts.push("Le cycle est bien ajusté.");
  } else if (rab >= 20 || refused >= 15) {
    parts.push(
      "Le RAB ou les refus sont élevés : à regarder pour les portions et le menu.",
    );
  } else if (service < 80) {
    parts.push("Le taux de service est bas : beaucoup de présents ne sont pas servis.");
  } else {
    parts.push("Des écarts restent à surveiller pour affiner portions et menu.");
  }

  return parts.join(" ");
}
