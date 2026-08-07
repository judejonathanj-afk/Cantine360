import { normalizeDishLabel } from "@/lib/antiWasteKitchenAdvice";

export type MenuCategoryKey = "STARTER" | "MAIN" | "DESSERT" | "OTHER";

/** Repères grammage (g/assiette) orientés anti-gaspi — primaire. */
export const ANTI_WASTE_DEFAULT_GRAMMAGE: Record<MenuCategoryKey, number> = {
  STARTER: 50,
  MAIN: 140,
  DESSERT: 70,
  OTHER: 40,
};

export type DishWasteHistory = {
  /** Moyenne des grammages déjà saisis pour ce plat. */
  avgGrammageG: number | null;
  /** Moyenne g / 100 assiettes les jours où ce plat était au menu. */
  avgWasteGPer100: number | null;
  /** Nombre de services trouvés avec ce plat. */
  serviceCount: number;
};

export type GrammageSuggestion = {
  grams: number;
  source: "adapted" | "history" | "default" | "need-label";
  sourceLabel: string;
};

function findHistoryEntry(
  label: string,
  historyByLabel: Record<string, DishWasteHistory>,
): { key: string; entry: DishWasteHistory } | null {
  const key = normalizeDishLabel(label);
  if (!key) return null;
  if (historyByLabel[key]) return { key, entry: historyByLabel[key]! };

  for (const [k, entry] of Object.entries(historyByLabel)) {
    if (k.includes(key) || key.includes(k)) {
      return { key: k, entry };
    }
  }
  return null;
}

function clampGrammage(n: number): number {
  return Math.max(15, Math.min(5000, Math.round(n)));
}

/**
 * Proposition de grammage selon l’intitulé :
 * - historique du plat + adaptation si gaspillage élevé
 * - sinon repère par rubrique
 */
export function resolveGrammageSuggestion(input: {
  category: MenuCategoryKey;
  label: string;
  historyByLabel: Record<string, DishWasteHistory>;
  targetGPer100: number | null;
}): GrammageSuggestion {
  const trimmed = input.label.trim();
  if (!trimmed) {
    return {
      grams: ANTI_WASTE_DEFAULT_GRAMMAGE[input.category],
      source: "need-label",
      sourceLabel:
        "saisissez l’intitulé (ex. salade) pour adapter au gaspillage passé",
    };
  }

  const hit = findHistoryEntry(trimmed, input.historyByLabel);
  const categoryDefault = ANTI_WASTE_DEFAULT_GRAMMAGE[input.category];
  const target =
    input.targetGPer100 != null && input.targetGPer100 > 0
      ? input.targetGPer100
      : 80;

  if (!hit) {
    return {
      grams: categoryDefault,
      source: "default",
      sourceLabel: `pas encore d’historique pour « ${trimmed} » — repère ${input.category === "STARTER" ? "entrée" : input.category === "MAIN" ? "plat" : input.category === "DESSERT" ? "dessert" : "autre"}`,
    };
  }

  const { entry } = hit;
  const base =
    entry.avgGrammageG != null && entry.avgGrammageG > 0
      ? entry.avgGrammageG
      : categoryDefault;

  const waste = entry.avgWasteGPer100;
  if (waste == null || waste <= 0) {
    return {
      grams: clampGrammage(base),
      source: "history",
      sourceLabel: `moyenne saisie pour « ${trimmed} » (${entry.serviceCount} service${entry.serviceCount > 1 ? "s" : ""})`,
    };
  }

  let factor = 1;
  let reason: string;
  if (waste > target * 1.25 || waste >= 120) {
    factor = 0.78;
    reason = `gaspillage élevé (~${Math.round(waste)} g / 100) — portion réduite`;
  } else if (waste > target) {
    factor = 0.88;
    reason = `au-dessus de l’objectif (~${Math.round(waste)} g / 100) — légère réduction`;
  } else {
    factor = 0.95;
    reason = `gaspillage maîtrisé (~${Math.round(waste)} g / 100) — portion proche de l’habitude`;
  }

  return {
    grams: clampGrammage(base * factor),
    source: "adapted",
    sourceLabel: `« ${trimmed} » · ${reason}`,
  };
}
