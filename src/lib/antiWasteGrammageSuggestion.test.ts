import { describe, expect, it } from "vitest";
import {
  ANTI_WASTE_DEFAULT_GRAMMAGE,
  resolveGrammageSuggestion,
} from "@/lib/antiWasteGrammageSuggestion";

describe("resolveGrammageSuggestion", () => {
  it("demande l’intitulé avant d’adapter", () => {
    const s = resolveGrammageSuggestion({
      category: "STARTER",
      label: "",
      historyByLabel: {},
      targetGPer100: 80,
    });
    expect(s.source).toBe("need-label");
    expect(s.grams).toBe(ANTI_WASTE_DEFAULT_GRAMMAGE.STARTER);
  });

  it("utilise le repère catégorie sans historique du plat", () => {
    const s = resolveGrammageSuggestion({
      category: "MAIN",
      label: "Lasagnes",
      historyByLabel: {},
      targetGPer100: 80,
    });
    expect(s.grams).toBe(ANTI_WASTE_DEFAULT_GRAMMAGE.MAIN);
    expect(s.source).toBe("default");
    expect(s.sourceLabel.toLowerCase()).toContain("lasagne");
  });

  it("réduit le grammage si la salade a beaucoup gaspillé", () => {
    const s = resolveGrammageSuggestion({
      category: "STARTER",
      label: "Salade",
      historyByLabel: {
        salade: {
          avgGrammageG: 60,
          avgWasteGPer100: 150,
          serviceCount: 3,
        },
      },
      targetGPer100: 80,
    });
    expect(s.source).toBe("adapted");
    expect(s.grams).toBeLessThan(60);
    expect(s.sourceLabel.toLowerCase()).toContain("salade");
    expect(s.sourceLabel.toLowerCase()).toContain("gaspillage");
  });

  it("garde une portion proche si le gaspillage était maîtrisé", () => {
    const s = resolveGrammageSuggestion({
      category: "STARTER",
      label: "Salade",
      historyByLabel: {
        salade: {
          avgGrammageG: 55,
          avgWasteGPer100: 60,
          serviceCount: 2,
        },
      },
      targetGPer100: 80,
    });
    expect(s.source).toBe("adapted");
    expect(s.grams).toBeGreaterThanOrEqual(50);
    expect(s.grams).toBeLessThanOrEqual(55);
  });
});
