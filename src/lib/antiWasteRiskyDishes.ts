import { normalizeDishLabel } from "@/lib/antiWasteKitchenAdvice";

export type RiskyDishInputDay = {
  wasteGramsPer100: number | null;
  menuLabels: string[];
  mainLabels: string[];
};

export type RiskyDishRow = {
  label: string;
  avgWasteGPer100: number;
  serviceCount: number;
  vsTarget: "above" | "ok" | "unknown";
};

export type TodayRiskyDishAlert = {
  rank: number;
  label: string;
  avgWasteGPer100: number;
  tip: string;
};

/**
 * Classe les plats associés aux jours à fort gaspillage (g / 100).
 * Attribution : le g/100 du jour est lié à chaque plat du menu ce jour-là
 * (pesée globale, pas par plat).
 */
export function buildRiskyDishesRanking(
  days: RiskyDishInputDay[],
  targetGPer100: number | null,
  options?: { limit?: number; preferMain?: boolean },
): RiskyDishRow[] {
  const limit = options?.limit ?? 8;
  const preferMain = options?.preferMain ?? true;

  type Acc = { wasteSum: number; n: number; displayLabel: string };
  const byKey = new Map<string, Acc>();

  for (const day of days) {
    if (day.wasteGramsPer100 == null || day.wasteGramsPer100 <= 0) continue;
    const labels =
      preferMain && day.mainLabels.length > 0
        ? day.mainLabels
        : day.menuLabels;
    const seen = new Set<string>();
    for (const raw of labels) {
      const key = normalizeDishLabel(raw);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const cur = byKey.get(key) ?? {
        wasteSum: 0,
        n: 0,
        displayLabel: raw.trim(),
      };
      cur.wasteSum += day.wasteGramsPer100;
      cur.n += 1;
      byKey.set(key, cur);
    }
  }

  const target =
    targetGPer100 != null && targetGPer100 > 0 ? targetGPer100 : null;

  return [...byKey.entries()]
    .map(([, acc]) => {
      const avg = acc.wasteSum / acc.n;
      return {
        label: acc.displayLabel,
        avgWasteGPer100: avg,
        serviceCount: acc.n,
        vsTarget:
          target == null
            ? ("unknown" as const)
            : avg > target
              ? ("above" as const)
              : ("ok" as const),
      };
    })
    .filter((r) => r.serviceCount >= 1)
    .sort((a, b) => {
      if (b.avgWasteGPer100 !== a.avgWasteGPer100) {
        return b.avgWasteGPer100 - a.avgWasteGPer100;
      }
      return b.serviceCount - a.serviceCount;
    })
    .slice(0, limit);
}

/**
 * Si un plat du menu du jour est dans le classement « plats à risque »,
 * renvoie une alerte portions pour le service.
 */
export function buildTodayRiskyDishAlert(
  ranking: RiskyDishRow[],
  currentMainLabels: string[],
  currentMenuLabels: string[],
  options?: { topN?: number },
): TodayRiskyDishAlert | null {
  const topN = options?.topN ?? 5;
  const top = ranking.slice(0, topN);
  if (top.length === 0) return null;

  const candidates =
    currentMainLabels.length > 0 ? currentMainLabels : currentMenuLabels;

  for (const raw of candidates) {
    const key = normalizeDishLabel(raw);
    if (!key) continue;
    const hitIndex = top.findIndex((row) => {
      const rk = normalizeDishLabel(row.label);
      return rk === key || rk.includes(key) || key.includes(rk);
    });
    if (hitIndex < 0) continue;
    const hit = top[hitIndex]!;
    const g = hit.avgWasteGPer100.toLocaleString("fr-FR", {
      maximumFractionDigits: 0,
    });
    const label = raw.trim() || hit.label;
    return {
      rank: hitIndex + 1,
      label,
      avgWasteGPer100: hit.avgWasteGPer100,
      tip: `Plat à risque n°${hitIndex + 1} (« ${label} », ~${g} g / 100 en moyenne) — portions plus petites dès le premier service, surtout en maternelle, et proposer le RAB.`,
    };
  }
  return null;
}
