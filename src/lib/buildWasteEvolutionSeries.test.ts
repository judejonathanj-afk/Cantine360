import { describe, expect, it } from "vitest";
import { buildWasteEvolutionSeries } from "@/lib/buildWasteEvolutionSeries";

describe("buildWasteEvolutionSeries", () => {
  it("agrège par date et calcule les g pour 100 assiettes", () => {
    const series = buildWasteEvolutionSeries([
      { date: "2026-07-03", wasteWeightG: 8500, served: 200 },
      { date: "2026-07-10", wasteWeightG: 350, served: 180 },
    ]);

    expect(series).toHaveLength(2);
    expect(series[0].wasteWeightG).toBe(8500);
    expect(series[0].gramsPer100Served).toBe(4250);
    expect(series[1].wasteWeightG).toBe(350);
    expect(series[1].gramsPer100Served).toBeCloseTo(194.4, 1);
  });

  it("retourne null pour le ratio sans portions servies", () => {
    const series = buildWasteEvolutionSeries([
      { date: "2026-07-10", wasteWeightG: 400, served: 0 },
    ]);
    expect(series[0].gramsPer100Served).toBeNull();
  });
});
