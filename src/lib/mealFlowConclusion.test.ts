import { describe, expect, it } from "vitest";
import { buildMealFlowSeries } from "@/lib/buildMealFlowSeries";
import { buildMealFlowConclusion } from "@/lib/mealFlowConclusion";

describe("buildMealFlowConclusion", () => {
  it("indique l’absence de compteurs", () => {
    const text = buildMealFlowConclusion([], {
      days: 7,
      level: "MATERNELLE",
    });
    expect(text).toContain("Pas encore de compteurs en maternelle");
  });

  it("résume présents, servis, écart et RAB / refus", () => {
    const series = buildMealFlowSeries([
      {
        date: "2026-09-29",
        present: 100,
        served: 80,
        rab: 10,
        refused: 5,
      },
      {
        date: "2026-10-27",
        present: 90,
        served: 88,
        rab: 4,
        refused: 2,
      },
    ]);
    const text = buildMealFlowConclusion(series, {
      days: 30,
      level: "PRIMAIRE",
    });
    expect(text).toContain("En primaire");
    expect(text).toContain("190");
    expect(text).toContain("168");
    expect(text).toContain("RAB");
    expect(text).toContain("refus");
    expect(text).toContain("baisse");
  });
});
