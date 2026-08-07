import { describe, expect, it } from "vitest";
import {
  ANTI_WASTE_DEFAULT_GRAMMAGE,
  resolveGrammageSuggestion,
} from "@/lib/antiWasteGrammageSuggestion";

describe("resolveGrammageSuggestion", () => {
  it("utilise le repère catégorie sans historique", () => {
    const s = resolveGrammageSuggestion({
      category: "MAIN",
      label: "Lasagnes",
      historyByLabel: {},
    });
    expect(s.grams).toBe(ANTI_WASTE_DEFAULT_GRAMMAGE.MAIN);
    expect(s.source).toBe("default");
  });

  it("préfère la moyenne historique du même plat", () => {
    const s = resolveGrammageSuggestion({
      category: "STARTER",
      label: "Yaourt",
      historyByLabel: { yaourt: 55 },
    });
    expect(s.grams).toBe(55);
    expect(s.source).toBe("history");
  });
});
