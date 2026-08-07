import { describe, expect, it } from "vitest";
import {
  MATERNELLE_PORTION_FACTOR,
  buildAntiWasteKitchenAdvice,
  buildLevelPortionSuggestions,
  labelsOverlap,
  normalizeDishLabel,
} from "@/lib/antiWasteKitchenAdvice";

describe("antiWasteKitchenAdvice", () => {
  it("normalise les libellés de plats", () => {
    expect(normalizeDishLabel("Lasagnes")).toBe("lasagnes");
    expect(normalizeDishLabel("  Pâtes  bolognaise ")).toBe("pates bolognaise");
  });

  it("détecte un plat en commun", () => {
    expect(labelsOverlap(["Lasagnes", "Yaourt"], ["salade", "lasagnes"])).toBe(
      "Lasagnes",
    );
    expect(labelsOverlap(["soupe"], ["lasagnes"])).toBeNull();
  });

  it("propose des portions mat. plus petites que prim.", () => {
    const portions = buildLevelPortionSuggestions(200, [
      { level: "MATERNELLE", presentCount: 20, servedCount: 0 },
      { level: "PRIMAIRE", presentCount: 40, servedCount: 0 },
    ]);
    const mat = portions.find((p) => p.level === "MATERNELLE")!;
    const prim = portions.find((p) => p.level === "PRIMAIRE")!;
    expect(mat.gramsPerPlate).toBe(Math.round(200 * MATERNELLE_PORTION_FACTOR));
    expect(prim.gramsPerPlate).toBe(200);
    expect(mat.plannedGrams).toBe(mat.gramsPerPlate! * 20);
    expect(prim.plannedGrams).toBe(200 * 40);
  });

  it("conseille de réduire si le même plat a généré beaucoup de déchets", () => {
    const advice = buildAntiWasteKitchenAdvice({
      perPlateBase: 260,
      metrics: [
        { level: "MATERNELLE", presentCount: 10, servedCount: 0 },
        { level: "PRIMAIRE", presentCount: 30, servedCount: 0 },
      ],
      currentLabels: ["salade", "lasagnes", "yaourt"],
      currentMainLabels: ["lasagnes"],
      pastServices: [
        {
          date: new Date("2026-07-20T12:00:00Z"),
          menuLabels: ["salade", "lasagnes", "fruit"],
          mainLabels: ["lasagnes"],
          wasteWeightG: 5000,
          served: 40,
          rab: 5,
        },
      ],
      targetGPer100: 80,
    });
    expect(advice.tipTone).toBe("watch");
    expect(advice.matchedDish?.toLowerCase()).toContain("lasagne");
    expect(advice.tip.toLowerCase()).toContain("servir plus petit");
    expect(advice.totalPlannedKgLabel).toBeTruthy();
  });

  it("donne un conseil neutre sans historique", () => {
    const advice = buildAntiWasteKitchenAdvice({
      perPlateBase: null,
      metrics: [],
      currentLabels: ["soupe"],
      currentMainLabels: [],
      pastServices: [],
      targetGPer100: null,
    });
    expect(advice.tipTone).toBe("info");
    expect(advice.matchedDish).toBeNull();
  });
});
