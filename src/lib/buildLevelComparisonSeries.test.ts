import { describe, expect, it } from "vitest";
import {
  aggregateTotalsByLevel,
  buildLevelComparisonBars,
  buildLevelRateBars,
  levelComparisonHasData,
  levelTotalsHasData,
} from "@/lib/buildLevelComparisonSeries";

describe("buildLevelComparisonSeries", () => {
  it("agrège par niveau et calcule les taux en %", () => {
    const byLevel = aggregateTotalsByLevel([
      {
        level: "MATERNELLE",
        presentCount: 100,
        servedCount: 80,
        rabCount: 8,
        refusedCount: 4,
      },
      {
        level: "PRIMAIRE",
        presentCount: 200,
        servedCount: 180,
        rabCount: 9,
        refusedCount: 6,
      },
      {
        level: null,
        presentCount: 50,
        servedCount: 40,
        rabCount: 2,
        refusedCount: 1,
      },
    ]);

    expect(byLevel.MATERNELLE.served).toBe(80);
    expect(byLevel.PRIMAIRE.present).toBe(250);
    expect(byLevel.PRIMAIRE.served).toBe(220);

    const bars = buildLevelComparisonBars(byLevel);
    expect(bars).toHaveLength(3);
    expect(bars[0].metric).toBe("Taux de service");
    expect(bars[0].maternelle).toBe(80);
    expect(bars[0].primaire).toBe(88);
    expect(bars[1].maternelle).toBe(10);
    expect(bars[2].primaire).toBeCloseTo(3.2, 1);
    expect(levelComparisonHasData(byLevel)).toBe(true);

    const matRates = buildLevelRateBars(byLevel.MATERNELLE);
    expect(matRates[0].rate).toBe(80);
    expect(matRates[1].rate).toBe(10);
    expect(levelTotalsHasData(byLevel.MATERNELLE)).toBe(true);
  });

  it("signale l’absence de données", () => {
    const empty = aggregateTotalsByLevel([]);
    expect(levelComparisonHasData(empty)).toBe(false);
    expect(levelTotalsHasData(empty.MATERNELLE)).toBe(false);
    expect(buildLevelComparisonBars(empty)[0].maternelle).toBe(0);
    expect(buildLevelRateBars(empty.PRIMAIRE)[0].rate).toBe(0);
  });
});
