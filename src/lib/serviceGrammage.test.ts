import { describe, expect, it } from "vitest";
import {
  computeServiceGrammageSummary,
  formatKgFromGrams,
  totalGrammagePerPlate,
} from "@/lib/serviceGrammage";

describe("serviceGrammage", () => {
  it("somme les grammages par assiette", () => {
    const total = totalGrammagePerPlate([
      { label: "lasagnes", category: "MAIN", grammageG: 120 },
      { label: "salade", category: "STARTER", grammageG: 80 },
      { label: "yaourt", category: "DESSERT", grammageG: 60 },
    ]);
    expect(total).toBe(260);
  });

  it("calcule les kg prévus à partir des servis", () => {
    const summary = computeServiceGrammageSummary(
      [
        { label: "lasagnes", category: "MAIN", grammageG: 120 },
        { label: "salade", category: "STARTER", grammageG: 80 },
        { label: "yaourt", category: "DESSERT", grammageG: 60 },
      ],
      [{ presentCount: 25, servedCount: 25, rabCount: 2 }],
    );
    expect(summary.perPlate).toBe(260);
    expect(summary.plannedGrams).toBe(6500);
    expect(summary.rabGrams).toBe(520);
    expect(summary.basisLabel).toBe("servis");
    expect(formatKgFromGrams(summary.plannedGrams)).toBe("6,5 kg");
    expect(formatKgFromGrams(summary.rabGrams)).toBe("0,5 kg");
  });

  it("utilise les présents si aucun servi", () => {
    const summary = computeServiceGrammageSummary(
      [{ label: "plat", category: "MAIN", grammageG: 100 }],
      [{ presentCount: 20, servedCount: 0, rabCount: 0 }],
    );
    expect(summary.basisCount).toBe(20);
    expect(summary.basisLabel).toBe("présents");
    expect(summary.plannedGrams).toBe(2000);
  });

  it("signale l’absence de grammage", () => {
    const summary = computeServiceGrammageSummary(
      [{ label: "plat", category: "MAIN", grammageG: null }],
      [{ presentCount: 10, servedCount: 10, rabCount: 0 }],
    );
    expect(summary.hasGrammage).toBe(false);
    expect(summary.plannedGrams).toBe(0);
  });
});
