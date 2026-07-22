import { describe, expect, it } from "vitest";
import {
  ratioRabServisPct,
  sumServiceMetrics,
  sumServiceWasteWeightG,
} from "@/lib/commissionBilan";
import { MealType } from "@/generated/prisma/client";

describe("commissionBilan", () => {
  it("agrège le RAB avec les autres métriques", () => {
    const from = new Date("2026-06-01T00:00:00");
    const to = new Date("2026-07-01T00:00:00");
    const total = sumServiceMetrics(
      [
        {
          date: new Date("2026-06-18T00:00:00"),
          mealType: MealType.LUNCH,
          metrics: [
            {
              presentCount: 25,
              servedCount: 25,
              rabCount: 2,
              refusedCount: 0,
              leftoversCount: 0,
            },
          ],
        },
      ],
      { mealType: MealType.LUNCH, fromInclusive: from, toExclusive: to },
    );
    expect(total.rab).toBe(2);
    expect(ratioRabServisPct(total.rab, total.served)).toBe(8);
  });

  it("agrège les déchets total et par cycle", () => {
    const from = new Date("2026-06-01T00:00:00");
    const to = new Date("2026-07-01T00:00:00");
    const waste = sumServiceWasteWeightG(
      [
        {
          date: new Date("2026-06-10T00:00:00"),
          mealType: MealType.LUNCH,
          wasteWeightG: 5000,
          wasteWeightMaternelleG: 2000,
          wasteWeightPrimaireG: 3000,
          metrics: [],
        },
        {
          date: new Date("2026-06-11T00:00:00"),
          mealType: MealType.LUNCH,
          wasteWeightG: 1000,
          metrics: [],
        },
      ],
      { mealType: MealType.LUNCH, fromInclusive: from, toExclusive: to },
    );
    expect(waste.wasteWeightG).toBe(6000);
    expect(waste.wasteWeightMaternelleG).toBe(2000);
    expect(waste.wasteWeightPrimaireG).toBe(3000);
    expect(waste.servicesWithWaste).toBe(2);
  });
});
