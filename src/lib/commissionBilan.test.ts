import { describe, expect, it } from "vitest";
import { ratioRabServisPct, sumServiceMetrics } from "@/lib/commissionBilan";
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
});
