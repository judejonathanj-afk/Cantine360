import { describe, expect, it } from "vitest";
import { buildCycleRatesConclusion } from "@/lib/cycleRatesConclusion";

describe("buildCycleRatesConclusion", () => {
  it("indique l’absence de compteurs", () => {
    const text = buildCycleRatesConclusion(
      { present: 0, served: 0, rab: 0, refused: 0 },
      { days: 7, level: "MATERNELLE" },
    );
    expect(text).toContain("Pas encore de compteurs en maternelle");
  });

  it("résume service, RAB et refus", () => {
    const text = buildCycleRatesConclusion(
      { present: 100, served: 70, rab: 20, refused: 15 },
      { days: 30, level: "PRIMAIRE" },
    );
    expect(text).toContain("En primaire");
    expect(text).toContain("70 %");
    expect(text).toContain("RAB");
    expect(text).toContain("refus");
  });
});
