import { describe, expect, it } from "vitest";
import { buildEndOfServiceBilanTips } from "@/lib/antiWasteEndOfServiceBilan";
import { buildRiskyDishesRanking } from "@/lib/antiWasteRiskyDishes";

describe("buildEndOfServiceBilanTips", () => {
  it("signale un jour au-dessus de l’objectif", () => {
    const tips = buildEndOfServiceBilanTips({
      wasteWeightG: 5000,
      served: 40,
      rab: 5,
      refused: 2,
      targetGPer100: 80,
      mainLabels: ["Lasagnes"],
      allLabels: ["Salade", "Lasagnes", "Yaourt"],
    });
    expect(tips).toHaveLength(3);
    expect(tips[0]!.tone).toBe("watch");
    expect(tips[0]!.text.toLowerCase()).toContain("objectif");
  });

  it("félicite sous l’objectif", () => {
    const tips = buildEndOfServiceBilanTips({
      wasteWeightG: 2000,
      served: 40,
      rab: 2,
      refused: 0,
      targetGPer100: 80,
      mainLabels: ["Poulet"],
      allLabels: ["Poulet"],
    });
    expect(tips[0]!.tone).toBe("ok");
  });
});

describe("buildRiskyDishesRanking", () => {
  it("classe les plats des jours à fort gaspillage", () => {
    const rows = buildRiskyDishesRanking(
      [
        {
          wasteGramsPer100: 150,
          menuLabels: ["Salade", "Lasagnes", "Yaourt"],
          mainLabels: ["Lasagnes"],
        },
        {
          wasteGramsPer100: 140,
          menuLabels: ["Soupe", "Lasagnes", "Fruit"],
          mainLabels: ["Lasagnes"],
        },
        {
          wasteGramsPer100: 50,
          menuLabels: ["Carottes", "Poulet", "Yaourt"],
          mainLabels: ["Poulet"],
        },
      ],
      80,
      { limit: 5 },
    );
    expect(rows[0]!.label.toLowerCase()).toContain("lasagne");
    expect(rows[0]!.avgWasteGPer100).toBeGreaterThan(100);
    expect(rows[0]!.vsTarget).toBe("above");
  });
});
