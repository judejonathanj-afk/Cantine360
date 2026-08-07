import { normalizeDishLabel } from "@/lib/antiWasteKitchenAdvice";

export type MenuCategoryKey = "STARTER" | "MAIN" | "DESSERT" | "OTHER";

/** Repères grammage (g/assiette) orientés anti-gaspi — primaire. */
export const ANTI_WASTE_DEFAULT_GRAMMAGE: Record<MenuCategoryKey, number> = {
  STARTER: 50,
  MAIN: 140,
  DESSERT: 70,
  OTHER: 40,
};

export type GrammageSuggestion = {
  grams: number;
  source: "history" | "default";
  /** Court libellé pour l’UI. */
  sourceLabel: string;
};

/**
 * Proposition de grammage : moyenne historique du même plat si dispo,
 * sinon repère par catégorie.
 */
export function resolveGrammageSuggestion(input: {
  category: MenuCategoryKey;
  label: string;
  historyByLabel: Record<string, number>;
}): GrammageSuggestion {
  const key = normalizeDishLabel(input.label);
  const fromHistory = key ? input.historyByLabel[key] : undefined;
  if (fromHistory != null && fromHistory > 0) {
    return {
      grams: Math.round(fromHistory),
      source: "history",
      sourceLabel: "moyenne des services précédents pour ce plat",
    };
  }
  const grams = ANTI_WASTE_DEFAULT_GRAMMAGE[input.category];
  return {
    grams,
    source: "default",
    sourceLabel: "repère anti-gaspi pour cette rubrique",
  };
}
