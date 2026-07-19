import { describe, expect, it } from "vitest";
import { buildMealFlowSeries } from "@/lib/buildMealFlowSeries";

describe("buildMealFlowSeries", () => {
  it("agrège par date et trie chronologiquement", () => {
    const series = buildMealFlowSeries([
      { date: "2026-07-10", present: 100, served: 80, rab: 5, refused: 2 },
      { date: "2026-07-03", present: 50, served: 40, rab: 1, refused: 0 },
      { date: "2026-07-10", present: 20, served: 15, rab: 1, refused: 1 },
    ]);

    expect(series).toHaveLength(2);
    expect(series[0].date).toBe("2026-07-03");
    expect(series[0].present).toBe(50);
    expect(series[1].present).toBe(120);
    expect(series[1].served).toBe(95);
    expect(series[1].rab).toBe(6);
    expect(series[1].refused).toBe(3);
    expect(series[0].label.length).toBeGreaterThan(0);
  });
});
