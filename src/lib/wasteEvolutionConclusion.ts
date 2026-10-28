import type { WasteEvolutionPoint } from "@/lib/buildWasteEvolutionSeries";
import { schoolLevelLabelFr, type SchoolLevel } from "@/lib/schoolLevel";

function formatGrams(value: number) {
  return `${Math.round(value).toLocaleString("fr-FR")} g`;
}

export function buildWasteEvolutionConclusion(
  series: WasteEvolutionPoint[],
  opts: { days: 7 | 30; level: SchoolLevel },
): string {
  const levelName = schoolLevelLabelFr(opts.level).toLowerCase();
  const weighed = series.filter((point) => point.wasteWeightG > 0);

  if (weighed.length === 0) {
    return `Pas encore de pesée en ${levelName} sur les ${opts.days} derniers jours. Dès qu’un poids est saisi en fin de service, la tendance s’affichera ici.`;
  }

  const total = weighed.reduce((sum, point) => sum + point.wasteWeightG, 0);
  const peak = weighed.reduce((best, point) =>
    point.wasteWeightG > best.wasteWeightG ? point : best,
  );
  const ratios = weighed
    .map((point) => point.gramsPer100Served)
    .filter((value): value is number => value != null);
  const avgRatio =
    ratios.length > 0
      ? Math.round((ratios.reduce((sum, value) => sum + value, 0) / ratios.length) * 10) /
        10
      : null;

  const dayWord = weighed.length > 1 ? "jours pesés" : "jour pesé";
  const parts = [
    `En ${levelName}, ${formatGrams(total)} de déchets sur ${weighed.length} ${dayWord}.`,
    `Le pic est le ${peak.label} (${formatGrams(peak.wasteWeightG)}).`,
  ];

  if (weighed.length === 1) {
    parts.push("Une seule pesée : trop tôt pour une tendance.");
  } else {
    const first = weighed[0];
    const last = weighed[weighed.length - 1];
    const delta = last.wasteWeightG - first.wasteWeightG;
    const base = first.wasteWeightG;
    const pct = base > 0 ? Math.round((delta / base) * 100) : null;
    const stable = Math.abs(delta) < 80 && (pct == null || Math.abs(pct) < 10);
    if (stable) {
      parts.push("La tendance est plutôt stable.");
    } else if (delta < 0) {
      parts.push(
        `La tendance est à la baisse (${last.label} par rapport à ${first.label}).`,
      );
    } else {
      parts.push(
        `La tendance est à la hausse (${last.label} par rapport à ${first.label}).`,
      );
    }
  }

  if (avgRatio != null) {
    parts.push(
      `Moyenne : ${avgRatio.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} g pour 100 assiettes.`,
    );
  }

  return parts.join(" ");
}
