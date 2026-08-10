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
