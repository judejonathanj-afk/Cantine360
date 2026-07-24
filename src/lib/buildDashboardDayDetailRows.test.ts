import { describe, expect, it } from "vitest";
import { buildDashboardDayDetailRows } from "@/lib/buildDashboardDayDetailRows";

describe("buildDashboardDayDetailRows", () => {
  it("enrichit les lignes jour (taux, menu, pesée, delta)", () => {
    const rows = buildDashboardDayDetailRows(
      [
        {
          date: new Date("2026-07-21T00:00:00"),
          wasteWeightG: 2000,
          wasteWeightMaternelleG: 800,
          wasteWeightPrimaireG: 1200,
          metrics: [
            {
              presentCount: 40,
              servedCount: 40,
              rabCount: 4,
              refusedCount: 2,
              group: {
                id: "g1",
                name: "MS A",
                level: "MATERNELLE",
                school: { name: "École Anne Frank" },
              },
            },
          ],
          menu: {
            items: [
              { category: "STARTER", label: "salade", allergens: ["Œufs"] },
              { category: "MAIN", label: "lasagnes", allergens: [] },
              { category: "DESSERT", label: "yaourt", allergens: ["Lait"] },
            ],
          },
        },
        {
          date: new Date("2026-07-22T00:00:00"),
          wasteWeightG: 2500,
          wasteWeightMaternelleG: 1000,
          wasteWeightPrimaireG: 1500,
          metrics: [
            {
              presentCount: 45,
              servedCount: 44,
              rabCount: 5,
              refusedCount: 1,
              group: {
                id: "g1",
                name: "MS A",
                level: "MATERNELLE",
                school: { name: "École Anne Frank" },
              },
            },
          ],
          menu: {
            items: [
              { category: "MAIN", label: "poulet", allergens: [] },
            ],
          },
        },
      ],
      {
        levelFilter: "all",
        students: [{ id: "s1", allergens: ["Œufs"], groupId: "g1" }],
      },
    );

    expect(rows).toHaveLength(2);
    expect(rows[0]?.menuSummary).toContain("Entrée : salade");
    expect(rows[0]?.weighLabel).toBe("Les deux");
    expect(rows[0]?.concernedStudents).toBe(1);
    expect(rows[0]?.rabRatePct).toBe(10);
    expect(rows[1]?.servedDelta).toBe(4);
    expect(rows[1]?.wasteDelta).toBe(500);
    expect(rows[1]?.concernedStudents).toBe(0);
  });
});
