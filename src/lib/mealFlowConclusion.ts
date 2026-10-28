import {
  buildMealFlowSeries,
  type MealFlowDayInput,
  type MealFlowPoint,
} from "@/lib/buildMealFlowSeries";
import { schoolLevelLabelFr, type SchoolLevel } from "@/lib/schoolLevel";

function ratePct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function formatPct(value: number) {
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

function seriesHasData(series: MealFlowPoint[]) {
  return series.some(
    (point) =>
      point.present > 0 || point.served > 0 || point.rab > 0 || point.refused > 0,
  );
}

export function mealFlowHasData(rows: MealFlowDayInput[]) {
  return seriesHasData(buildMealFlowSeries(rows));
}

export function buildMealFlowConclusion(
  series: MealFlowPoint[],
  opts: { days: 7 | 30; level: SchoolLevel },
): string {
  const levelName = schoolLevelLabelFr(opts.level).toLowerCase();
  const counted = series.filter(
    (point) =>
      point.present > 0 || point.served > 0 || point.rab > 0 || point.refused > 0,
  );

  if (counted.length === 0) {
    return `Pas encore de compteurs en ${levelName} sur les ${opts.days} derniers jours. Saisissez présents, servis, RAB et refus pour obtenir une conclusion.`;
  }

  const present = counted.reduce((sum, point) => sum + point.present, 0);
  const served = counted.reduce((sum, point) => sum + point.served, 0);
  const rab = counted.reduce((sum, point) => sum + point.rab, 0);
  const refused = counted.reduce((sum, point) => sum + point.refused, 0);
  const service = ratePct(served, present);
  const peakGap = counted.reduce((best, point) => {
    const gap = Math.max(0, point.present - point.served);
    const bestGap = Math.max(0, best.present - best.served);
    return gap > bestGap ? point : best;
  });
  const peakGapValue = Math.max(0, peakGap.present - peakGap.served);
  const dayWord = counted.length > 1 ? "jours" : "jour";

  const parts = [
    `En ${levelName}, ${present.toLocaleString("fr-FR")} présents et ${served.toLocaleString("fr-FR")} servis sur ${counted.length} ${dayWord} (${formatPct(service)} de service).`,
  ];

  if (peakGapValue > 0) {
    parts.push(
      `L’écart présents / servis est le plus fort le ${peakGap.label} (${peakGapValue.toLocaleString("fr-FR")}).`,
    );
  } else {
    parts.push("L’écart présents / servis reste nul sur la période.");
  }

  if (counted.length === 1) {
    parts.push("Un seul jour saisi : trop tôt pour une tendance.");
  } else {
    const first = counted[0];
    const last = counted[counted.length - 1];
    const firstGap = Math.max(0, first.present - first.served);
    const lastGap = Math.max(0, last.present - last.served);
    const delta = lastGap - firstGap;
    if (delta === 0) {
      parts.push("La tendance de l’écart est plutôt stable.");
    } else if (delta < 0) {
      parts.push(
        `La tendance de l’écart est à la baisse (${last.label} par rapport à ${first.label}).`,
      );
    } else {
      parts.push(
        `La tendance de l’écart est à la hausse (${last.label} par rapport à ${first.label}).`,
      );
    }
  }

  parts.push(
    `RAB cumulé : ${rab.toLocaleString("fr-FR")} · refus : ${refused.toLocaleString("fr-FR")}.`,
  );

  return parts.join(" ");
}
