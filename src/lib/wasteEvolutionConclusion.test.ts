import { describe, expect, it } from "vitest";
import { buildWasteEvolutionSeries } from "@/lib/buildWasteEvolutionSeries";
import { buildWasteEvolutionConclusion } from "@/lib/wasteEvolutionConclusion";

describe("buildWasteEvolutionConclusion", () => {
  it("indique l’absence de pesée", () => {
    const text = buildWasteEvolutionConclusion([], {
      days: 7,
      level: "MATERNELLE",
    });
    expect(text).toContain("Pas encore de pesée en maternelle");
  });

  it("résume pic, total et tendance à la baisse", () => {
    const series = buildWasteEvolutionSeries([
      { date: "2026-10-12", wasteWeightG: 2000, served: 100 },
      { date: "2026-10-14", wasteWeightG: 400, served: 100 },
    ]);
    const text = buildWasteEvolutionConclusion(series, {
      days: 7,
      level: "PRIMAIRE",
    });
    expect(text).toContain("En primaire");
    expect(text).toMatch(/2[\s\u00a0\u202f]400 g/);
    expect(text).toContain("à la baisse");
    expect(text).toContain("g pour 100 assiettes");
  });
});
